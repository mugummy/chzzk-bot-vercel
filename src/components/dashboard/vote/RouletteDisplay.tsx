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

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    // Vue Color Palette
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1'];

    // Calculate Gradients
    let currentGradientAngle = 0;
    const gradientParts = items.map((item, idx) => {
        const wedgeAngle = (item.weight / totalWeight) * 360;
        const start = currentGradientAngle;
        const end = currentGradientAngle + wedgeAngle;
        currentGradientAngle += wedgeAngle;
        return `${colors[idx % colors.length]} ${start}deg ${end}deg`;
    });

    return (
        <div className={`relative w-[500px] h-[500px] flex items-center justify-center p-8 ${className}`} style={style}>
            {/* Glow Behind */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00ff80] rounded-full blur-[150px] opacity-10 animate-pulse pointer-events-none"></div>

            <div className="relative w-[500px] h-[500px] flex items-center justify-center z-10">
                {/* 3D Indicator Arrow (Legacy Style) */}
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] filter">
                    <div className="w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-t-[50px] border-t-red-500 relative">
                        <div className="absolute -top-[55px] -left-[25px] w-[50px] h-[10px] bg-red-700 rounded-t-lg"></div>
                    </div>
                </div>

                {/* Outer Rim */}
                <div className="absolute inset-[-15px] rounded-full border-[15px] border-gray-400 shadow-[0_0_10px_rgba(0,0,0,0.3)]"></div>

                {/* The Wheel */}
                <div className={`w-[500px] h-[500px] rounded-full border-[8px] border-gray-300 relative overflow-hidden bg-[#111]`}
                    style={{
                        transform: `rotate(${store.rouletteRotation}deg)`,
                        transition: store.rouletteTransition || 'none',
                    }}>

                    {/* Conic Gradient for Wedges */}
                    <div className="absolute inset-0 rounded-full"
                        style={{ background: `conic-gradient(${gradientParts.join(', ')})` }}
                    />

                    {/* Inner Shadow */}
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] pointer-events-none"></div>

                    {/* Text Labels */}
                    <div className="absolute inset-0">
                        {(() => {
                            let currentTextAngle = 0;
                            return items.map((item, idx) => {
                                const wedgeAngle = (item.weight / totalWeight) * 360;
                                const angle = currentTextAngle + (wedgeAngle / 2);
                                currentTextAngle += wedgeAngle;
                                const showText = wedgeAngle > 12; // Legacy: > 12 deg check

                                return (
                                    <div key={idx}
                                        className="absolute top-0 left-1/2 -translate-x-1/2 h-[250px] w-[30px] origin-bottom flex flex-col items-center justify-center pt-10 pb-10 z-10 pointer-events-none overflow-visible"
                                        style={{ transform: `rotate(${angle}deg)` }}
                                    >
                                        {showText && (
                                            <span className="text-white font-bold text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] whitespace-nowrap tracking-wide truncate block max-w-[150px]"
                                                style={{ transform: 'rotate(-90deg)' }}>
                                                {item.name}
                                            </span>
                                        )}
                                    </div>
                                )
                            });
                        })()}
                    </div>

                    {/* Center Pin */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#333] rounded-full z-20 shadow-sm border border-gray-500"></div>
                </div>
            </div>
        </div>
    );
}

// Note: Re-implementing the rotation logic in store or component?
// Store has `rouletteRotation`.
