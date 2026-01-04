'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui';

interface PriceDataPoint {
    timestamp: number;
    date: string;
    price: number;
}

interface ChartData {
    token: string;
    currency: string;
    days: number;
    currentPrice: number;
    priceChange: number;
    priceChangePositive: boolean;
    high: number;
    low: number;
    prices: PriceDataPoint[];
}

interface ChartCardProps {
    token: string;
    days?: number;
}

export function ChartCard({ token, days = 30 }: ChartCardProps) {
    const [data, setData] = useState<ChartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchChart = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/chart?token=${token}&days=${days}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch chart data');
                }
                const chartData = await response.json();
                setData(chartData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchChart();
    }, [token, days]);

    if (loading) {
        return (
            <Card className="p-4 bg-zinc-900/50 border-zinc-800">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-zinc-500" size={24} />
                </div>
            </Card>
        );
    }

    if (error || !data) {
        return (
            <Card className="p-4 bg-zinc-900/50 border-zinc-800">
                <div className="text-center py-4 text-zinc-500 text-sm">
                    {error || 'No data available'}
                </div>
            </Card>
        );
    }

    // Calculate chart dimensions
    const chartWidth = 280;
    const chartHeight = 100;
    const padding = 10;

    // Normalize prices for SVG path
    const minPrice = Math.min(...data.prices.map(p => p.price));
    const maxPrice = Math.max(...data.prices.map(p => p.price));
    const priceRange = maxPrice - minPrice || 1;

    const points = data.prices.map((p, i) => {
        const x = padding + (i / (data.prices.length - 1)) * (chartWidth - 2 * padding);
        const y = chartHeight - padding - ((p.price - minPrice) / priceRange) * (chartHeight - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    const lineColor = data.priceChangePositive ? '#10b981' : '#ef4444';

    return (
        <Card className="p-4 bg-zinc-900/50 border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{data.token}</span>
                    <span className="text-xs text-zinc-500">{data.days} days</span>
                </div>
                <div className={`flex items-center gap-1 text-sm ${data.priceChangePositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {data.priceChangePositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {data.priceChange > 0 ? '+' : ''}{data.priceChange}%
                </div>
            </div>

            <div className="text-2xl font-bold text-white mb-3">
                ${data.currentPrice.toLocaleString()}
            </div>

            {/* Simple SVG Line Chart */}
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-24">
                {/* Gradient fill */}
                <defs>
                    <linearGradient id={`gradient-${token}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area fill */}
                <polygon
                    points={`${padding},${chartHeight - padding} ${points} ${chartWidth - padding},${chartHeight - padding}`}
                    fill={`url(#gradient-${token})`}
                />

                {/* Line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>

            <div className="flex justify-between text-xs text-zinc-500 mt-2">
                <span>Low: ${data.low.toLocaleString()}</span>
                <span>High: ${data.high.toLocaleString()}</span>
            </div>
        </Card>
    );
}
