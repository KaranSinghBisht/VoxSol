import { NextRequest, NextResponse } from 'next/server';

const SOLSCAN_API_URL = 'https://pro-api.solscan.io/v2.0';

export async function GET(
    request: NextRequest,
    { params }: { params: { address: string } }
) {
    const address = params.address;

    if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const apiKey = process.env.SOLSCAN_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Solscan API key not configured' }, { status: 500 });
    }

    try {
        // Fetch account info (SOL balance)
        const accountResponse = await fetch(
            `${SOLSCAN_API_URL}/account?address=${address}`,
            {
                headers: {
                    'token': apiKey,
                },
            }
        );

        if (!accountResponse.ok) {
            console.error('Solscan account error:', await accountResponse.text());
            return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
        }

        const accountData = await accountResponse.json();

        // Fetch token balances
        const tokensResponse = await fetch(
            `${SOLSCAN_API_URL}/account/tokens?address=${address}&page=1&page_size=20`,
            {
                headers: {
                    'token': apiKey,
                },
            }
        );

        let tokensData = { data: [] };
        if (tokensResponse.ok) {
            tokensData = await tokensResponse.json();
        }

        // Get SOL balance in SOL (not lamports)
        const lamports = accountData.data?.lamports || 0;
        const solBalance = lamports / 1e9;

        // Format token balances
        const tokens = (tokensData.data || []).map((token: any) => ({
            mint: token.tokenAddress,
            symbol: token.tokenSymbol || 'Unknown',
            name: token.tokenName || 'Unknown Token',
            balance: token.tokenAmount?.uiAmount || 0,
            decimals: token.tokenAmount?.decimals || 0,
            logo: token.tokenIcon || null,
        }));

        return NextResponse.json({
            address,
            solBalance,
            lamports,
            tokens,
            owner: accountData.data?.owner,
        });
    } catch (error) {
        console.error('Solscan error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
