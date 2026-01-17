import { useState, useEffect, useMemo, useRef } from 'react';
import { useBotStore } from '@/lib/store';
import { Plus, Trash2, Play, Square, Activity, DollarSign, Vote, Users, List, RefreshCw, Eye, EyeOff, Trophy, RotateCcw, ChevronRight, X, Sparkles, Star, PartyPopper } from 'lucide-react';
import { Modal } from './Modals';
import { motion, AnimatePresence } from 'framer-motion';

// 축하 파티클 컴포넌트
const Confetti = () => {
  const particles = useMemo(() =>
    Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2,
      size: 8 + Math.random() * 8,
      color: ['#10b981', '#22c55e', '#fbbf24', '#f472b6', '#60a5fa', '#a78bfa', '#34d399'][Math.floor(Math.random() * 7)]
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            y: '100vh',
            opacity: [1, 1, 0],
            rotate: 720,
            scale: [1, 1.2, 0.8]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
};

// 반짝이는 별 효과
const StarBurst = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 15 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.5, 0],
          opacity: [0, 1, 0],
          rotate: [0, 180]
        }}
        transition={{
          duration: 1.5,
          delay: Math.random() * 2,
          repeat: Infinity,
          repeatDelay: Math.random() * 2
        }}
      >
        <Star size={20} className="text-yellow-400" fill="currentColor" />
      </motion.div>
    ))}
  </div>
);

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

  // 모달 열림 목적 추적 (투표자 보기 vs 추첨용 데이터 로딩)
  const ballotsRequestPurpose = useRef<'view' | 'pick'>('view');

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
      // 목적에 따라 모달 열기 결정
      if (ballotsRequestPurpose.current === 'view') {
        setIsBallotModalOpen(true);
      }
      // 'pick' 목적이면 모달 열지 않음 (데이터만 로딩)
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
      setTimeout(() => setAnimationPhase('stopping'), 2500);
      setTimeout(() => setAnimationPhase('done'), 4500);
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

  // 투표자 목록 보기 (모달 열림)
  const handleShowBallots = (voteId: string, voteData?: VoteData) => {
    ballotsRequestPurpose.current = 'view';
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
    onSend({ type: 'endVote' }); // 먼저 종료 처리
    setTimeout(() => {
      onSend({ type: 'resetVote' });
      setActiveView('history');
      setTimeout(() => onSend({ type: 'getVoteHistory' }), 300);
    }, 200);
  };

  // 추첨 모달 열기 (데이터만 로딩, 투표자 모달 열지 않음)
  const openPickModal = (voteId: string, voteData?: VoteData) => {
    ballotsRequestPurpose.current = 'pick';
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

  // 슬롯머신 컴포넌트 - 구분선 스타일
  const SlotMachine = ({ winnerName, index }: { winnerName: string; index: number }) => {
    const itemHeight = 80;
    const containerHeight = 240;

    // 충분한 양의 아이템 생성
    const items = useMemo(() => {
      const pool = nicknamePool.length > 0 ? nicknamePool : ['???'];
      const repeated: string[] = [];
      for (let i = 0; i < 40; i++) {
        repeated.push(...pool);
      }
      return repeated;
    }, [nicknamePool]);

    const totalHeight = items.length * itemHeight;

    return (
      <div className="flex flex-col items-center">
        {/* 슬롯머신 본체 */}
        <div
          className="w-56 bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl overflow-hidden relative shadow-2xl border-4 border-zinc-600"
          style={{ height: containerHeight }}
        >
          {/* 상단 구분선 */}
          <div className="absolute top-0 left-0 right-0 h-[80px] border-b-4 border-yellow-500/80 bg-gradient-to-b from-black/60 to-transparent z-30 pointer-events-none" />

          {/* 하단 구분선 */}
          <div className="absolute bottom-0 left-0 right-0 h-[80px] border-t-4 border-yellow-500/80 bg-gradient-to-t from-black/60 to-transparent z-30 pointer-events-none" />

          {/* 중앙 하이라이트 영역 */}
          <div className="absolute top-[80px] left-0 right-0 h-[80px] bg-gradient-to-r from-emerald-500/20 via-emerald-500/30 to-emerald-500/20 z-20 pointer-events-none border-y-2 border-emerald-400/50" />

          {/* 회전 컨텐츠 */}
          <motion.div
            className="flex flex-col"
            initial={{ y: 0 }}
            animate={
              animationPhase === 'rolling'
                ? { y: [0, -totalHeight / 2] }
                : animationPhase === 'stopping' || animationPhase === 'done'
                ? { y: -itemHeight }
                : { y: 0 }
            }
            transition={
              animationPhase === 'rolling'
                ? { duration: 0.3, repeat: Infinity, ease: 'linear' }
                : animationPhase === 'stopping'
                ? { duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.4 }
                : { duration: 0 }
            }
          >
            {animationPhase === 'done' || animationPhase === 'stopping' ? (
              // 최종 결과
              <>
                <div style={{ height: itemHeight }} className="flex items-center justify-center">
                  <span className="text-xl font-bold text-white/30">...</span>
                </div>
                <div style={{ height: itemHeight }} className="flex items-center justify-center">
                  <span className="text-2xl font-black text-emerald-400 truncate px-4 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                    {winnerName}
                  </span>
                </div>
                <div style={{ height: itemHeight }} className="flex items-center justify-center">
                  <span className="text-xl font-bold text-white/30">...</span>
                </div>
              </>
            ) : (
              // 회전 중
              items.map((name, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center shrink-0"
                  style={{ height: itemHeight }}
                >
                  <span className="text-xl font-bold text-white/50 truncate px-4">
                    {name}
                  </span>
                </div>
              ))
            )}
          </motion.div>
        </div>
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
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Vote className="text-emerald-500" size={20} /> 새 투표 만들기
              </h3>
              {/* 초기화 버튼 - 진행 중인 투표가 있을 때 */}
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
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full min-h-[400px] bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-8 rounded-2xl flex flex-col items-center justify-center text-gray-500"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Activity size={64} className="mb-6 opacity-20" />
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
                {/* 배경 장식 - 더 화려하게 */}
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                {currentVote.status === 'active' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                {/* 헤더 - 더 눈에 띄게 */}
                <div className="flex justify-between items-start mb-6 z-10">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      {currentVote.status === 'active' ? (
                        <motion.div
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full shadow-lg shadow-emerald-500/30"
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
                      ) : currentVote.status === 'ready' ? (
                        <span className="px-4 py-2 bg-yellow-500 rounded-full text-sm font-black text-black">
                          READY
                        </span>
                      ) : (
                        <span className="px-4 py-2 bg-gray-600 rounded-full text-sm font-black text-white">
                          ENDED
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        currentVote.mode === 'normal'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-pink-500/20 text-pink-400'
                      }`}>
                        {currentVote.mode === 'normal' ? '1인 1표' : '💰 후원 비례'}
                      </span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white mb-2">{currentVote.title}</h2>
                    {/* 참여자 카운터 - 더 눈에 띄게 */}
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl"
                        animate={currentVote.status === 'active' ? { scale: [1, 1.02, 1] } : {}}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <Users size={18} className="text-emerald-400" />
                        <span className="font-black text-2xl tabular-nums text-white">
                          {(currentVote.totalParticipants || 0).toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-400">명 참여</span>
                      </motion.div>
                      {currentVote.mode === 'donation' && (
                        <motion.div
                          className="flex items-center gap-2 bg-pink-500/10 px-4 py-2 rounded-xl"
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0.25 }}
                        >
                          <DollarSign size={18} className="text-pink-400" />
                          <span className="font-black text-xl tabular-nums text-pink-400">
                            ₩{(currentVote.totalVotes || 0).toLocaleString()}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={handleReset}
                      className="p-3 bg-white/5 rounded-xl hover:bg-red-500/20 hover:text-red-400 text-gray-500 transition-all border border-white/5"
                      title="초기화"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <RotateCcw size={18} />
                    </motion.button>
                    <motion.button
                      onClick={() => onSend({ type: 'toggleOverlay', visible: true, view: 'vote' })}
                      className="px-5 py-3 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl text-sm font-bold text-emerald-400 hover:from-emerald-500/30 hover:to-cyan-500/30 transition-all border border-emerald-500/30"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Eye size={16} className="inline mr-2" />
                      오버레이
                    </motion.button>
                  </div>
                </div>

                {/* 투표 항목 목록 - 더 화려하게 */}
                <div className="flex-1 space-y-3 z-10 overflow-y-auto custom-scrollbar pr-2 max-h-[350px]">
                  {currentVote.options?.map((opt, i) => {
                    const percent = getPercent(opt.count, currentVote);
                    const sortedOptions = [...(currentVote.options || [])].sort((a, b) => b.count - a.count);
                    const rank = sortedOptions.findIndex(o => o.id === opt.id) + 1;
                    const isLeading = rank === 1 && opt.count > 0;

                    return (
                      <motion.div
                        key={opt.id || i}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`group relative h-16 rounded-xl overflow-hidden border transition-all ${
                          isLeading
                            ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                            : 'bg-black/40 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {/* 프로그레스 바 */}
                        <motion.div
                          className={`absolute top-0 left-0 h-full ${
                            isLeading
                              ? 'bg-gradient-to-r from-emerald-500/40 to-cyan-500/30'
                              : 'bg-white/10'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                        {/* 글로우 효과 (1등만) */}
                        {isLeading && (
                          <motion.div
                            className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-emerald-500/20 to-transparent"
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
                              {isLeading ? '👑' : i + 1}
                            </motion.span>
                            <span className={isLeading ? 'text-white' : 'text-gray-300'}>{opt.label}</span>
                            {isLeading && (
                              <motion.span
                                className="text-xs font-black text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-md"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                              >
                                1위
                              </motion.span>
                            )}
                          </span>
                          <div className="text-right flex items-center gap-3">
                            <motion.span
                              className={`font-black text-2xl tabular-nums ${isLeading ? 'text-white' : 'text-gray-300'}`}
                              key={opt.count}
                              initial={{ scale: 1.2, color: '#10b981' }}
                              animate={{ scale: 1, color: isLeading ? '#ffffff' : '#d1d5db' }}
                              transition={{ duration: 0.3 }}
                            >
                              {opt.count.toLocaleString()}
                            </motion.span>
                            <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                              isLeading ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/5 text-gray-500'
                            }`}>
                              {percent}%
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* 하단 액션 버튼 - 더 화려하게 */}
                <div className="mt-6 flex gap-3 z-10 pt-4 border-t border-white/10">
                  {currentVote.status === 'ready' && (
                    <motion.button
                      onClick={() => onSend({ type: 'startVote' })}
                      className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-green-400 text-black font-black rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-3 text-lg"
                      whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Play size={22} fill="currentColor" /> 투표 시작
                    </motion.button>
                  )}
                  {currentVote.status === 'active' && (
                    <motion.button
                      onClick={() => onSend({ type: 'endVote' })}
                      className="flex-1 py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white font-black rounded-xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-3 text-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      animate={{ boxShadow: ['0 0 20px rgba(239, 68, 68, 0.3)', '0 0 30px rgba(239, 68, 68, 0.5)', '0 0 20px rgba(239, 68, 68, 0.3)'] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Square size={20} fill="currentColor" /> 투표 마감
                    </motion.button>
                  )}
                  {currentVote.status === 'ended' && (
                    <>
                      <motion.button
                        onClick={handleMoveToHistory}
                        className="flex-1 py-4 bg-zinc-700 text-white font-bold rounded-xl hover:bg-zinc-600 transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        기록으로 이동 <ChevronRight size={18} />
                      </motion.button>
                      <motion.button
                        onClick={() => openPickModal(currentVote.id)}
                        className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black rounded-xl shadow-lg shadow-yellow-500/30 flex items-center gap-2 text-lg"
                        whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(234, 179, 8, 0.5)' }}
                        whileTap={{ scale: 0.95 }}
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Trophy size={22} /> 추첨하기
                      </motion.button>
                    </>
                  )}
                  <motion.button
                    onClick={() => handleShowBallots(currentVote.id)}
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
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
          >
            {/* 축하 효과 */}
            {animationPhase === 'done' && <Confetti />}
            {animationPhase === 'done' && <StarBurst />}

            <div className="relative w-full max-w-5xl flex flex-col items-center z-10">
              <button
                onClick={closeWinnerModal}
                className="absolute top-0 right-0 p-3 text-gray-500 hover:text-white transition-colors z-50"
              >
                <X size={32} />
              </button>

              {animationPhase !== 'done' ? (
                // 슬롯머신 애니메이션
                <div className="flex flex-col items-center gap-10 w-full">
                  <motion.h2
                    className="text-5xl md:text-6xl font-black text-white uppercase tracking-tight"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    추첨 중...
                  </motion.h2>
                  <div className="flex gap-6 justify-center flex-wrap">
                    {winners.slice(0, Math.min(5, winners.length)).map((w, i) => (
                      <SlotMachine key={i} winnerName={w.nickname} index={i} />
                    ))}
                  </div>
                  <motion.p
                    className="text-emerald-400 font-black text-2xl uppercase tracking-[0.3em]"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    SPINNING...
                  </motion.p>
                </div>
              ) : (
                // 최종 결과
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-10 w-full"
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: [0, -15, 15, -15, 15, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: 2 }}
                    >
                      <Trophy size={64} className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.7)]" />
                    </motion.div>
                    <div className="text-center">
                      <motion.p
                        className="text-emerald-400 text-sm font-black uppercase tracking-[0.3em] mb-2"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        Congratulations!
                      </motion.p>
                      <motion.h2
                        className="text-5xl md:text-6xl font-black text-white uppercase tracking-tight"
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        당첨자!
                      </motion.h2>
                    </div>
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 15, -15, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: 2 }}
                    >
                      <Sparkles size={48} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
                    </motion.div>
                  </div>

                  <div className={`grid gap-5 w-full max-w-4xl ${getWinnerGridClass(winners.length)}`}>
                    {winners.map((w, i) => (
                      <motion.div
                        key={i}
                        initial={{ y: 50, opacity: 0, scale: 0.5, rotateY: 180 }}
                        animate={{ y: 0, opacity: 1, scale: 1, rotateY: 0 }}
                        transition={{ delay: i * 0.2, type: 'spring', stiffness: 150, damping: 15 }}
                        className="relative group"
                      >
                        {/* 글로우 효과 */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-yellow-400 to-emerald-500 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" />

                        <div className="relative bg-gradient-to-br from-emerald-500/30 via-zinc-900 to-zinc-900 border-2 border-emerald-500/50 p-8 rounded-3xl flex flex-col items-center gap-4 shadow-2xl">
                          <motion.div
                            className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black rounded-full flex items-center justify-center font-black text-2xl shadow-lg"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          >
                            {i + 1}
                          </motion.div>
                          <div className="text-2xl font-black text-white text-center break-all">
                            {w.nickname}
                          </div>
                          {i === 0 && (
                            <motion.span
                              className="text-xs font-black text-yellow-400 bg-yellow-400/20 px-3 py-1 rounded-full"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                            >
                              WINNER
                            </motion.span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    onClick={closeWinnerModal}
                    className="px-12 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-black rounded-full font-black text-lg hover:scale-105 transition-all shadow-lg shadow-emerald-500/30 mt-4"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    확인
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
