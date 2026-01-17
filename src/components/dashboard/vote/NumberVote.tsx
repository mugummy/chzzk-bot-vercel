'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  Trophy,
  ArrowRight,
  Settings,
  BarChart3,
  Crown,
  List,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { useBotStore } from '@/lib/store';

interface VoteOption {
  id: string;
  label: string;
  count: number;
}

interface Ballot {
  userIdHash: string;
  nickname: string;
  amount: number;
  optionId: string;
  timestamp: string;
}

export default function NumberVote({ onSend }: { onSend: (msg: any) => void }) {
  const { vote } = useBotStore();
  const currentVote = vote.currentVote as any;

  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [showSettings, setShowSettings] = useState(false);
  const [sortByRank, setSortByRank] = useState(true);

  // 투표자 모달
  const [isBallotModalOpen, setIsBallotModalOpen] = useState(false);
  const [ballots, setBallots] = useState<Ballot[]>([]);
  const [showNicknames, setShowNicknames] = useState(false);

  // 투표자 데이터 이벤트 리스너
  useEffect(() => {
    const handleBallots = (e: CustomEvent<Ballot[]>) => {
      setBallots(e.detail);
      setIsBallotModalOpen(true);
    };

    window.addEventListener('voteBallotsResponse', handleBallots as EventListener);

    return () => {
      window.removeEventListener('voteBallotsResponse', handleBallots as EventListener);
    };
  }, []);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleCreate = () => {
    const validOptions = options.filter(o => o.trim());
    if (!title.trim() || validOptions.length < 2) {
      return alert('제목과 최소 2개의 항목이 필요합니다.');
    }
    onSend({ type: 'createVote', title, options: validOptions, mode: 'normal' });
    setTitle('');
    setOptions(['', '']);
  };

  const handleCreateAndStart = () => {
    const validOptions = options.filter(o => o.trim());
    if (!title.trim() || validOptions.length < 2) {
      return alert('제목과 최소 2개의 항목이 필요합니다.');
    }
    onSend({ type: 'createVote', title, options: validOptions, mode: 'normal', autoStart: true });
    setTitle('');
    setOptions(['', '']);
  };

  const handleStart = () => {
    onSend({ type: 'startVote' });
  };

  const handleStop = () => {
    onSend({ type: 'endVote' });
  };

  const handleReset = () => {
    if (confirm('현재 투표를 초기화하시겠습니까?')) {
      onSend({ type: 'resetVote' });
      setTitle('');
      setOptions(['', '']);
    }
  };

  const handleShowBallots = () => {
    if (currentVote?.id) {
      onSend({ type: 'getBallots', voteId: currentVote.id });
    }
  };

  const handleShowOverlay = () => {
    onSend({ type: 'toggleOverlay', visible: true, view: 'vote' });
  };

  // 정렬된 항목 리스트
  const sortedOptions = currentVote?.options
    ? [...currentVote.options].sort((a: VoteOption, b: VoteOption) => {
        if (sortByRank) {
          return b.count - a.count;
        }
        return 0;
      })
    : [];

  const totalVotes = currentVote?.options?.reduce((sum: number, opt: VoteOption) => sum + opt.count, 0) || 0;
  const maxVotes = Math.max(...(currentVote?.options?.map((opt: VoteOption) => opt.count) || [1]), 1);

  const isIdle = !currentVote || currentVote.status === 'ended';
  const isReady = currentVote?.status === 'ready';
  const isActive = currentVote?.status === 'active';
  const isEnded = currentVote?.status === 'ended';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 왼쪽: 새 투표 만들기 */}
      <div className="lg:col-span-5 bg-[#1a1a1a] border border-white/5 p-6 rounded-2xl h-fit">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-black flex items-center gap-2 text-white">
            <BarChart3 className="text-[#4ecdc4]" size={20} /> 새 투표 만들기
          </h3>
          {currentVote && (
            <button
              onClick={handleReset}
              className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
              title="현재 투표 초기화"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>

        <div className="space-y-5">
          {/* 주제 입력 */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">주제</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="투표 제목을 입력하세요"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4ecdc4] transition-all"
            />
          </div>

          {/* 항목 입력 */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">투표 항목</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs text-gray-500 w-5 font-bold">{i + 1}</span>
                  <input
                    value={opt}
                    onChange={e => {
                      const newOptions = [...options];
                      newOptions[i] = e.target.value;
                      setOptions(newOptions);
                    }}
                    placeholder={`항목 ${i + 1}`}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#4ecdc4]"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(i)}
                      className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 10 && (
                <button
                  onClick={handleAddOption}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold flex items-center justify-center gap-2 transition-all text-gray-400 hover:text-white"
                >
                  <Plus size={14} /> 항목 추가
                </button>
              )}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCreate}
              className="flex-1 py-3.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
            >
              투표 생성
            </button>
            <button
              onClick={handleCreateAndStart}
              className="flex-[2] py-3.5 bg-[#4ecdc4] text-black font-black rounded-xl hover:bg-[#3dbdb4] transition-all shadow-lg shadow-[#4ecdc4]/20"
            >
              생성 + 바로 시작
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽: 진행 중인 투표 */}
      <div className="lg:col-span-7">
        {!currentVote ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full min-h-[400px] bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-8 rounded-2xl flex flex-col items-center justify-center text-gray-500"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BarChart3 size={64} className="mb-6 opacity-20" />
            </motion.div>
            <p className="font-black text-xl text-gray-400">진행 중인 투표가 없습니다</p>
            <p className="text-sm text-gray-600 mt-2">왼쪽에서 새 투표를 만들어보세요</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full bg-gradient-to-br from-zinc-900/80 to-black border border-white/10 p-6 rounded-2xl flex flex-col relative overflow-hidden"
          >
            {/* 배경 장식 */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#4ecdc4]/10 rounded-full blur-3xl pointer-events-none" />
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#4ecdc4]/5 via-transparent to-[#4ecdc4]/5"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            {/* 헤더 */}
            <div className="flex justify-between items-start mb-6 z-10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {isActive ? (
                    <motion.div
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4ecdc4] to-[#26a69a] rounded-full shadow-lg shadow-[#4ecdc4]/30"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <motion.span
                        className="w-3 h-3 bg-white rounded-full"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                      <span className="text-sm font-black text-black tracking-wider">LIVE</span>
                    </motion.div>
                  ) : isReady ? (
                    <span className="px-4 py-2 bg-yellow-500 rounded-full text-sm font-black text-black">
                      READY
                    </span>
                  ) : (
                    <span className="px-4 py-2 bg-gray-600 rounded-full text-sm font-black text-white">
                      ENDED
                    </span>
                  )}
                </div>
                <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white mb-2">{currentVote.title}</h2>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="font-bold">총 {totalVotes.toLocaleString()}표</span>
                  <span>·</span>
                  <span>{currentVote.totalParticipants || 0}명 참여</span>
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={handleShowOverlay}
                  className="px-4 py-2 bg-[#4ecdc4]/20 rounded-xl text-sm font-bold text-[#4ecdc4] hover:bg-[#4ecdc4]/30 transition-all border border-[#4ecdc4]/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Eye size={16} className="inline mr-2" />
                  오버레이
                </motion.button>
              </div>
            </div>

            {/* 투표 항목 목록 */}
            <div className="flex-1 space-y-3 z-10 overflow-y-auto custom-scrollbar pr-2 max-h-[350px]">
              {sortedOptions.map((opt: VoteOption, i: number) => {
                const percent = totalVotes > 0 ? Math.round((opt.count / totalVotes) * 100) : 0;
                const barWidth = maxVotes > 0 ? (opt.count / maxVotes) * 100 : 0;
                const isLeading = i === 0 && opt.count > 0;

                return (
                  <motion.div
                    key={opt.id || i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`group relative h-16 rounded-xl overflow-hidden border transition-all ${
                      isLeading
                        ? 'bg-gradient-to-r from-[#4ecdc4]/20 to-[#26a69a]/10 border-[#4ecdc4]/50 shadow-lg shadow-[#4ecdc4]/10'
                        : 'bg-black/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* 프로그레스 바 */}
                    <motion.div
                      className={`absolute top-0 left-0 h-full ${
                        isLeading
                          ? 'bg-gradient-to-r from-[#4ecdc4]/40 to-[#26a69a]/30'
                          : 'bg-white/10'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                    {isLeading && (
                      <motion.div
                        className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-[#4ecdc4]/20 to-transparent"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-between px-5">
                      <span className="font-bold flex items-center gap-3 text-lg">
                        <motion.span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${
                            isLeading
                              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg'
                              : 'bg-white/10 text-gray-400'
                          }`}
                          animate={isLeading ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          {isLeading ? <Crown size={16} /> : i + 1}
                        </motion.span>
                        <span className={isLeading ? 'text-white' : 'text-gray-300'}>{opt.label}</span>
                      </span>
                      <div className="text-right flex items-center gap-3">
                        <motion.span
                          className={`font-black text-2xl tabular-nums ${isLeading ? 'text-white' : 'text-gray-300'}`}
                          key={opt.count}
                          initial={{ scale: 1.2, color: '#4ecdc4' }}
                          animate={{ scale: 1, color: isLeading ? '#ffffff' : '#d1d5db' }}
                        >
                          {opt.count.toLocaleString()}
                        </motion.span>
                        <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                          isLeading ? 'bg-[#4ecdc4]/30 text-[#4ecdc4]' : 'bg-white/5 text-gray-500'
                        }`}>
                          {percent}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 하단 액션 버튼 */}
            <div className="mt-6 flex gap-3 z-10 pt-4 border-t border-white/10">
              {isReady && (
                <motion.button
                  onClick={handleStart}
                  className="flex-1 py-4 bg-gradient-to-r from-[#4ecdc4] to-[#26a69a] text-black font-black rounded-xl shadow-lg shadow-[#4ecdc4]/30 flex items-center justify-center gap-3 text-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play size={22} fill="currentColor" /> 투표 시작
                </motion.button>
              )}
              {isActive && (
                <motion.button
                  onClick={handleStop}
                  className="flex-1 py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white font-black rounded-xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-3 text-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Square size={20} fill="currentColor" /> 투표 마감
                </motion.button>
              )}
              {isEnded && (
                <motion.button
                  onClick={handleReset}
                  className="flex-1 py-4 bg-zinc-700 text-white font-bold rounded-xl hover:bg-zinc-600 transition-all flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RotateCcw size={18} /> 새 투표
                </motion.button>
              )}
              <motion.button
                onClick={handleShowBallots}
                className="px-5 bg-white/5 rounded-xl font-bold hover:bg-white/10 transition-all border border-white/10"
                title="투표자 보기"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <List size={20} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* 투표자 목록 모달 */}
      <AnimatePresence>
        {isBallotModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setIsBallotModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] rounded-2xl p-6 max-w-2xl w-full border border-white/10 max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-white">투표자 현황</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNicknames(!showNicknames)}
                    className="flex items-center gap-2 text-xs font-bold text-[#4ecdc4] bg-[#4ecdc4]/10 px-3 py-1.5 rounded-lg"
                  >
                    {showNicknames ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showNicknames ? '가리기' : '보기'}
                  </button>
                  <button
                    onClick={() => setIsBallotModalOpen(false)}
                    className="p-2 text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 space-y-4">
                {currentVote?.options?.map((opt: VoteOption) => {
                  const voters = ballots.filter(b => b.optionId === opt.id);
                  const percent = ballots.length === 0 ? 0 : Math.round((voters.length / ballots.length) * 100);

                  return (
                    <div key={opt.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-white">{opt.label}</h4>
                        <span className="text-xs font-bold text-[#4ecdc4]">{voters.length}명 ({percent}%)</span>
                      </div>
                      {voters.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {voters.map((b, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg text-sm"
                            >
                              <span className="text-gray-400">{showNicknames ? b.nickname : `익명(${b.userIdHash.substring(0, 4)})`}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">아직 투표자가 없습니다</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
