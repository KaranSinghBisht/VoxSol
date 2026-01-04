import { NextRequest, NextResponse } from 'next/server';
import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    createTransferInstruction,
    TOKEN_PROGRAM_ID,
    getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import bs58 from 'bs58';

// Devnet RPC
const RPC_URL = 'https://api.devnet.solana.com';

// Devnet USDC mint
const USDC_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');

// USDC has 6 decimals
const USDC_DECIMALS = 6;

// Get current SOL price (simplified - in production use an oracle)
async function getSOLPrice(): Promise<number> {
    try {
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
        );
        const data = await response.json();
        return data.solana?.usd || 150; // Fallback to $150
    } catch {
        return 150; // Default price
    }
}

// Load vault keypair from environment
function getVaultKeypair(): Keypair {
    const privateKey = process.env.VAULT_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('VAULT_PRIVATE_KEY not configured');
    }
    return Keypair.fromSecretKey(bs58.decode(privateKey));
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { direction, amount, userWallet } = body;

        // Validate inputs
        if (!direction || !amount || !userWallet) {
            return NextResponse.json(
                { error: 'Missing required fields: direction, amount, userWallet' },
                { status: 400 }
            );
        }

        if (!['SOL_TO_USDC', 'USDC_TO_SOL'].includes(direction)) {
            return NextResponse.json(
                { error: 'Invalid direction. Use SOL_TO_USDC or USDC_TO_SOL' },
                { status: 400 }
            );
        }

        const connection = new Connection(RPC_URL, 'confirmed');
        const vaultKeypair = getVaultKeypair();
        const userPubkey = new PublicKey(userWallet);

        // Get current SOL price
        const solPrice = await getSOLPrice();

        let txSignature: string;

        if (direction === 'SOL_TO_USDC') {
            // User sends SOL, vault sends USDC
            const solAmount = parseFloat(amount);
            const usdcAmount = Math.floor(solAmount * solPrice * Math.pow(10, USDC_DECIMALS));

            // Get vault's USDC token account
            const vaultUsdcAccount = await getAssociatedTokenAddress(
                USDC_MINT,
                vaultKeypair.publicKey
            );

            // Get or create user's USDC token account
            const userUsdcAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                vaultKeypair, // Vault pays for account creation
                USDC_MINT,
                userPubkey
            );

            // Check vault USDC balance
            const vaultUsdcBalance = await connection.getTokenAccountBalance(vaultUsdcAccount);
            if (parseInt(vaultUsdcBalance.value.amount) < usdcAmount) {
                return NextResponse.json(
                    { error: 'Insufficient vault USDC balance' },
                    { status: 400 }
                );
            }

            // Create transfer instruction
            const transaction = new Transaction().add(
                createTransferInstruction(
                    vaultUsdcAccount,
                    userUsdcAccount.address,
                    vaultKeypair.publicKey,
                    usdcAmount
                )
            );

            // Send transaction
            txSignature = await sendAndConfirmTransaction(connection, transaction, [vaultKeypair]);

            return NextResponse.json({
                success: true,
                direction,
                inputAmount: `${solAmount} SOL`,
                outputAmount: `${usdcAmount / Math.pow(10, USDC_DECIMALS)} USDC`,
                price: `$${solPrice}`,
                txSignature,
                explorerUrl: `https://solscan.io/tx/${txSignature}?cluster=devnet`,
            });

        } else {
            // User sends USDC, vault sends SOL
            const usdcAmount = parseFloat(amount);
            const solAmount = usdcAmount / solPrice;
            const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

            // Check vault SOL balance
            const vaultBalance = await connection.getBalance(vaultKeypair.publicKey);
            if (vaultBalance < lamports + 5000) { // Leave some for fees
                return NextResponse.json(
                    { error: 'Insufficient vault SOL balance' },
                    { status: 400 }
                );
            }

            // Create SOL transfer
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: vaultKeypair.publicKey,
                    toPubkey: userPubkey,
                    lamports,
                })
            );

            // Send transaction
            txSignature = await sendAndConfirmTransaction(connection, transaction, [vaultKeypair]);

            return NextResponse.json({
                success: true,
                direction,
                inputAmount: `${usdcAmount} USDC`,
                outputAmount: `${solAmount.toFixed(6)} SOL`,
                price: `$${solPrice}`,
                txSignature,
                explorerUrl: `https://solscan.io/tx/${txSignature}?cluster=devnet`,
            });
        }
    } catch (error: any) {
        console.error('Vault swap error:', error);
        return NextResponse.json(
            { error: error.message || 'Swap failed' },
            { status: 500 }
        );
    }
}

// GET endpoint to check vault balances
export async function GET() {
    try {
        const connection = new Connection(RPC_URL, 'confirmed');
        const vaultKeypair = getVaultKeypair();

        // Get SOL balance
        const solBalance = await connection.getBalance(vaultKeypair.publicKey);

        // Get USDC balance
        let usdcBalance = 0;
        try {
            const vaultUsdcAccount = await getAssociatedTokenAddress(
                USDC_MINT,
                vaultKeypair.publicKey
            );
            const tokenBalance = await connection.getTokenAccountBalance(vaultUsdcAccount);
            usdcBalance = parseFloat(tokenBalance.value.uiAmountString || '0');
        } catch {
            usdcBalance = 0;
        }

        // Get current price
        const solPrice = await getSOLPrice();

        return NextResponse.json({
            vaultAddress: vaultKeypair.publicKey.toBase58(),
            balances: {
                SOL: solBalance / LAMPORTS_PER_SOL,
                USDC: usdcBalance,
            },
            currentPrice: `$${solPrice}`,
            network: 'devnet',
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to get vault status' },
            { status: 500 }
        );
    }
}
