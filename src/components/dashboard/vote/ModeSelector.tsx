'use client';

import { motion } from 'framer-motion';
import { Users, BarChart3, DollarSign, Target } from 'lucide-react';
import { GameMode, useVoteGameStore } from '@/lib/voteGameStore';

const modes: { id: GameMode; label: string; icon: typeof Users; color: string; bgColor: string }[] = [
  { id: 'viewer-draw', label: '시청자 추첨', icon: Users, color: '#00ff80', bgColor: 'rgba(0, 255, 128, 0.1)' },
  { id: 'number-vote', label: '숫자 투표', icon: BarChart3, color: '#4ecdc4', bgColor: 'rgba(78, 205, 196, 0.1)' },
  { id: 'donation-vote', label: '도네 투표', icon: DollarSign, color: '#ffe66d', bgColor: 'rgba(255, 230, 109, 0.1)' },
  { id: 'roulette', label: '룰렛', icon: Target, color: '#ff6b6b', bgColor: 'rgba(255, 107, 107, 0.1)' },
];

export default function ModeSelector() {
  const { mode, setMode, status } = useVoteGameStore();

  return (
    <div className="flex gap-2 p-1.5 bg-[#111111] rounded-2xl border border-white/5">
      {modes.map(({ id, label, icon: Icon, color, bgColor }) => {
        const isActive = mode === id;
        const isDisabled = status !== 'idle' && status !== 'result';

        return (
          <motion.button
            key={id}
            onClick={() => !isDisabled && setMode(id)}
            disabled={isDisabled}
            className={`relative flex-1 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            style={{
              backgroundColor: isActive ? bgColor : 'transparent',
              color: isActive ? color : '#6b7280',
              borderWidth: isActive ? '1px' : '0px',
              borderColor: isActive ? `${color}40` : 'transparent',
            }}
            whileHover={!isDisabled ? { scale: 1.02 } : {}}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
          >
            {isActive && (
              <motion.div
                layoutId="mode-indicator"
                className="absolute inset-0 rounded-xl"
                style={{ backgroundColor: bgColor }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon size={18} />
              <span className="hidden md:inline">{label}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
