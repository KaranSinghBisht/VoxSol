#!/usr/bin/env node
/**
 * VoxSol Vault Setup Script
 * 
 * Generates a vault keypair and provides instructions for funding.
 * 
 * Usage:
 *   node scripts/setup-vault.js
 * 
 * After running:
 * 1. Add VAULT_PRIVATE_KEY to apps/web/.env.local
 * 2. Fund the vault with devnet SOL: solana airdrop 2 <vault_address> --url devnet
 * 3. Get devnet USDC from a faucet and send to the vault
 */

const { Keypair } = require('@solana/web3.js');

// Generate a new vault keypair
const vaultKeypair = Keypair.generate();

// Convert secret key to base58 manually (bs58 encoding)
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function toBase58(bytes) {
    const digits = [0];
    for (let i = 0; i < bytes.length; i++) {
        let carry = bytes[i];
        for (let j = 0; j < digits.length; j++) {
            carry += digits[j] << 8;
            digits[j] = carry % 58;
            carry = (carry / 58) | 0;
        }
        while (carry) {
            digits.push(carry % 58);
            carry = (carry / 58) | 0;
        }
    }
    let str = '';
    for (let k = 0; bytes[k] === 0 && k < bytes.length - 1; k++) str += '1';
    for (let q = digits.length - 1; q >= 0; q--) str += ALPHABET[digits[q]];
    return str;
}

const privateKeyBase58 = toBase58(Buffer.from(vaultKeypair.secretKey));

console.log('\n🔐 VoxSol Vault Setup\n');
console.log('='.repeat(60));
console.log('\n📋 Vault Address (Public Key):');
console.log(`   ${vaultKeypair.publicKey.toBase58()}`);
console.log('\n🔑 Vault Private Key (Base58 - KEEP SECRET!):');
console.log(`   ${privateKeyBase58}`);
console.log('\n' + '='.repeat(60));

console.log('\n📝 Next Steps:\n');
console.log('1. Add this to your apps/web/.env.local file:');
console.log(`   VAULT_PRIVATE_KEY=${privateKeyBase58}`);
console.log('\n2. Fund the vault with devnet SOL:');
console.log(`   solana airdrop 2 ${vaultKeypair.publicKey.toBase58()} --url devnet`);
console.log('\n3. Get devnet USDC from a faucet:');
console.log('   - Go to https://spl-token-faucet.com/?token-name=USDC-Dev');
console.log('   - Or use the devnet USDC mint: Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');
console.log(`   - Send to vault: ${vaultKeypair.publicKey.toBase58()}`);
console.log('\n4. Check vault balance at:');
console.log('   GET http://localhost:3000/api/vault-swap');
console.log('\n✅ Vault setup complete!\n');
