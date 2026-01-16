import { useState, useEffect, useMemo } from 'react';
import { useBotStore } from '@/lib/store';
import { Plus, Trash2, Play, Square, Activity, DollarSign, Vote, Users, List, RefreshCw, Eye, EyeOff, Trophy, RotateCcw, ChevronRight, X } from 'lucide-react';
import { Modal } from './Modals';
import { motion, AnimatePresence } from 'framer-motion';

// 타입 정의
interface VoteOption {
  id: string;
  label: string;
  count: number;
}

interface VoteData {
  id: string;
  title: string;
  status: 'ready' | 'active' | 'ended';
  mode: 'normal' | 'donation';
  options: VoteOption[];
  totalParticipants: number;
  totalVotes: number;
  created_at?: string;
}

interface Ballot {
  userIdHash: string;
  nickname: string;
  amount: number;
  optionId: string;
  timestamp: string;
}

interface Winner {
  userIdHash: string;
  nickname: string;
}

export default function VoteTab({ onSend }: { onSend: (msg: any) => void }) {
  const { vote } = useBotStore();
  const currentVote = vote.currentVote as VoteData | null;

  const [activeView, setActiveView] = useState<'current' | 'history'>('current');
  const [ballots, setBallots] = useState<Ballot[]>([]);
  const [history, setHistory] = useState<VoteData[]>([]);

  const [isBallotModalOpen, setIsBallotModalOpen] = useState(false);
  const [isPickModalOpen, setIsPickModalOpen] = useState(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  const [targetVoteId, setTargetVoteId] = useState<string | null>(null);
  const [targetVoteData, setTargetVoteData] = useState<VoteData | null>(null);
  const [pickCount, setPickCount] = useState(1);
  const [pickFilter, setPickFilter] = useState<'all' | 'win' | 'lose'>('all');

  const [winners, setWinners] = useState<Winner[]>([]);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'rolling' | 'stopping' | 'done'>('idle');

  const [showNicknames, setShowNicknames] = useState(false);

  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [mode, setMode] = useState<'normal' | 'donation'>('normal');

  // 슬롯머신용 닉네임 풀 생성
  const nicknamePool = useMemo(() => {
    if (ballots.length > 0) {
      return ballots.map(b => b.nickname);
    }
    return ['참여자1', '참여자2', '참여자3', '참여자4', '참여자5'];
  }, [ballots]);

  useEffect(() => {
    const handleBallots = (e: CustomEvent<Ballot[]>) => {
      setBallots(e.detail);
      setIsBallotModalOpen(true);
    };
    const handleHistory = (e: CustomEvent<VoteData[]>) => {
      setHistory(e.detail);
    };

    const handleWinner = (e: CustomEvent<Winner[]>) => {
      setWinners(e.detail);
      setIsPickModalOpen(false);
      setIsWinnerModalOpen(true);

      // 애니메이션 시퀀스
      setAnimationPhase('rolling');
      setTimeout(() => setAnimationPhase('stopping'), 3000);
      setTimeout(() => setAnimationPhase('done'), 5000);
    };

    window.addEventListener('voteBallotsResponse', handleBallots as EventListener);
    window.addEventListener('voteHistoryResponse', handleHistory as EventListener);
    window.addEventListener('voteWinnerResult', handleWinner as EventListener);

    if (activeView === 'history') onSend({ type: 'getVoteHistory' });

    return () => {
      window.removeEventListener('voteBallotsResponse', handleBallots as EventListener);
      window.removeEventListener('voteHistoryResponse', handleHistory as EventListener);
      window.removeEventListener('voteWinnerResult', handleWinner as EventListener);
    };
  }, [activeView, onSend]);

  // 투표 생성
  const handleCreate = () => {
    const validOptions = options.filter(o => o.trim());
    if (!title.trim() || validOptions.length < 2) {
      return alert('제목과 최소 2개의 항목이 필요합니다.');
    }
    onSend({ type: 'createVote', title, options: validOptions, mode });
    setTitle('');
    setOptions(['', '']);
  };

  // 투표 생성 + 즉시 시작
  const handleCreateAndStart = () => {
    const validOptions = options.filter(o => o.trim());
    if (!title.trim() || validOptions.length < 2) {
      return alert('제목과 최소 2개의 항목이 필요합니다.');
    }
    onSend({ type: 'createVote', title, options: validOptions, mode, autoStart: true });
    setTitle('');
    setOptions(['', '']);
  };

  const handleShowBallots = (voteId: string, voteData?: VoteData) => {
    if (voteData) setTargetVoteData(voteData);
    else if (currentVote) setTargetVoteData(currentVote);
    onSend({ type: 'getBallots', voteId });
  };

  const handleReset = () => {
    if (confirm('현재 투표를 초기화하시겠습니까?')) {
      onSend({ type: 'resetVote' });
      setTitle('');
      setOptions(['', '']);
    }
  };

  const handleMoveToHistory = () => {
    onSend({ type: 'resetVote' });
    setActiveView('history');
    setTimeout(() => onSend({ type: 'getVoteHistory' }), 500);
  };

  const openPickModal = (voteId: string, voteData?: VoteData) => {
    // 먼저 ballots 데이터 요청
    onSend({ type: 'getBallots', voteId });
    setTargetVoteId(voteId);
    if (voteData) setTargetVoteData(voteData);
    else if (currentVote?.id === voteId) setTargetVoteData(currentVote);
    setPickCount(1);
    setPickFilter('all');
    setIsPickModalOpen(true);
  };

  const executePick = () => {
    if (!targetVoteId) return;
    onSend({ type: 'pickVoteWinner', voteId: targetVoteId, count: pickCount, filter: pickFilter, optionId: null });
  };

  const closeWinnerModal = () => {
    setIsWinnerModalOpen(false);
    setAnimationPhase('idle');
    setWinners([]);
  };

  // 퍼센트 계산 헬퍼
  const getPercent = (count: number, vote: VoteData | null) => {
    if (!vote) return 0;
    const total = vote.totalVotes || vote.options.reduce((acc, o) => acc + o.count, 0);
    return total === 0 ? 0 : Math.round((count / total) * 100);
  };

  // 그리드 클래스 결정 (Tailwind JIT 대응)
  const getWinnerGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    return 'grid-cols-2 md:grid-cols-4';
  };

  // 슬롯머신 컴포넌트
  const SlotMachine = ({ winnerName, index }: { winnerName: string; index: number }) => {
    const itemHeight = 60;
    const visibleItems = 5;
    const containerHeight = itemHeight * visibleItems;

    // 충분한 양의 아이템 생성
    const items = useMemo(() => {
      const pool = nicknamePool.length > 0 ? nicknamePool : ['???'];
      const repeated = [];
      for (let i = 0; i < 30; i++) {
        repeated.push(...pool);
      }
      return repeated;
    }, [nicknamePool]);

    return (
      <div
        className="w-48 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl border-2 border-zinc-700 overflow-hidden relative shadow-2xl"
        style={{ height: containerHeight }}
      >
        {/* 마스크 그라데이션 */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-zinc-900 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-900 to-transparent" />
        </div>

        {/* 중앙 하이라이트 */}
        <div
          className="absolute left-0 right-0 bg-emerald-500/10 border-y border-emerald-500/30 z-10 pointer-events-none"
          style={{ top: itemHeight * 2, height: itemHeight }}
        />

        {/* 회전 컨텐츠 */}
        <motion.div
          className="flex flex-col"
          initial={{ y: 0 }}
          animate={
            animationPhase === 'rolling'
              ? { y: [0, -itemHeight * items.length / 2] }
              : animationPhase === 'stopping'
              ? { y: -itemHeight * 2 }
              : { y: -itemHeight * 2 }
          }
          transition={
            animationPhase === 'rolling'
              ? { duration: 0.5, repeat: Infinity, ease: 'linear' }
              : animationPhase === 'stopping'
              ? { duration: 2, ease: [0.16, 1, 0.3, 1], delay: index * 0.3 }
              : { duration: 0 }
          }
        >
          {animationPhase === 'done' ? (
            // 최종 결과
            <>
              <div style={{ height: itemHeight * 2 }} />
              <div
                className="flex items-center justify-center"
                style={{ height: itemHeight }}
              >
                <span className="text-xl font-black text-emerald-400 truncate px-4">
                  {winnerName}
                </span>
              </div>
              <div style={{ height: itemHeight * 2 }} />
            </>
          ) : (
            // 회전 중
            items.map((name, i) => (
              <div
                key={i}
                className="flex items-center justify-center shrink-0"
                style={{ height: itemHeight }}
              >
                <span className="text-lg font-bold text-white/60 truncate px-4">
                  {name}
                </span>
              </div>
            ))
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* 탭 전환 */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveView('current')}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
            activeView === 'current'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          진행 중인 투표
        </button>
        <button
          onClick={() => { setActiveView('history'); onSend({ type: 'getVoteHistory' }); }}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
            activeView === 'history'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          투표 기록
        </button>
      </div>

      {activeView === 'current' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 새 투표 생성 패널 */}
          <div className="lg:col-span-5 bg-white/5 border border-white/5 p-6 rounded-2xl h-fit">
            <h3 className="text-lg font-black mb-5 flex items-center gap-2">
              <Vote className="text-emerald-500" size={20} /> 새 투표 만들기
            </h3>
            <div className="space-y-5">
              {/* 주제 입력 */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">주제</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="투표 제목을 입력하세요"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {/* 모드 선택 */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">투표 방식</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode('normal')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      mode === 'normal'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-black/20 border-white/10 text-gray-500 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Users size={24} />
                    <span className="text-sm font-bold">일반 투표</span>
                    <span className="text-[10px] text-gray-500">1인 1표</span>
                  </button>
                  <button
                    onClick={() => setMode('donation')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      mode === 'donation'
                        ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                        : 'bg-black/20 border-white/10 text-gray-500 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <DollarSign size={24} />
                    <span className="text-sm font-bold">후원 투표</span>
                    <span className="text-[10px] text-gray-500">금액 비례</span>
                  </button>
                </div>
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
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                          className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {options.length < 10 && (
                    <button
                      onClick={() => setOptions([...options, ''])}
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
                  className="flex-[2] py-3.5 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                  생성 + 바로 시작
                </button>
              </div>
            </div>
          </div>

          {/* 진행 중인 투표 패널 */}
          <div className="lg:col-span-7">
            {!currentVote ? (
              <div className="h-full min-h-[400px] bg-white/5 border border-white/5 p-8 rounded-2xl flex flex-col items-center justify-center text-gray-500">
                <Activity size={48} className="mb-4 opacity-30" />
                <p className="font-bold">진행 중인 투표가 없습니다</p>
                <p className="text-sm text-gray-600 mt-1">왼쪽에서 새 투표를 만들어보세요</p>
              </div>
            ) : (
              <div className="h-full bg-white/5 border border-white/5 p-6 rounded-2xl flex flex-col relative overflow-hidden">
                {/* 배경 장식 */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* 헤더 */}
                <div className="flex justify-between items-start mb-6 z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        currentVote.status === 'active'
                          ? 'bg-emerald-500 text-black animate-pulse'
                          : currentVote.status === 'ready'
                          ? 'bg-yellow-500 text-black'
                          : 'bg-gray-600 text-white'
                      }`}>
                        {currentVote.status === 'active' ? 'LIVE' : currentVote.status === 'ready' ? 'READY' : 'ENDED'}
                      </span>
                      <span className="text-xs font-bold text-gray-400">
                        {currentVote.mode === 'normal' ? '1인 1표' : '후원 금액 비례'}
                      </span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-black tracking-tight">{currentVote.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      참여자 {currentVote.totalParticipants || 0}명
                      {currentVote.mode === 'donation' && ` · 총 ${(currentVote.totalVotes || 0).toLocaleString()}원`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      className="p-2.5 bg-white/5 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-gray-500 transition-all"
                      title="초기화"
                    >
                      <RotateCcw size={18} />
                    </button>
                    <button
                      onClick={() => onSend({ type: 'toggleOverlay', visible: true, view: 'vote' })}
                      className="px-4 py-2 bg-white/10 rounded-lg text-xs font-bold hover:bg-white/20 transition-all"
                    >
                      오버레이
                    </button>
                  </div>
                </div>

                {/* 투표 항목 목록 */}
                <div className="flex-1 space-y-3 z-10 overflow-y-auto custom-scrollbar pr-2 max-h-[350px]">
                  {currentVote.options?.map((opt, i) => {
                    const percent = getPercent(opt.count, currentVote);
                    return (
                      <div
                        key={opt.id || i}
                        className="group relative h-14 bg-black/40 rounded-xl overflow-hidden border border-white/5 hover:border-emerald-500/30 transition-all"
                      >
                        <div
                          className="absolute top-0 left-0 h-full bg-emerald-500/20 transition-all duration-700 ease-out"
                          style={{ width: `${percent}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-5">
                          <span className="font-bold flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-emerald-500 font-black">
                              {i + 1}
                            </span>
                            {opt.label}
                          </span>
                          <div className="text-right">
                            <span className="font-black text-lg tabular-nums">{opt.count.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-500 ml-2">{percent}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 하단 액션 버튼 */}
                <div className="mt-6 flex gap-3 z-10 pt-4 border-t border-white/10">
                  {currentVote.status === 'ready' && (
                    <button
                      onClick={() => onSend({ type: 'startVote' })}
                      className="flex-1 py-3.5 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                    >
                      <Play size={18} /> 투표 시작
                    </button>
                  )}
                  {currentVote.status === 'active' && (
                    <button
                      onClick={() => onSend({ type: 'endVote' })}
                      className="flex-1 py-3.5 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Square size={18} /> 투표 마감
                    </button>
                  )}
                  {currentVote.status === 'ended' && (
                    <>
                      <button
                        onClick={handleMoveToHistory}
                        className="flex-1 py-3.5 bg-zinc-700 text-white font-bold rounded-xl hover:bg-zinc-600 transition-all flex items-center justify-center gap-2"
                      >
                        기록으로 이동 <ChevronRight size={18} />
                      </button>
                      <button
                        onClick={() => openPickModal(currentVote.id)}
                        className="px-6 py-3.5 bg-emerald-500/20 text-emerald-400 font-black rounded-xl hover:bg-emerald-500 hover:text-black transition-all border border-emerald-500/50 flex items-center gap-2"
                      >
                        <Trophy size={18} /> 추첨
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleShowBallots(currentVote.id)}
                    className="px-4 bg-white/5 rounded-xl font-bold hover:bg-white/10 transition-all border border-white/5"
                    title="투표자 보기"
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 투표 기록 탭 */}
      {activeView === 'history' && (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-white/5 rounded-2xl border border-white/5">
              <RefreshCw size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-bold">투표 기록이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((v) => (
                <div
                  key={v.id}
                  className="bg-black/20 p-5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-white mb-1">{v.title}</h4>
                      <p className="text-xs text-gray-500">
                        {v.created_at && new Date(v.created_at).toLocaleString()} · {v.mode === 'normal' ? '일반' : '후원'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('삭제하시겠습니까?')) {
                          onSend({ type: 'deleteVote', voteId: v.id });
                          setTimeout(() => onSend({ type: 'getVoteHistory' }), 500);
                        }
                      }}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* 간단한 결과 표시 */}
                  {v.options && v.options.length > 0 && (
                    <div className="mb-4 space-y-1.5">
                      {v.options.slice(0, 3).map((opt, i) => (
                        <div key={opt.id || i} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 w-4">{i + 1}.</span>
                          <span className="flex-1 truncate text-gray-300">{opt.label}</span>
                          <span className="font-bold text-emerald-400">{opt.count}</span>
                        </div>
                      ))}
                      {v.options.length > 3 && (
                        <p className="text-xs text-gray-600">+{v.options.length - 3}개 더...</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShowBallots(v.id, v)}
                      className="flex-1 py-2.5 bg-white/5 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
                    >
                      투표자 목록
                    </button>
                    <button
                      onClick={() => openPickModal(v.id, v)}
                      className="flex-1 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-2"
                    >
                      <Trophy size={16} /> 추첨
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 투표자 목록 모달 */}
      <Modal isOpen={isBallotModalOpen} onClose={() => setIsBallotModalOpen(false)} title="투표자 상세 현황">
        <div className="space-y-5">
          <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
            <span className="font-bold text-white">총 {ballots.length}명 참여</span>
            <button
              onClick={() => setShowNicknames(!showNicknames)}
              className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all"
            >
              {showNicknames ? <EyeOff size={14} /> : <Eye size={14} />}
              {showNicknames ? '가리기' : '보기'}
            </button>
          </div>

          <div className="max-h-[450px] overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {/* 현재 투표 또는 대상 투표의 옵션 정보로 그룹화 */}
            {(targetVoteData?.options || currentVote?.options) ? (
              (targetVoteData?.options || currentVote?.options)?.map((opt) => {
                const voters = ballots.filter(b => b.optionId === opt.id);
                const percent = ballots.length === 0 ? 0 : Math.round((voters.length / ballots.length) * 100);

                return (
                  <div key={opt.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-white">{opt.label}</h4>
                      <span className="text-xs font-bold text-emerald-400">{voters.length}명 ({percent}%)</span>
                    </div>
                    <div className="h-1 bg-black/40 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
                    </div>
                    {voters.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {voters.map((b, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg text-sm"
                          >
                            <span className="text-gray-400">{showNicknames ? b.nickname : `익명(${b.userIdHash.substring(0, 4)})`}</span>
                            {b.amount > 1 && <span className="text-emerald-400 font-bold">₩{b.amount.toLocaleString()}</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">아직 투표자가 없습니다</p>
                    )}
                  </div>
                );
              })
            ) : (
              // 옵션 정보 없을 때 전체 리스트
              <div className="flex flex-wrap gap-2">
                {ballots.map((b, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 bg-black/30 px-3 py-2 rounded-lg"
                  >
                    <span className="text-sm text-gray-300">
                      {showNicknames ? b.nickname : `익명(${b.userIdHash.substring(0, 4)})`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* 추첨 설정 모달 */}
      <Modal isOpen={isPickModalOpen} onClose={() => setIsPickModalOpen(false)} title="당첨자 추첨">
        <div className="space-y-6 py-2">
          <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-center">
            <span className="text-gray-400">참여자</span>
            <span className="font-black text-white ml-2">{ballots.length}명</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-3">추첨 인원</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max={Math.max(10, ballots.length)}
                value={pickCount}
                onChange={e => setPickCount(Number(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-zinc-700 accent-emerald-500"
              />
              <input
                type="number"
                min="1"
                max="99"
                value={pickCount}
                onChange={e => setPickCount(Math.max(1, Number(e.target.value)))}
                className="w-16 bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-center font-bold text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-3">추첨 대상</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: '전체' },
                { id: 'win', label: '다수표' },
                { id: 'lose', label: '소수표' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPickFilter(f.id as 'all' | 'win' | 'lose')}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                    pickFilter === f.id
                      ? 'bg-emerald-500 text-black border-emerald-500'
                      : 'bg-black/20 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={executePick}
            disabled={ballots.length === 0}
            className="w-full py-4 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trophy size={20} /> 추첨 시작
          </button>
        </div>
      </Modal>

      {/* 당첨자 결과 모달 */}
      <AnimatePresence>
        {isWinnerModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
          >
            <div className="relative w-full max-w-4xl flex flex-col items-center">
              <button
                onClick={closeWinnerModal}
                className="absolute top-0 right-0 p-3 text-gray-500 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>

              {animationPhase !== 'done' ? (
                // 슬롯머신 애니메이션
                <div className="flex flex-col items-center gap-8 w-full">
                  <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
                    추첨 중...
                  </h2>
                  <div className="flex gap-4 justify-center flex-wrap">
                    {winners.slice(0, Math.min(5, winners.length)).map((w, i) => (
                      <SlotMachine key={i} winnerName={w.nickname} index={i} />
                    ))}
                  </div>
                  <p className="text-emerald-400 font-bold animate-pulse text-xl uppercase tracking-widest">
                    SPINNING...
                  </p>
                </div>
              ) : (
                // 최종 결과
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-8 w-full"
                >
                  <div className="flex items-center gap-3">
                    <Trophy size={48} className="text-yellow-400" />
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
                      당첨자!
                    </h2>
                  </div>

                  <div className={`grid gap-4 w-full max-w-3xl ${getWinnerGridClass(winners.length)}`}>
                    {winners.map((w, i) => (
                      <motion.div
                        key={i}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-gradient-to-br from-emerald-500/20 to-zinc-900 border border-emerald-500/30 p-6 rounded-2xl flex flex-col items-center gap-3 shadow-lg"
                      >
                        <div className="w-12 h-12 bg-emerald-500 text-black rounded-full flex items-center justify-center font-black text-xl">
                          {i + 1}
                        </div>
                        <div className="text-xl font-black text-white text-center break-all">
                          {w.nickname}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <button
                    onClick={closeWinnerModal}
                    className="px-8 py-3 bg-white/10 rounded-full font-bold hover:bg-white/20 transition-all mt-4"
                  >
                    닫기
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
