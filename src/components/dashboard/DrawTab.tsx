import { useState, useEffect, useMemo } from 'react';
import { useBotStore } from '@/lib/store';
import { Gift, Users, Trophy, DollarSign, Play, RotateCcw, StopCircle, X, Sparkles, Star, Crown } from 'lucide-react';
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
      color: ['#ec4899', '#f472b6', '#fbbf24', '#a855f7', '#60a5fa', '#34d399', '#f43f5e'][Math.floor(Math.random() * 7)]
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

interface Winner {
  nickname?: string;
  nick?: string;
  amount?: number;
}

export default function DrawTab({ onSend }: { onSend: (msg: any) => void }) {
  const { draw } = useBotStore();
  const [subTab, setSubTab] = useState<'chat' | 'donation'>('chat');

  const [command, setCommand] = useState('!참여');
  const [useCommand, setUseCommand] = useState(true);
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const [winnerCount, setWinnerCount] = useState(1);

  const [donationMode, setDonationMode] = useState<'all' | 'min'>('all');
  const [minAmount, setMinAmount] = useState(1000);

  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'rolling' | 'stopping' | 'done'>('idle');

  // 참여자 목록을 슬롯머신용으로 사용
  const nicknamePool = useMemo(() => {
    if (draw.participantsList && draw.participantsList.length > 0) {
      return draw.participantsList;
    }
    return ['참여자1', '참여자2', '참여자3', '참여자4', '참여자5'];
  }, [draw.participantsList]);

  useEffect(() => {
    if (draw.status === 'rolling') {
      setIsResultModalOpen(true);
      setAnimationPhase('rolling');
    } else if (draw.status === 'completed' && draw.winners.length > 0) {
      // 애니메이션 시퀀스
      setTimeout(() => setAnimationPhase('stopping'), 2500);
      setTimeout(() => setAnimationPhase('done'), 4500);
    }
  }, [draw.status, draw.winners.length]);

  const startDraw = () => {
    let target: string = subTab === 'donation' ? 'donation' : (useCommand ? 'chat' : 'all');
    if (subTab === 'chat' && subscriberOnly) target = 'subscriber';

    onSend({
      type: 'startDraw',
      settings: {
        target,
        winnerCount,
        command: useCommand ? command : null,
        minAmount: donationMode === 'min' ? minAmount : 0
      }
    });
  };

  const stopDraw = () => {
    onSend({ type: 'stopDraw' });
  };

  const pickWinners = () => {
    onSend({ type: 'pickWinners' });
    onSend({ type: 'toggleOverlay', visible: true, view: 'draw' });
  };

  const reset = () => {
    if (confirm('추첨 상태를 초기화하시겠습니까?')) {
      onSend({ type: 'resetDraw' });
      setIsResultModalOpen(false);
      setAnimationPhase('idle');
    }
  };

  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setAnimationPhase('idle');
  };

  // 그리드 클래스 결정 (Tailwind JIT 대응)
  const getWinnerGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    return 'grid-cols-2 md:grid-cols-4';
  };

  // 슬롯머신 컴포넌트 - 구분선 스타일 (VoteTab과 동일)
  const SlotMachine = ({ winnerName, index }: { winnerName: string; index: number }) => {
    const itemHeight = 80;
    const containerHeight = 240;

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
        <div
          className="w-56 bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl overflow-hidden relative shadow-2xl border-4 border-zinc-600"
          style={{ height: containerHeight }}
        >
          {/* 상단 구분선 */}
          <div className="absolute top-0 left-0 right-0 h-[80px] border-b-4 border-pink-500/80 bg-gradient-to-b from-black/60 to-transparent z-30 pointer-events-none" />

          {/* 하단 구분선 */}
          <div className="absolute bottom-0 left-0 right-0 h-[80px] border-t-4 border-pink-500/80 bg-gradient-to-t from-black/60 to-transparent z-30 pointer-events-none" />

          {/* 중앙 하이라이트 영역 */}
          <div className="absolute top-[80px] left-0 right-0 h-[80px] bg-gradient-to-r from-pink-500/20 via-pink-500/30 to-pink-500/20 z-20 pointer-events-none border-y-2 border-pink-400/50" />

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
              <>
                <div style={{ height: itemHeight }} className="flex items-center justify-center">
                  <span className="text-xl font-bold text-white/30">...</span>
                </div>
                <div style={{ height: itemHeight }} className="flex items-center justify-center">
                  <span className="text-2xl font-black text-pink-400 truncate px-4 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                    {winnerName}
                  </span>
                </div>
                <div style={{ height: itemHeight }} className="flex items-center justify-center">
                  <span className="text-xl font-bold text-white/30">...</span>
                </div>
              </>
            ) : (
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 왼쪽: 설정 패널 */}
      <div className="lg:col-span-5 bg-white/5 border border-white/5 p-6 rounded-2xl h-fit">
        <div className="flex gap-2 mb-6 bg-black/20 p-1 rounded-xl">
          <button
            onClick={() => setSubTab('chat')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              subTab === 'chat' ? 'bg-pink-500 text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            <Users size={18} /> 시청자 추첨
          </button>
          <button
            onClick={() => setSubTab('donation')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              subTab === 'donation' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'
            }`}
          >
            <DollarSign size={18} /> 후원 추첨
          </button>
        </div>

        <div className="space-y-6">
          {subTab === 'chat' && (
            <>
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-widest">참여 방식</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUseCommand(false)}
                    className={`flex-1 py-3 border rounded-xl font-bold transition-all ${
                      !useCommand
                        ? 'bg-pink-500/10 border-pink-500 text-pink-500'
                        : 'border-white/10 text-gray-500 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    모든 채팅
                  </button>
                  <button
                    onClick={() => setUseCommand(true)}
                    className={`flex-1 py-3 border rounded-xl font-bold transition-all ${
                      useCommand
                        ? 'bg-pink-500/10 border-pink-500 text-pink-500'
                        : 'border-white/10 text-gray-500 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    명령어 입력
                  </button>
                </div>
                {useCommand && (
                  <input
                    value={command}
                    onChange={e => setCommand(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-pink-500 outline-none"
                    placeholder="예: !참여"
                  />
                )}
              </div>
              <div
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  subscriberOnly
                    ? 'bg-pink-500/10 border-pink-500/30'
                    : 'bg-black/20 border-white/5'
                }`}
              >
                <div>
                  <p className="font-bold text-white">구독자 전용</p>
                  <p className="text-[10px] text-gray-500">구독 중인 시청자만 참여 가능</p>
                </div>
                <input
                  type="checkbox"
                  checked={subscriberOnly}
                  onChange={e => setSubscriberOnly(e.target.checked)}
                  className="w-6 h-6 accent-pink-500 rounded"
                />
              </div>
            </>
          )}

          {subTab === 'donation' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-widest">금액 필터</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDonationMode('all')}
                  className={`flex-1 py-3 border rounded-xl font-bold transition-all ${
                    donationMode === 'all'
                      ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
                      : 'border-white/10 text-gray-500 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  모든 금액
                </button>
                <button
                  onClick={() => setDonationMode('min')}
                  className={`flex-1 py-3 border rounded-xl font-bold transition-all ${
                    donationMode === 'min'
                      ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
                      : 'border-white/10 text-gray-500 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  최소 금액
                </button>
              </div>
              {donationMode === 'min' && (
                <div className="relative">
                  <input
                    type="number"
                    value={minAmount}
                    onChange={e => setMinAmount(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none pr-12"
                    placeholder="최소 금액"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">원</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">당첨 인원</label>
              <span className="text-pink-500 font-black text-lg">{winnerCount}명</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="50"
                value={winnerCount}
                onChange={e => setWinnerCount(Number(e.target.value))}
                className="flex-1 accent-pink-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                min="1"
                max="99"
                value={winnerCount}
                onChange={e => setWinnerCount(Math.max(1, Number(e.target.value)))}
                className="w-16 bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-center font-bold text-white"
              />
            </div>
          </div>

          <button
            onClick={startDraw}
            disabled={draw.isCollecting}
            className={`w-full py-4 rounded-xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${
              draw.isCollecting
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-[1.02] shadow-pink-500/20'
            }`}
          >
            <Gift size={22} />
            {draw.isCollecting ? '참여자 모집 중...' : '모집 시작'}
          </button>
        </div>
      </div>

      {/* 오른쪽: 결과 및 상태 */}
      <div className="lg:col-span-7 space-y-6">
        {/* 상태 카드 - 더 화려하게 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-zinc-900/80 to-black border border-white/10 p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden gap-6"
        >
          {/* 배경 장식 */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          {draw.isCollecting && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-transparent to-pink-500/5"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          <div className="z-10">
            {draw.isCollecting ? (
              <motion.div
                className="flex items-center gap-3 mb-3"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-400 rounded-full shadow-lg shadow-pink-500/30"
                >
                  <motion.span
                    className="w-3 h-3 bg-white rounded-full"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <span className="text-sm font-black text-white tracking-wider">모집 중</span>
                </motion.div>
              </motion.div>
            ) : draw.status === 'completed' ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full text-sm font-black text-black mb-3">
                <Trophy size={16} /> 완료!
              </span>
            ) : (
              <span className="inline-block px-4 py-2 bg-gray-600 rounded-full text-sm font-black text-white mb-3">
                READY
              </span>
            )}
            <h2 className="text-3xl md:text-4xl font-black text-white">
              {draw.isCollecting ? '참여자 모집 중...' : draw.status === 'completed' ? '추첨 완료!' : '추첨 대기'}
            </h2>
            <p className="text-gray-400 mt-2">
              {draw.isCollecting ? '시청자들이 참여하고 있습니다' : draw.status === 'completed' ? '당첨자가 선정되었습니다' : '모집을 시작해주세요'}
            </p>
          </div>

          <div className="flex items-center gap-4 z-10">
            {/* 참여자 카운터 */}
            <motion.div
              className="bg-black/40 px-8 py-5 rounded-2xl border border-pink-500/20 text-center min-w-[140px]"
              animate={draw.isCollecting ? { scale: [1, 1.02, 1], borderColor: ['rgba(236,72,153,0.2)', 'rgba(236,72,153,0.5)', 'rgba(236,72,153,0.2)'] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] mb-2">Entries</p>
              <motion.p
                className="text-5xl font-black tabular-nums text-white"
                key={draw.participantCount}
                initial={{ scale: 1.3, color: '#ec4899' }}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.3 }}
              >
                {draw.participantCount}
              </motion.p>
            </motion.div>
            <motion.button
              onClick={reset}
              className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
              title="초기화"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <RotateCcw size={24} />
            </motion.button>
          </div>
        </motion.div>

        {/* 참여자 리스트 - 더 화려하게 */}
        {draw.status !== 'rolling' && draw.status !== 'completed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-black/30 p-5 rounded-2xl border border-white/10 max-h-48 overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-black text-gray-400 flex items-center gap-2">
                {draw.isCollecting && (
                  <motion.span
                    className="w-2 h-2 bg-pink-500 rounded-full"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
                {draw.isCollecting ? 'LIVE 참여자' : '참여자 목록'}
                <span className="text-pink-400">({draw.participantsList?.length || 0}명)</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {draw.participantsList && draw.participantsList.length > 0 ? (
                  draw.participantsList.map((p, i) => (
                    <motion.span
                      key={`${p}-${i}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-3 py-2 bg-gradient-to-r from-white/5 to-white/[0.02] rounded-lg text-sm font-medium text-gray-300 border border-white/10"
                    >
                      {p}
                    </motion.span>
                  ))
                ) : (
                  <span className="text-gray-600 text-sm">아직 참여자가 없습니다</span>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* 액션 버튼 - 더 화려하게 */}
        <div className="flex gap-4">
          {draw.isCollecting && (
            <motion.button
              onClick={stopDraw}
              className="flex-1 py-5 bg-gradient-to-r from-red-500 to-rose-500 text-white font-black text-xl rounded-2xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{ boxShadow: ['0 0 20px rgba(239,68,68,0.3)', '0 0 40px rgba(239,68,68,0.5)', '0 0 20px rgba(239,68,68,0.3)'] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <StopCircle size={28} /> 모집 마감
            </motion.button>
          )}
          {!draw.isCollecting && draw.status !== 'completed' && draw.participantCount > 0 && (
            <motion.button
              onClick={pickWinners}
              className="flex-1 py-5 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black text-xl rounded-2xl shadow-lg shadow-yellow-500/30 flex items-center justify-center gap-3"
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(234,179,8,0.5)' }}
              whileTap={{ scale: 0.98 }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Trophy size={28} /> 당첨자 뽑기!
            </motion.button>
          )}
        </div>

        {/* 최근 당첨자 미리보기 - 더 화려하게 */}
        {draw.winners.length > 0 && !isResultModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-black/20 p-6 rounded-2xl border border-pink-500/30 relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-center mb-5 relative z-10">
              <h3 className="font-black text-xl flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Trophy className="text-yellow-400" size={24} />
                </motion.div>
                <span className="bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">당첨자</span>
              </h3>
              <motion.button
                onClick={() => {
                  setIsResultModalOpen(true);
                  setAnimationPhase('done');
                }}
                className="px-4 py-2 bg-pink-500/20 text-pink-400 rounded-lg text-sm font-bold hover:bg-pink-500 hover:text-white transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                다시 보기
              </motion.button>
            </div>
            <div className="flex flex-wrap gap-3 relative z-10">
              {draw.winners.slice(0, 10).map((w: Winner, i: number) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-black/40 px-4 py-3 rounded-xl flex items-center gap-3 border border-pink-500/20"
                >
                  <motion.span
                    className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black rounded-full flex items-center justify-center text-sm font-black shadow-lg"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  >
                    {i + 1}
                  </motion.span>
                  <span className="font-bold text-white text-lg">{w.nickname || w.nick}</span>
                  {w.amount && (
                    <span className="text-sm font-bold text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded">
                      ₩{w.amount.toLocaleString()}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* 당첨자 결과 모달 */}
      <AnimatePresence>
        {isResultModalOpen && (
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
                onClick={closeResultModal}
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
                    {draw.winners.slice(0, Math.min(5, draw.winners.length)).map((w: Winner, i: number) => (
                      <SlotMachine key={i} winnerName={w.nickname || w.nick || '???'} index={i} />
                    ))}
                  </div>
                  <motion.p
                    className="text-pink-400 font-black text-2xl uppercase tracking-[0.3em]"
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
                      <Crown size={56} className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.7)]" fill="currentColor" />
                    </motion.div>
                    <div className="text-center">
                      <motion.p
                        className="text-pink-400 text-sm font-black uppercase tracking-[0.3em] mb-2"
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
                      <Sparkles size={48} className="text-pink-400 drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]" />
                    </motion.div>
                  </div>

                  <div className={`grid gap-5 w-full max-w-4xl ${getWinnerGridClass(draw.winners.length)}`}>
                    {draw.winners.map((w: Winner, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ y: 50, opacity: 0, scale: 0.5, rotateY: 180 }}
                        animate={{ y: 0, opacity: 1, scale: 1, rotateY: 0 }}
                        transition={{ delay: i * 0.2, type: 'spring', stiffness: 150, damping: 15 }}
                        className="relative group"
                      >
                        {/* 글로우 효과 */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-yellow-400 to-pink-500 rounded-3xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" />

                        <div className="relative bg-gradient-to-br from-pink-500/30 via-zinc-900 to-zinc-900 border-2 border-pink-500/50 p-8 rounded-3xl flex flex-col items-center gap-4 shadow-2xl">
                          <motion.div
                            className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black rounded-full flex items-center justify-center font-black text-2xl shadow-lg"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          >
                            {i + 1}
                          </motion.div>
                          <div className="text-2xl font-black text-white text-center break-all">
                            {w.nickname || w.nick}
                          </div>
                          {w.amount && (
                            <span className="text-sm font-bold text-yellow-400 font-mono bg-black/40 px-4 py-1 rounded-full">
                              ₩{w.amount.toLocaleString()}
                            </span>
                          )}
                          {i === 0 && (
                            <motion.span
                              className="text-xs font-black text-pink-400 bg-pink-400/20 px-3 py-1 rounded-full"
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

                  <div className="flex gap-4 mt-4">
                    <motion.button
                      onClick={closeResultModal}
                      className="px-10 py-4 bg-white/10 rounded-full font-bold hover:bg-white/20 transition-all text-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      닫기
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        closeResultModal();
                        reset();
                      }}
                      className="px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-black hover:from-pink-400 hover:to-purple-500 transition-all text-lg shadow-lg shadow-pink-500/30"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      새 추첨
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
