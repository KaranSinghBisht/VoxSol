'use client';

import React from 'react';

interface MarqueeProps {
    items: string[];
    speed?: number;
    direction?: 'left' | 'right';
    className?: string;
}

const Marquee: React.FC<MarqueeProps> = ({
    items,
    speed = 30,
    direction = 'left',
    className = ''
}) => {
    const animationDirection = direction === 'left' ? 'normal' : 'reverse';
    const duration = items.length * speed / 10;

    return (
        <div className={`overflow-hidden ${className}`}>
            <div
                className="flex gap-16 items-center"
                style={{
                    animation: `marquee ${duration}s linear infinite`,
                    animationDirection,
                }}
            >
                {/* Duplicate items for seamless loop */}
                {[...items, ...items, ...items].map((item, index) => (
                    <span
                        key={index}
                        className="font-mono text-lg font-bold tracking-tight text-zinc-600 hover:text-purple-400 transition-colors whitespace-nowrap"
                    >
                        {item}
                    </span>
                ))}
            </div>

            <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
      `}</style>
        </div>
    );
};

export default Marquee;
