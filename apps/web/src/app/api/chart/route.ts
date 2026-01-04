import { NextRequest, NextResponse } from 'next/server';

// CoinGecko free API for price history
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Map common symbols to CoinGecko IDs
const TOKEN_IDS: Record<string, string> = {
    'SOL': 'solana',
    'SOLANA': 'solana',
    'BTC': 'bitcoin',
    'BITCOIN': 'bitcoin',
    'ETH': 'ethereum',
    'ETHEREUM': 'ethereum',
    'USDC': 'usd-coin',
    'USDT': 'tether',
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token')?.toUpperCase() || 'SOL';
    const days = searchParams.get('days') || '30';
    const currency = searchParams.get('currency') || 'usd';

    const coinId = TOKEN_IDS[token];
    if (!coinId) {
        return NextResponse.json(
            { error: `Unknown token: ${token}. Supported: ${Object.keys(TOKEN_IDS).join(', ')}` },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(
            `${COINGECKO_API_URL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`,
            {
                headers: {
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error('CoinGecko error:', await response.text());
            return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 });
        }

        const data = await response.json();

        // Format prices for chart
        const prices = data.prices.map(([timestamp, price]: [number, number]) => ({
            timestamp,
            date: new Date(timestamp).toLocaleDateString(),
            price: Number(price.toFixed(2)),
        }));

        // Get current price and calculate change
        const currentPrice = prices[prices.length - 1]?.price || 0;
        const startPrice = prices[0]?.price || 0;
        const priceChange = startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;

        return NextResponse.json({
            token,
            coinId,
            currency,
            days: Number(days),
            currentPrice,
            priceChange: Number(priceChange.toFixed(2)),
            priceChangePositive: priceChange >= 0,
            high: Math.max(...prices.map((p: any) => p.price)),
            low: Math.min(...prices.map((p: any) => p.price)),
            prices,
            dataPoints: prices.length,
        });
    } catch (error) {
        console.error('Chart API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
