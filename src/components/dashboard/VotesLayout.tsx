'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart3, DollarSign, Target, Settings } from 'lucide-react';
import ViewerDraw from './vote/ViewerDraw';
import NumberVote from './vote/NumberVote';
import DonationVote from './vote/DonationVote';
import RouletteGame from './vote/RouletteGame';
import SettingsTab from './SettingsTab';

type GameMode = 'viewer-draw' | 'number-vote' | 'donation-vote' | 'roulette';

const modes: { id: GameMode; label: string; icon: typeof Users; color: string; bgColor: string }[] = [
  { id: 'viewer-draw', label: '시청자 추첨', icon: Users, color: '#00ff80', bgColor: 'rgba(0, 255, 128, 0.1)' },
  { id: 'number-vote', label: '숫자 투표', icon: BarChart3, color: '#4ecdc4', bgColor: 'rgba(78, 205, 196, 0.1)' },
  { id: 'donation-vote', label: '도네 투표', icon: DollarSign, color: '#ffe66d', bgColor: 'rgba(255, 230, 109, 0.1)' },
  { id: 'roulette', label: '룰렛', icon: Target, color: '#ff6b6b', bgColor: 'rgba(255, 107, 107, 0.1)' },
];

export default function VotesLayout({ onSend }: { onSend: (msg: any) => void }) {
  const [mode, setMode] = useState<GameMode>('viewer-draw');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="space-y-6">
      {/* 상단 헤더: 모드 선택 + 설정 버튼 */}
      <div className="flex items-center gap-4">
        {/* 모드 선택 탭 */}
        <div className="flex-1 flex gap-2 p-1.5 bg-[#111111] rounded-2xl border border-white/5">
          {modes.map(({ id, label, icon: Icon, color, bgColor }) => {
            const isActive = mode === id;

            return (
              <motion.button
                key={id}
                onClick={() => setMode(id)}
                className="relative flex-1 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                style={{
                  backgroundColor: isActive ? bgColor : 'transparent',
                  color: isActive ? color : '#6b7280',
                  borderWidth: isActive ? '1px' : '0px',
                  borderColor: isActive ? `${color}40` : 'transparent',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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

        {/* 설정 버튼 */}
        <motion.button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-xl transition-colors flex-shrink-0"
          style={{
            backgroundColor: showSettings ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            color: showSettings ? '#fff' : '#6b7280',
            border: `1px solid ${showSettings ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings size={20} />
        </motion.button>
      </div>

      {/* 설정 패널 */}
      {showSettings ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <SettingsTab onSend={onSend} />
        </motion.div>
      ) : (
        /* 현재 모드에 따른 컴포넌트 렌더링 */
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-[500px]"
        >
          {mode === 'viewer-draw' && <ViewerDraw onSend={onSend} />}
          {mode === 'number-vote' && <NumberVote onSend={onSend} />}
          {mode === 'donation-vote' && <DonationVote onSend={onSend} />}
          {mode === 'roulette' && <RouletteGame onSend={onSend} />}
        </motion.div>
      )}
    </div>
  );
}
