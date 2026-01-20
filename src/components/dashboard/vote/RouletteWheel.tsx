'use client';

import { useState, useEffect, useMemo } from 'react';
import { Star } from 'lucide-react';

interface RouletteItem {
  id: string;
  label: string;
  weight: number;
  color?: string;
}

interface RouletteWheelProps {
  items: RouletteItem[];
  isSpinning: boolean;
  result: RouletteItem | null;
  onSpinEnd?: () => void;
}

const DEFAULT_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#14b8a6'];

export default function RouletteWheel({ items, isSpinning, result, onSpinEnd }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);

  const totalWeight = useMemo(() =>
    items.reduce((sum, item) => sum + item.weight, 0),
    [items]
  );

  const gradient = useMemo(() => {
    if (items.length === 0) return 'conic-gradient(#333 0% 100%)';

    let currentPercent = 0;
    const segments = items.map((item, idx) => {
      const start = currentPercent;
      const weightPercent = (item.weight / totalWeight) * 100;
      currentPercent += weightPercent;
      const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
      return `${color} ${start}% ${currentPercent}%`;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }, [items, totalWeight]);

  const getRotation = (idx: number) => {
    let previousWeight = 0;
    for (let i = 0; i < idx; i++) {
      previousWeight += items[i].weight;
    }
    const myWeight = items[idx].weight;
    const startDeg = (previousWeight / totalWeight) * 360;
    const endDeg = ((previousWeight + myWeight) / totalWeight) * 360;
    return startDeg + (endDeg - startDeg) / 2;
  };

  const shouldShowText = (idx: number) => {
    const weight = items[idx].weight;
    const deg = (weight / totalWeight) * 360;
    return deg > 15;
  };

  useEffect(() => {
    if (isSpinning && result) {
      // Calculate target rotation to land on result
      const resultIndex = items.findIndex(item => item.id === result.id);
      if (resultIndex >= 0) {
        let weightBefore = 0;
        for (let i = 0; i < resultIndex; i++) {
          weightBefore += items[i].weight;
        }
        const itemWeight = items[resultIndex].weight;
        const itemCenterDeg = ((weightBefore + itemWeight / 2) / totalWeight) * 360;

        // Spin multiple times + land on target (pointer is at top, so we need to offset)
        const extraSpins = 360 * 5;
        const targetRotation = extraSpins + (360 - itemCenterDeg) + 90; // +90 because pointer is at top
        setRotation(prev => prev + targetRotation);
      }

      // Call onSpinEnd after animation
      const timer = setTimeout(() => {
        onSpinEnd?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isSpinning, result, items, totalWeight, onSpinEnd]);

  if (items.length < 2) {
    return (
      <div className="w-[400px] h-[400px] rounded-full bg-[#222] border-8 border-[#333] flex items-center justify-center">
        <p className="text-gray-500 font-bold">2개 이상의 항목이 필요합니다</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Pointer */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 text-red-500 text-5xl drop-shadow-lg">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 16l-6-6h12l-6 6z" />
        </svg>
      </div>

      {/* Wheel */}
      <div
        className="w-[400px] h-[400px] rounded-full border-[10px] border-[#222] shadow-2xl relative overflow-hidden bg-[#111]"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0.85, 0.35, 1)' : 'none'
        }}
      >
        {/* Segments */}
        <div className="absolute inset-0 rounded-full" style={{ background: gradient }} />

        {/* Text labels */}
        <div className="absolute inset-0">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="absolute top-0 left-1/2 -translate-x-1/2 h-[200px] w-[40px] origin-bottom flex justify-start pt-8"
              style={{ transform: `rotate(${getRotation(idx)}deg)` }}
            >
              {shouldShowText(idx) && (
                <span
                  className="text-white font-bold text-sm drop-shadow-md whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl' }}
                >
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Border */}
        <div className="absolute inset-0 rounded-full border-4 border-white/10 pointer-events-none" />

        {/* Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-[#222] rounded-full z-20 flex items-center justify-center shadow-xl border-4 border-[#333]">
          <Star className="text-[#00ff80]" size={24} fill="currentColor" />
        </div>
      </div>

      {/* Shadow */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[320px] h-[32px] bg-black/40 blur-xl rounded-full" />
    </div>
  );
}
