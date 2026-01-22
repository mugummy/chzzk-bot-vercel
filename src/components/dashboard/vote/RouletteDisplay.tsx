'use client';

import React, { useMemo } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';

interface RouletteDisplayProps {
    items: { name: string; weight: number }[];
    className?: string;
    style?: React.CSSProperties;
}

export default function RouletteDisplay({ items, className, style }: RouletteDisplayProps) {
    const store = useVoteStore();

    // Color Palette from Legacy Vue
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1'];

    // Effective Items: Use store active items if spinning/generated, else props
    const effectiveItems = useMemo(() => {
        if (store.activeRouletteItems.length > 0) return store.activeRouletteItems;
        if (items && items.length > 0) return items;
        return [];
    }, [items, store.activeRouletteItems]);

    const count = effectiveItems.length;
    if (count === 0) return null;

    const totalWeight = effectiveItems.reduce((sum, item) => sum + (Number(item.weight) || 0), 0) || 1;

    // Conic Gradient Logic
    const gradientString = useMemo(() => {
        let currentPercent = 0;
        const parts = effectiveItems.map((item, idx) => {
            const weightPercent = (Number(item.weight) / totalWeight) * 100;
            const start = currentPercent;
            const end = currentPercent + weightPercent;
            currentPercent += weightPercent;
            return `${colors[idx % colors.length]} ${start}% ${end}%`;
        });
        return `conic-gradient(${parts.join(', ')})`;
    }, [effectiveItems, totalWeight]);

    // Segment Rotation Helper for Text
    const getSegmentRotation = (idx: number) => {
        let previousWeight = 0;
        for (let i = 0; i < idx; i++) previousWeight += Number(effectiveItems[i].weight);

        const myWeight = Number(effectiveItems[idx].weight);
        const startAngle = (previousWeight / totalWeight) * 360;
        const wedgeAngle = (myWeight / totalWeight) * 360;
        return startAngle + (wedgeAngle / 2);
    };

    return (
        <div className={`relative w-[500px] h-[500px] flex items-center justify-center p-8 ${className}`} style={style}>
            {/* Glow Behind */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00ff80] rounded-full blur-[150px] opacity-10 animate-pulse pointer-events-none"></div>

            <div className="relative w-[500px] h-[500px] flex items-center justify-center z-10">
                {/* 3D Indicator Arrow */}
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] filter">
                    <div className="w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-t-[50px] border-t-red-500 relative">
                        <div className="absolute -top-[55px] -left-[25px] w-[50px] h-[10px] bg-red-700 rounded-t-lg"></div>
                    </div>
                </div>

                {/* Outer Rim */}
                <div className="absolute inset-[-15px] rounded-full border-[15px] border-gray-400 shadow-[0_0_10px_rgba(0,0,0,0.3)]"></div>

                {/* The Wheel */}
                <div
                    className="w-[500px] h-[500px] rounded-full border-[8px] border-gray-300 relative overflow-hidden bg-[#111]"
                    style={{
                        transform: `rotate(${store.rouletteRotation}deg)`,
                        transition: store.rouletteTransition || 'none',
                    }}
                >
                    {/* Gradient Background */}
                    <div className="absolute inset-0" style={{ background: gradientString }}></div>

                    {/* Inner Shadow */}
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] pointer-events-none"></div>

                    {/* Text Segments */}
                    <div className="absolute inset-0">
                        {effectiveItems.map((item, idx) => {
                            const wedgeAngle = (Number(item.weight) / totalWeight) * 360;
                            const showText = wedgeAngle > 12; // Matches legacy visibility check
                            const rotation = getSegmentRotation(idx);

                            return (
                                <div
                                    key={idx}
                                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[250px] w-[30px] origin-bottom flex flex-col items-center justify-center pt-10 pb-10 z-10 pointer-events-none overflow-visible"
                                    style={{ transform: `rotate(${rotation}deg)` }}
                                >
                                    {showText && (
                                        <span
                                            className="text-white font-bold text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] whitespace-nowrap tracking-wide truncate block max-w-[150px]"
                                            style={{ transform: 'rotate(-90deg)' }}
                                        >
                                            {item.name}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Center Pin */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#333] rounded-full z-20 shadow-sm border border-gray-500"></div>
                </div>
            </div>
        </div>
    );
}
