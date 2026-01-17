'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Target,
  Settings,
  Trophy,
  Sparkles
} from 'lucide-react';
import { useVoteGameStore } from '@/lib/voteGameStore';
import RouletteWheel from './RouletteWheel';

const COLORS = [
  '#ff6b6b', '#4ecdc4', '#ffe66d', '#00ff80',
  '#ff9f43', '#a55eea', '#26de81', '#fd79a8',
  '#0984e3', '#6c5ce7', '#00b894', '#e17055'
];

export default function RouletteGame() {
  const {
    status,
    roulette,
    setStatus,
    addRouletteItem,
    removeRouletteItem,
    updateRouletteItem,
    spinRoulette,
    clearRouletteItems,
    setRouletteRotation
  } = useVoteGameStore();

  const [newItemName, setNewItemName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const handleAddItem = () => {
    if (newItemName.trim()) {
      addRouletteItem(newItemName.trim());
      setNewItemName('');
    }
  };

  const handleSpin = () => {
    if (roulette.items.length < 2) return;

    setIsSpinning(true);
    setStatus('spinning');

    // 스핀 및 당첨자 선정은 store에서 처리
    spinRoulette();
  };

  const handleSpinComplete = () => {
    setIsSpinning(false);
    setStatus('result');
    setShowWinnerModal(true);
  };

  const handleReset = () => {
    clearRouletteItems();
    setStatus('idle');
    setShowWinnerModal(false);
  };

  const handleCloseModal = () => {
    setShowWinnerModal(false);
  };

  const isIdle = status === 'idle';
  const isResult = status === 'result';

  // 아이템에 색상 추가 및 RouletteWheel에 맞는 형태로 변환
  const itemsForWheel = roulette.items.map((item, index) => ({
    id: item.id,
    name: item.label, // RouletteWheel은 name을 사용
    weight: item.weight,
    color: item.color || COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-4">
      {/* 상단 컨트롤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 상태 표시 */}
          <div
            className="px-4 py-2 rounded-xl font-bold flex items-center gap-2"
            style={{
              backgroundColor: isSpinning ? 'rgba(255, 107, 107, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: isSpinning ? '#ff6b6b' : '#6b7280',
              border: `1px solid ${isSpinning ? 'rgba(255, 107, 107, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
            }}
          >
            <Target size={18} />
            <span>
              {isIdle && '대기 중'}
              {isSpinning && '돌리는 중...'}
              {isResult && !isSpinning && '결과'}
            </span>
            {isSpinning && (
              <motion.span
                className="w-2 h-2 rounded-full ml-1"
                style={{ backgroundColor: '#ff6b6b' }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </div>

          {/* 항목 수 */}
          <div
            className="px-4 py-2 rounded-xl font-medium"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#9ca3af'
            }}
          >
            {roulette.items.length}개 항목
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 설정 버튼 */}
          <motion.button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2.5 rounded-xl transition-colors"
            style={{
              backgroundColor: showSettings ? 'rgba(255, 107, 107, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: showSettings ? '#ff6b6b' : '#9ca3af'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings size={20} />
          </motion.button>

          {/* 초기화 버튼 */}
          {(isResult || roulette.rotation > 0) && (
            <motion.button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RotateCcw size={18} />
              초기화
            </motion.button>
          )}

          {/* 스핀 버튼 */}
          <motion.button
            onClick={handleSpin}
            disabled={isSpinning || roulette.items.length < 2}
            className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
            style={{
              backgroundColor: !isSpinning && roulette.items.length >= 2 ? '#ff6b6b' : '#333',
              color: !isSpinning && roulette.items.length >= 2 ? '#fff' : '#666',
              opacity: !isSpinning && roulette.items.length >= 2 ? 1 : 0.5
            }}
            whileHover={!isSpinning && roulette.items.length >= 2 ? { scale: 1.02 } : {}}
            whileTap={!isSpinning && roulette.items.length >= 2 ? { scale: 0.98 } : {}}
          >
            <Play size={18} />
            {isSpinning ? '돌리는 중...' : '돌리기'}
          </motion.button>
        </div>
      </div>

      {/* 메인 컨텐츠: 룰렛 + 항목 리스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 룰렛 휠 */}
        <div
          className="flex items-center justify-center p-8 rounded-2xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <RouletteWheel
            items={itemsForWheel}
            spinning={isSpinning}
            targetRotation={roulette.rotation}
            onSpinComplete={handleSpinComplete}
          />
        </div>

        {/* 항목 리스트 */}
        <div className="space-y-3">
          {/* 항목 추가 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="룰렛 항목 추가..."
              disabled={isSpinning}
              className="flex-1 px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
            <motion.button
              onClick={handleAddItem}
              disabled={!newItemName.trim() || isSpinning}
              className="px-4 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: newItemName.trim() && !isSpinning ? '#ff6b6b' : 'rgba(255, 255, 255, 0.05)',
                color: newItemName.trim() && !isSpinning ? '#fff' : '#666'
              }}
              whileHover={newItemName.trim() && !isSpinning ? { scale: 1.02 } : {}}
              whileTap={newItemName.trim() && !isSpinning ? { scale: 0.98 } : {}}
            >
              <Plus size={20} />
            </motion.button>
          </div>

          {/* 항목 리스트 */}
          <div
            className="space-y-2 max-h-[400px] overflow-y-auto pr-2"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#333 transparent'
            }}
          >
            <AnimatePresence mode="popLayout">
              {roulette.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  {/* 색상 표시 */}
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
                  />

                  {/* 항목명 */}
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateRouletteItem(item.id, { label: e.target.value })}
                    disabled={isSpinning}
                    className="flex-1 bg-transparent text-white font-medium outline-none disabled:opacity-50"
                  />

                  {/* 가중치 */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">가중치</span>
                    <input
                      type="number"
                      value={item.weight}
                      onChange={(e) => updateRouletteItem(item.id, { weight: Math.max(1, parseInt(e.target.value) || 1) })}
                      disabled={isSpinning}
                      min={1}
                      className="w-16 px-2 py-1 rounded-lg text-sm text-center disabled:opacity-50"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: '#ff6b6b',
                        border: '1px solid rgba(255, 107, 107, 0.2)'
                      }}
                    />
                  </div>

                  {/* 삭제 버튼 */}
                  <motion.button
                    onClick={() => removeRouletteItem(item.id)}
                    disabled={isSpinning}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                    whileHover={!isSpinning ? { scale: 1.1 } : {}}
                    whileTap={!isSpinning ? { scale: 0.9 } : {}}
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 빈 상태 */}
            {roulette.items.length === 0 && (
              <div
                className="text-center py-12 rounded-xl"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)'
                }}
              >
                <Target size={48} className="mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500">룰렛 항목을 추가해주세요</p>
                <p className="text-gray-600 text-sm mt-1">최소 2개 이상의 항목이 필요합니다</p>
              </div>
            )}

            {/* 항목이 1개일 때 경고 */}
            {roulette.items.length === 1 && (
              <p className="text-center text-yellow-500 text-sm">
                룰렛을 돌리려면 최소 2개의 항목이 필요합니다
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 당첨자 모달 */}
      <AnimatePresence>
        {showWinnerModal && roulette.currentWinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative p-8 rounded-3xl max-w-md w-full mx-4"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(255, 107, 107, 0.05) 100%)',
                border: '2px solid rgba(255, 107, 107, 0.3)',
                boxShadow: '0 0 60px rgba(255, 107, 107, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 파티클 효과 */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: COLORS[i % COLORS.length],
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                  />
                ))}
              </div>

              <div className="relative text-center">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                >
                  <Trophy size={64} className="mx-auto mb-4" style={{ color: '#ff6b6b' }} />
                </motion.div>

                <Sparkles
                  size={24}
                  className="absolute top-0 right-8"
                  style={{ color: '#ffe66d' }}
                />
                <Sparkles
                  size={20}
                  className="absolute top-8 left-8"
                  style={{ color: '#4ecdc4' }}
                />

                <h2 className="text-lg text-gray-400 mb-2">당첨!</h2>
                <h3
                  className="text-3xl font-bold mb-6"
                  style={{
                    color: '#ff6b6b',
                    textShadow: '0 0 20px rgba(255, 107, 107, 0.5)'
                  }}
                >
                  {roulette.currentWinner.label}
                </h3>

                <motion.button
                  onClick={handleCloseModal}
                  className="px-8 py-3 rounded-xl font-bold"
                  style={{
                    backgroundColor: '#ff6b6b',
                    color: '#fff'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  확인
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
