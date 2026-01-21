'use client';

import React from 'react';
import { useVoteStore } from '@/stores/useVoteStore';

interface RouletteDisplayProps {
    items: { name: string; weight: number }[];
    rotation?: number; // Only for overlay?
    className?: string;
    style?: React.CSSProperties;
}

export default function RouletteDisplay({ items, className, style }: RouletteDisplayProps) {
    const store = useVoteStore();

    // Logic from Vue component (Step 1244)
    // 360deg / total weights...
    // But Vue component used "equal size wedges" visually or dynamic?
    // Step 1244 code showed: `v-for="(item, idx) in effectiveItems" ... rotate(${getSegmentRotation(idx)}deg)`
    // And `effectiveItems` were just items.
    // It seems the prototype used EQUAL slices for display? 
    // Wait, `weight` field exists.
    // If weights are 1, it's equal.
    // Let's assume Equal Slices for display simplicity as per prototype code (Step 1244 `360 / totalItems`).

    const count = items.length;
    if (count === 0) return null;

    const sliceAngle = 360 / count;
    const colors = ['#FF4D4D', '#FFB84D', '#FFFF4D', '#4DFF4D', '#4DFFFF', '#4D4DFF', '#B84DFF', '#FF4DB8'];

    return (
        <div className={`relative w-[500px] h-[500px] ${className}`} style={style}>
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-30 filter drop-shadow-lg">
                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-500"></div>
            </div>

            {/* Wheel Container */}
            <div className={`w-full h-full rounded-full border-[10px] border-gray-300 shadow-2xl relative overflow-hidden transition-transform duration-[5000ms] ${store.isSpinning ? 'ease-out' : ''}`}
                style={{
                    transform: `rotate(${store.rouletteRotation}deg)`,
                    transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)'
                }}>

                {/* Slices */}
                {items.map((item, idx) => {
                    const rotation = idx * sliceAngle;
                    const color = colors[idx % colors.length];

                    return (
                        <div key={idx}
                            className="absolute top-0 left-1/2 -translate-x-1/2 h-[50%] w-[50%] origin-bottom"
                            style={{
                                transform: `rotate(${rotation}deg) skewY(${90 - sliceAngle}deg)`, // Skew needed if generating CSS wedges
                                // Actually CSS wedges are tricky.
                                // Let's use Conic Gradient for background? 
                                // Or the "Div Wedge" method.
                                // The prototype was using `overflow-visible` and `h-[250px] w-[30px]`. 
                                // "Star" hub removed in Step 1244.

                                // Alternative: Conic Gradient Background
                            }}>
                            {/* This is hard to port exactly without seeing CSS. 
                                   Let's use a simpler Conic Gradient approach for the Board, 
                                   and overlaid text.
                                */}
                        </div>
                    )
                })}

                {/* Better Approach: SVG or Conic Gradient */}
                <div className="absolute inset-0 rounded-full"
                    style={{
                        background: `conic-gradient(${items.map((_, i) => `${colors[i % colors.length]} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(', ')
                            })`
                    }}
                />

                {/* Text Labels */}
                {items.map((item, idx) => {
                    const angle = (idx * sliceAngle) + (sliceAngle / 2); // Center of wedge
                    return (
                        <div key={idx}
                            className="absolute top-0 left-1/2 h-[50%] w-[2px] origin-bottom flex flex-col justify-start items-center pt-8 z-10 pointer-events-none"
                            style={{ transform: `rotate(${angle}deg)` }}
                        >
                            <span className="text-white font-bold text-lg drop-shadow-md whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                                {item.name}
                            </span>
                        </div>
                    )
                })}

                {/* Center Pin */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#333] rounded-full z-20 shadow-sm border border-gray-500"></div>
            </div>
        </div>
    );
}

// Note: Re-implementing the rotation logic in store or component?
// Store has `rouletteRotation`.
