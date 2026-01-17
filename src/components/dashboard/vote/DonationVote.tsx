'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  Trophy,
  DollarSign,
  Settings,
  ArrowRight,
  Crown,
  Coins
} from 'lucide-react';
import { useVoteGameStore } from '@/lib/voteGameStore';

export default function DonationVote() {
  const {
    status,
    donationVote,
    setStatus,
    addDonationVoteItem,
    removeDonationVoteItem,
    addDonation,
    setDonationSettings,
    setMode
  } = useVoteGameStore();

  const [newItemName, setNewItemName] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // 시뮬레이션: 도네 진행 중 랜덤 후원 추가
  useEffect(() => {
    if (status !== 'active' || donationVote.items.length === 0) return;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * donationVote.items.length);
      const randomItem = donationVote.items[randomIndex];
      // 랜덤 금액 (1000 ~ 10000 사이, 1000 단위)
      const randomAmount = (Math.floor(Math.random() * 10) + 1) * 1000;
      if (randomItem) {
        addDonation(randomItem.id, randomAmount, `시청자${Math.floor(Math.random() * 1000)}`);
      }
    }, 1500 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [status, donationVote.items, addDonation]);

  const handleAddItem = () => {
    if (newItemName.trim()) {
      addDonationVoteItem(newItemName.trim());
      setNewItemName('');
    }
  };

  const handleStart = () => {
    if (donationVote.items.length >= 2) {
      setStatus('active');
    }
  };

  const handleStop = () => {
    setStatus('result');
  };

  const handleReset = () => {
    setStatus('idle');
  };

  const handleTransferToRoulette = () => {
    setMode('roulette');
  };

  // 정렬된 항목 리스트 (득표순)
  const sortedItems = [...donationVote.items].sort((a, b) => b.votes - a.votes);

  const totalVotes = donationVote.items.reduce((sum, item) => sum + item.votes, 0);
  const maxVotes = Math.max(...donationVote.items.map(item => item.votes), 1);

  const isIdle = status === 'idle';
  const isActive = status === 'active';
  const isResult = status === 'result';

  // 금액 포맷팅
  const formatAmount = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  return (
    <div className="space-y-4">
      {/* 상단 컨트롤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 상태 표시 */}
          <div
            className="px-4 py-2 rounded-xl font-bold flex items-center gap-2"
            style={{
              backgroundColor: isActive ? 'rgba(255, 230, 109, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: isActive ? '#ffe66d' : '#6b7280',
              border: `1px solid ${isActive ? 'rgba(255, 230, 109, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
            }}
          >
            <DollarSign size={18} />
            <span>
              {isIdle && '대기 중'}
              {isActive && '후원 진행 중'}
              {isResult && '후원 종료'}
            </span>
            {isActive && (
              <motion.span
                className="w-2 h-2 rounded-full ml-1"
                style={{ backgroundColor: '#ffe66d' }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>

          {/* 총 후원 금액 */}
          <div
            className="px-4 py-2 rounded-xl font-medium flex items-center gap-2"
            style={{
              backgroundColor: 'rgba(255, 230, 109, 0.1)',
              color: '#ffe66d'
            }}
          >
            <Coins size={16} />
            <motion.span
              key={donationVote.totalAmount}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
            >
              {formatAmount(donationVote.totalAmount)}
            </motion.span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 설정 버튼 */}
          <motion.button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2.5 rounded-xl transition-colors"
            style={{
              backgroundColor: showSettings ? 'rgba(255, 230, 109, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: showSettings ? '#ffe66d' : '#9ca3af'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings size={20} />
          </motion.button>

          {/* 메인 액션 버튼 */}
          {isIdle && (
            <motion.button
              onClick={handleStart}
              disabled={donationVote.items.length < 2}
              className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
              style={{
                backgroundColor: donationVote.items.length >= 2 ? '#ffe66d' : '#333',
                color: donationVote.items.length >= 2 ? '#000' : '#666',
                opacity: donationVote.items.length >= 2 ? 1 : 0.5
              }}
              whileHover={donationVote.items.length >= 2 ? { scale: 1.02 } : {}}
              whileTap={donationVote.items.length >= 2 ? { scale: 0.98 } : {}}
            >
              <Play size={18} />
              후원 시작
            </motion.button>
          )}

          {isActive && (
            <motion.button
              onClick={handleStop}
              className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2"
              style={{
                backgroundColor: '#ff6b6b',
                color: '#fff'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Square size={18} />
              후원 종료
            </motion.button>
          )}

          {isResult && (
            <div className="flex gap-2">
              <motion.button
                onClick={handleTransferToRoulette}
                className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2"
                style={{
                  backgroundColor: 'rgba(255, 107, 107, 0.15)',
                  color: '#ff6b6b',
                  border: '1px solid rgba(255, 107, 107, 0.3)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowRight size={18} />
                룰렛으로
              </motion.button>
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
            </div>
          )}
        </div>
      </div>

      {/* 설정 패널 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-4 rounded-xl space-y-4"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">후원 명령어 형식</span>
                <span className="text-sm font-mono" style={{ color: '#ffe66d' }}>
                  [금액] [번호]
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">단위 금액</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={donationVote.unitAmount}
                    onChange={(e) => setDonationSettings({ unitAmount: parseInt(e.target.value) || 1000 })}
                    className="w-24 px-3 py-1.5 rounded-lg text-sm text-right"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      color: '#ffe66d',
                      border: '1px solid rgba(255, 230, 109, 0.2)'
                    }}
                    step={100}
                    min={100}
                  />
                  <span className="text-gray-500 text-sm">원</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">복수 투표 허용</span>
                <button
                  onClick={() => setDonationSettings({ allowMultipleVotes: !donationVote.allowMultipleVotes })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    donationVote.allowMultipleVotes ? 'bg-[#ffe66d]' : 'bg-gray-600'
                  }`}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white"
                    animate={{ left: donationVote.allowMultipleVotes ? '26px' : '4px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 항목 추가 (대기 상태에서만) */}
      {isIdle && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            placeholder="후원 항목 추가..."
            className="flex-1 px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none transition-all"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          />
          <motion.button
            onClick={handleAddItem}
            disabled={!newItemName.trim()}
            className="px-4 py-3 rounded-xl font-bold"
            style={{
              backgroundColor: newItemName.trim() ? '#ffe66d' : 'rgba(255, 255, 255, 0.05)',
              color: newItemName.trim() ? '#000' : '#666'
            }}
            whileHover={newItemName.trim() ? { scale: 1.02 } : {}}
            whileTap={newItemName.trim() ? { scale: 0.98 } : {}}
          >
            <Plus size={20} />
          </motion.button>
        </div>
      )}

      {/* 후원 항목 리스트 */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sortedItems.map((item, index) => {
            const percentage = totalVotes > 0 ? (item.votes / totalVotes) * 100 : 0;
            const barWidth = maxVotes > 0 ? (item.votes / maxVotes) * 100 : 0;
            const isFirst = index === 0 && item.votes > 0;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="relative overflow-hidden rounded-xl"
                style={{
                  backgroundColor: isFirst ? 'rgba(255, 230, 109, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isFirst ? 'rgba(255, 230, 109, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`
                }}
              >
                {/* 진행 바 */}
                <motion.div
                  className="absolute inset-y-0 left-0"
                  style={{
                    backgroundColor: isFirst ? 'rgba(255, 230, 109, 0.2)' : 'rgba(255, 255, 255, 0.05)'
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />

                <div className="relative flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {/* 순위 */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                      style={{
                        backgroundColor: isFirst ? '#ffe66d' : 'rgba(255, 255, 255, 0.1)',
                        color: isFirst ? '#000' : '#9ca3af'
                      }}
                    >
                      {isFirst ? <Crown size={16} /> : index + 1}
                    </div>

                    {/* 항목명 */}
                    <span className="text-white font-medium">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* 투표 수 및 비율 */}
                    <div className="text-right">
                      <motion.span
                        className="text-lg font-bold block"
                        style={{ color: isFirst ? '#ffe66d' : '#fff' }}
                        key={item.votes}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                      >
                        {item.votes.toLocaleString()}표
                      </motion.span>
                      <span className="text-xs text-gray-500">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>

                    {/* 삭제 버튼 (대기 상태에서만) */}
                    {isIdle && (
                      <motion.button
                        onClick={() => removeDonationVoteItem(item.id)}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* 빈 상태 */}
        {donationVote.items.length === 0 && (
          <div
            className="text-center py-12 rounded-xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.1)'
            }}
          >
            <DollarSign size={48} className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-500">후원 항목을 추가해주세요</p>
            <p className="text-gray-600 text-sm mt-1">최소 2개 이상의 항목이 필요합니다</p>
          </div>
        )}

        {/* 항목이 1개일 때 경고 */}
        {donationVote.items.length === 1 && (
          <p className="text-center text-yellow-500 text-sm">
            후원을 시작하려면 최소 2개의 항목이 필요합니다
          </p>
        )}
      </div>

      {/* 결과 요약 (결과 상태에서만) */}
      {isResult && sortedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 230, 109, 0.15) 0%, rgba(255, 230, 109, 0.05) 100%)',
            border: '1px solid rgba(255, 230, 109, 0.2)'
          }}
        >
          <Trophy size={48} className="mx-auto mb-3" style={{ color: '#ffe66d' }} />
          <h3 className="text-2xl font-bold text-white mb-2">
            {sortedItems[0]?.label}
          </h3>
          <p className="text-gray-400">
            {sortedItems[0]?.votes.toLocaleString()}표로 1위 달성!
            ({((sortedItems[0]?.votes || 0) / totalVotes * 100).toFixed(1)}%)
          </p>
        </motion.div>
      )}
    </div>
  );
}
