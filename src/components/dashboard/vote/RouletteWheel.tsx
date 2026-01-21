'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [isAnimating, setIsAnimating] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

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

  const getSegmentRotation = (idx: number) => {
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
        setIsAnimating(true);

        // Calculate where the segment starts and ends
        let weightBefore = 0;
        for (let i = 0; i < resultIndex; i++) {
          weightBefore += items[i].weight;
        }
        const itemWeight = items[resultIndex].weight;

        // Random position within the segment (not center)
        const segmentStartDeg = (weightBefore / totalWeight) * 360;
        const segmentEndDeg = ((weightBefore + itemWeight) / totalWeight) * 360;
        const segmentSize = segmentEndDeg - segmentStartDeg;

        // Random offset within segment (10% to 90% to avoid edges)
        const randomOffset = 0.1 + Math.random() * 0.8;
        const targetDegInSegment = segmentStartDeg + (segmentSize * randomOffset);

        // Spin multiple times + land on target
        // Pointer is at top (0deg), so we need to rotate the wheel so target is at top
        const extraSpins = 360 * (5 + Math.floor(Math.random() * 3)); // 5-7 full spins
        const targetRotation = extraSpins + (360 - targetDegInSegment);

        setRotation(prev => prev + targetRotation);

        // Call onSpinEnd after animation
        const timer = setTimeout(() => {
          setIsAnimating(false);
          onSpinEnd?.();
        }, 4000);

        return () => clearTimeout(timer);
      }
    }
  }, [isSpinning, result, items, totalWeight, onSpinEnd]);

  if (items.length < 2) {
    return (
      <div className="w-[500px] h-[500px] rounded-full bg-[#222] border-[12px] border-[#333] flex items-center justify-center">
        <p className="text-gray-500 font-bold">2개 이상의 항목이 필요합니다</p>
      </div>
    );
  }

  return (
    <div className="relative scale-75 md:scale-100 transition-transform">
      {/* Pointer */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 text-red-500 text-6xl drop-shadow-lg">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 16l-6-6h12l-6 6z" />
        </svg>
      </div>

      {/* Wheel */}
      <div
        ref={wheelRef}
        className="w-[500px] h-[500px] rounded-full border-[12px] border-[#222] shadow-2xl relative overflow-hidden bg-[#111]"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isAnimating ? 'transform 4s cubic-bezier(0.15, 0.85, 0.35, 1)' : 'none'
        }}
      >
        {/* Segments */}
        <div className="absolute inset-0 rounded-full" style={{ background: gradient }} />

        {/* Text labels */}
        <div className="absolute inset-0">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="absolute top-0 left-1/2 -translate-x-1/2 h-[250px] w-[40px] origin-bottom flex justify-start pt-10"
              style={{ transform: `rotate(${getSegmentRotation(idx)}deg)` }}
            >
              {shouldShowText(idx) && (
                <span
                  className="text-white font-bold text-lg drop-shadow-md whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl' }}
                >
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Inner border */}
        <div className="absolute inset-0 rounded-full border-4 border-white/10 pointer-events-none" />

        {/* Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#222] rounded-full z-20 flex items-center justify-center shadow-xl border-4 border-[#333]">
          <Star className="text-[#00ff80]" size={28} fill="currentColor" />
        </div>
      </div>

      {/* Shadow */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[400px] h-[40px] bg-black/50 blur-xl rounded-[100%]" />
    </div>
  );
}
