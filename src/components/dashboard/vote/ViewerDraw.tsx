'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Play, Square, Trophy, RotateCcw, Crown, UserPlus,
  History, Trash2, Settings, X
} from 'lucide-react';
import { useBotStore } from '@/lib/store';
import SlotMachine from './SlotMachine';

interface Winner {
  nickname?: string;
  nick?: string;
  amount?: number;
}

export default function ViewerDraw({ onSend }: { onSend: (msg: any) => void }) {
  const { draw } = useBotStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSlotMachine, setShowSlotMachine] = useState(false);
  const [slotWinner, setSlotWinner] = useState<string | null>(null);

  // 설정 상태
  const [command, setCommand] = useState('!참여');
  const [useCommand, setUseCommand] = useState(true);
  const [winnerCount, setWinnerCount] = useState(1);
  const [excludePreviousWinners, setExcludePreviousWinners] = useState(false);
  const [subscriberOnly, setSubscriberOnly] = useState(false);

  // 당첨자 히스토리 (로컬)
  const [winnersHistory, setWinnersHistory] = useState<Winner[]>([]);

  // 애니메이션 상태
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'rolling' | 'stopping' | 'done'>('idle');

  // 참여자 목록을 슬롯머신용으로 사용
  const nicknamePool = useMemo(() => {
    if (draw.participantsList && draw.participantsList.length > 0) {
      return draw.participantsList;
    }
    return [];
  }, [draw.participantsList]);

  // 추첨 상태 변화 감지
  useEffect(() => {
    if (draw.status === 'rolling') {
      setShowSlotMachine(true);
      setAnimationPhase('rolling');
      if (draw.winners && draw.winners.length > 0) {
        const winner = draw.winners[0];
        setSlotWinner(winner.nickname || winner.nick || '');
      }
    } else if (draw.status === 'completed' && draw.winners && draw.winners.length > 0) {
      setTimeout(() => setAnimationPhase('stopping'), 2500);
      setTimeout(() => {
        setAnimationPhase('done');
        // 당첨자를 히스토리에 추가
        setWinnersHistory(prev => [...draw.winners, ...prev]);
      }, 4500);
    }
  }, [draw.status, draw.winners]);

  const handleStart = () => {
    onSend({
      type: 'startDraw',
      settings: {
        target: useCommand ? 'chat' : 'all',
        winnerCount,
        command: useCommand ? command : null,
        excludePreviousWinners,
        subscriberOnly
      }
    });
  };

  const handleStop = () => {
    onSend({ type: 'stopDraw' });
  };

  const handlePick = () => {
    onSend({ type: 'pickWinners' });
    onSend({ type: 'toggleOverlay', visible: true, view: 'draw' });
  };

  const handleSlotComplete = () => {
    setAnimationPhase('done');
  };

  const handleReset = () => {
    if (confirm('추첨 상태를 초기화하시겠습니까?')) {
      onSend({ type: 'resetDraw' });
      setShowSlotMachine(false);
      setSlotWinner(null);
      setAnimationPhase('idle');
    }
  };

  const handleCloseResult = () => {
    setShowSlotMachine(false);
    setSlotWinner(null);
    setAnimationPhase('idle');
  };

  const isCollecting = draw.isCollecting;
  const isCompleted = draw.status === 'completed';
  const participantCount = draw.participantCount || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Panel: Settings & Controls */}
      <div className="lg:col-span-5 space-y-4">
        {/* Settings Card */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Users className="text-[#00ff80]" size={20} />
              시청자 추첨
            </h3>
            <div className="flex gap-2">
              <motion.button
                onClick={() => setShowHistory(true)}
                className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <History size={18} />
              </motion.button>
              <motion.button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings size={18} />
              </motion.button>
            </div>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="space-y-4 p-4 bg-black/30 rounded-xl border border-white/5">
                  {/* Command Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">참여 명령어</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-[#00ff80] outline-none"
                        placeholder="!참여"
                      />
                      <button
                        onClick={() => setUseCommand(!useCommand)}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${
                          useCommand
                            ? 'bg-[#00ff80]/20 text-[#00ff80] border border-[#00ff80]/30'
                            : 'bg-white/5 text-gray-500'
                        }`}
                      >
                        {useCommand ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>

                  {/* Winner Count */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">당첨 인원</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={winnerCount}
                        onChange={(e) => setWinnerCount(Number(e.target.value))}
                        className="flex-1 accent-[#00ff80]"
                      />
                      <span className="text-2xl font-black text-[#00ff80] w-12 text-center">{winnerCount}</span>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                    <span className="text-sm text-gray-300">이전 당첨자 제외</span>
                    <button
                      onClick={() => setExcludePreviousWinners(!excludePreviousWinners)}
                      className={`w-12 h-6 rounded-full transition-all ${
                        excludePreviousWinners ? 'bg-[#00ff80]' : 'bg-white/10'
                      }`}
                    >
                      <motion.div
                        className="w-5 h-5 bg-white rounded-full shadow"
                        animate={{ x: excludePreviousWinners ? 26 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                    <span className="text-sm text-gray-300">구독자 전용</span>
                    <button
                      onClick={() => setSubscriberOnly(!subscriberOnly)}
                      className={`w-12 h-6 rounded-full transition-all ${
                        subscriberOnly ? 'bg-[#00ff80]' : 'bg-white/10'
                      }`}
                    >
                      <motion.div
                        className="w-5 h-5 bg-white rounded-full shadow"
                        animate={{ x: subscriberOnly ? 26 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isCollecting && !isCompleted && (
              <motion.button
                onClick={handleStart}
                className="w-full py-4 bg-[#00ff80] text-black font-black text-lg rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-[#00ff80]/20"
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0, 255, 128, 0.4)' }}
                whileTap={{ scale: 0.98 }}
              >
                <Play size={24} fill="currentColor" />
                모집 시작
              </motion.button>
            )}

            {isCollecting && (
              <motion.button
                onClick={handleStop}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white font-black text-lg rounded-xl flex items-center justify-center gap-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{ boxShadow: ['0 0 20px rgba(239,68,68,0.3)', '0 0 30px rgba(239,68,68,0.5)', '0 0 20px rgba(239,68,68,0.3)'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Square size={20} fill="currentColor" />
                모집 종료
              </motion.button>
            )}

            {!isCollecting && participantCount > 0 && !isCompleted && (
              <motion.button
                onClick={handlePick}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black text-lg rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-yellow-500/20"
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(234, 179, 8, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Trophy size={24} />
                당첨자 추첨!
              </motion.button>
            )}

            {(isCompleted || participantCount > 0) && (
              <motion.button
                onClick={handleReset}
                className="w-full py-3 bg-white/5 text-gray-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RotateCcw size={18} />
                초기화
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Participants & Result */}
      <div className="lg:col-span-7">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/5 min-h-[500px] relative overflow-hidden"
        >
          {/* Background Glow */}
          {isCollecting && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-[#00ff80]/5 to-transparent"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-4">
              {isCollecting && (
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 bg-[#00ff80] rounded-full"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <motion.span
                    className="w-2 h-2 bg-black rounded-full"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <span className="text-sm font-black text-black">모집 중</span>
                </motion.div>
              )}
              <h3 className="text-xl font-black text-white">
                참여자
              </h3>
            </div>

            {/* Counter */}
            <motion.div
              className="flex items-center gap-3 bg-black/40 px-5 py-3 rounded-xl border border-[#00ff80]/20"
              animate={isCollecting ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <UserPlus size={20} className="text-[#00ff80]" />
              <motion.span
                className="text-3xl font-black text-white tabular-nums"
                key={participantCount}
                initial={{ scale: 1.3, color: '#00ff80' }}
                animate={{ scale: 1, color: '#ffffff' }}
              >
                {participantCount}
              </motion.span>
              <span className="text-gray-400 font-bold">명</span>
            </motion.div>
          </div>

          {/* Participant List */}
          {!showSlotMachine ? (
            <div className="relative z-10">
              {participantCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Users size={64} className="opacity-20 mb-4" />
                  </motion.div>
                  <p className="font-bold text-lg">참여자가 없습니다</p>
                  <p className="text-sm text-gray-600 mt-1">모집을 시작해주세요</p>
                </div>
              ) : (
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence mode="popLayout">
                      {draw.participantsList?.map((p, i) => (
                        <motion.div
                          key={`${p}-${i}`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          layout
                          className="px-4 py-2 bg-black/40 rounded-lg text-sm font-medium text-gray-300 border border-white/5 hover:border-[#00ff80]/30 transition-all"
                        >
                          {p}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Slot Machine */
            <SlotMachine
              participants={nicknamePool}
              winner={slotWinner || ''}
              onComplete={handleSlotComplete}
            />
          )}

          {/* Result Display */}
          <AnimatePresence>
            {animationPhase === 'done' && draw.winners && draw.winners.length > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-20"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: 2 }}
                  >
                    <Crown size={80} className="mx-auto text-yellow-400 mb-4" />
                  </motion.div>
                  <motion.p
                    className="text-[#00ff80] text-sm font-black uppercase tracking-[0.3em] mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    WINNER
                  </motion.p>
                  <motion.h2
                    className="text-5xl font-black text-white mb-8"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    {draw.winners[0]?.nickname || draw.winners[0]?.nick}
                  </motion.h2>
                  {draw.winners.length > 1 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      {draw.winners.slice(1).map((w: Winner, i: number) => (
                        <span key={i} className="px-4 py-2 bg-white/10 rounded-full text-white font-bold">
                          {w.nickname || w.nick}
                        </span>
                      ))}
                    </div>
                  )}
                  <motion.button
                    onClick={handleCloseResult}
                    className="px-8 py-3 bg-[#00ff80] text-black font-bold rounded-full"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    확인
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <History className="text-[#00ff80]" size={20} />
                  당첨 기록
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {winnersHistory.length === 0 ? (
                <p className="text-center py-8 text-gray-500">기록이 없습니다</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {winnersHistory.map((winner: Winner, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-black/30 rounded-xl"
                    >
                      <span className="w-8 h-8 bg-[#00ff80]/20 text-[#00ff80] rounded-full flex items-center justify-center font-black text-sm">
                        {winnersHistory.length - i}
                      </span>
                      <span className="text-white font-bold flex-1">{winner.nickname || winner.nick}</span>
                    </div>
                  ))}
                </div>
              )}

              {winnersHistory.length > 0 && (
                <button
                  onClick={() => {
                    setWinnersHistory([]);
                    setShowHistory(false);
                  }}
                  className="w-full mt-4 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  기록 삭제
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
