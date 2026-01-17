'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Crown, Star, Zap } from 'lucide-react';

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
}

interface RouletteItem {
  id: string;
  label: string;
  color: string;
  weight: number;
}

interface Winner {
  nickname: string;
  nick?: string;
  amount?: number;
}

// 파티클 컴포넌트
const Confetti = () => {
  const particles = useMemo(() =>
    Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: ['#fbbf24', '#f472b6', '#60a5fa', '#34d399', '#a78bfa'][Math.floor(Math.random() * 5)]
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-3 h-3 rounded-full"
          style={{ left: `${p.x}%`, backgroundColor: p.color }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: '100vh', opacity: 0, rotate: 720 }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
};

// 반짝이는 별 효과
const SparkleEffect = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 2, delay: Math.random() * 3, repeat: Infinity }}
      >
        <Star size={16} className="text-yellow-400" fill="currentColor" />
      </motion.div>
    ))}
  </div>
);

export default function IntegratedOverlay() {
  const [view, setView] = useState<'none' | 'vote' | 'draw' | 'roulette'>('none');
  const [isVisible, setIsVisible] = useState(true);

  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [drawData, setDrawData] = useState<{ winners: Winner[] } | null>(null);
  const [rouletteData, setRouletteData] = useState<{ items: RouletteItem[]; selected?: RouletteItem } | null>(null);

  const [isRolling, setIsRolling] = useState(false);
  const [rouletteRotation, setRouletteRotation] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    const getWsUrl = () => {
      const envUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_SERVER_URL;
      const defaultUrl = 'wss://web-production-19eef.up.railway.app';
      if (!envUrl) return defaultUrl;
      if (envUrl.startsWith('ws://') || envUrl.startsWith('wss://')) return envUrl;
      if (envUrl.startsWith('http://')) return envUrl.replace('http://', 'ws://');
      if (envUrl.startsWith('https://')) return envUrl.replace('https://', 'wss://');
      return `wss://${envUrl}`;
    };

    const wsUrl = getWsUrl();
    if (!token) return;

    const ws = new WebSocket(`${wsUrl}/?token=${token}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect' }));
      ws.send(JSON.stringify({ type: 'requestData' }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        const { type, payload } = msg;

        if (type === 'overlayStateUpdate') {
          setIsVisible(payload.isVisible);
          setView(payload.currentView);
        }
        if (type === 'voteStateUpdate') {
          setVoteData(payload.currentVote);
        }
        if (type === 'drawStateUpdate') {
          if (payload.status === 'idle') setIsRolling(false);
        }
        if (type === 'rouletteStateUpdate') {
          setRouletteData((prev) => ({ ...prev, items: payload.items }));
        }

        if (type === 'overlayEvent') {
          if (payload.type === 'startDraw') {
            setView('draw');
            setIsRolling(true);
            setDrawData({ winners: payload.winners });
            setShowConfetti(false);
            setTimeout(() => {
              setIsRolling(false);
              setShowConfetti(true);
            }, 3500);
          }
          if (payload.type === 'spinRoulette') {
            setView('roulette');
            handleRouletteSpin(payload.selectedItem);
          }
        }
      } catch (err) {}
    };

    return () => ws.close();
  }, []);

  const handleRouletteSpin = (selectedItem: RouletteItem) => {
    const items = rouletteData?.items || [];
    if (items.length === 0) return;
    const index = items.findIndex((i) => i.id === selectedItem.id);
    if (index === -1) return;

    const segmentAngle = 360 / items.length;
    const baseRotation = 1800;
    const targetAngle = baseRotation + (360 - index * segmentAngle) - segmentAngle / 2;

    setRouletteRotation(targetAngle);
    setRouletteData((prev) => prev && { ...prev, selected: selectedItem });
    setShowConfetti(false);
    setTimeout(() => setShowConfetti(true), 5200);
  };

  // 투표 1등 찾기
  const getLeader = () => {
    if (!voteData?.options || voteData.options.length === 0) return null;
    return voteData.options.reduce((max, opt) => opt.count > max.count ? opt : max, voteData.options[0]);
  };

  if (!isVisible || view === 'none') return null;

  return (
    <div className="w-screen h-screen bg-transparent flex items-center justify-center overflow-hidden font-sans">
      <AnimatePresence mode="wait">

        {/* ========== 투표 오버레이 ========== */}
        {view === 'vote' && voteData && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-[90%] max-w-5xl relative"
          >
            {/* 배경 글로우 */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 rounded-[3rem] blur-3xl animate-pulse" />

            <div className="relative bg-black/90 backdrop-blur-2xl rounded-[2.5rem] p-10 border-2 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
              {/* 헤더 */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1">
                  <motion.div
                    className="inline-flex items-center gap-2 mb-3"
                    animate={{ scale: voteData.status === 'active' ? [1, 1.05, 1] : 1 }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {voteData.status === 'active' && (
                      <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
                      </span>
                    )}
                    <span className={`px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wider ${
                      voteData.status === 'active'
                        ? 'bg-emerald-500 text-black'
                        : 'bg-gray-600 text-white'
                    }`}>
                      {voteData.status === 'active' ? '🔴 LIVE VOTING' : voteData.status === 'ended' ? 'ENDED' : 'READY'}
                    </span>
                  </motion.div>
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                    {voteData.title}
                  </h1>
                </div>
                <div className="text-right bg-white/5 rounded-2xl px-6 py-4 border border-white/10">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Participants</p>
                  <p className="text-4xl font-black text-white tabular-nums">{voteData.totalParticipants || 0}</p>
                  {voteData.mode === 'donation' && (
                    <p className="text-emerald-400 font-bold text-lg mt-1">₩{(voteData.totalVotes || 0).toLocaleString()}</p>
                  )}
                </div>
              </div>

              {/* 투표 항목 */}
              <div className="space-y-4">
                {voteData.options.map((opt, i) => {
                  const total = voteData.totalVotes || voteData.options.reduce((acc, o) => acc + o.count, 0);
                  const percent = total === 0 ? 0 : Math.round((opt.count / total) * 100);
                  const isLeader = getLeader()?.id === opt.id && opt.count > 0;
                  const barHeight = voteData.options.length <= 4 ? 'h-20' : voteData.options.length <= 6 ? 'h-16' : 'h-14';

                  return (
                    <motion.div
                      key={opt.id}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`relative ${barHeight} rounded-2xl overflow-hidden ${
                        isLeader
                          ? 'bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 border-2 border-emerald-500/50'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      {/* 프로그레스 바 */}
                      <motion.div
                        className={`absolute top-0 left-0 h-full ${
                          isLeader
                            ? 'bg-gradient-to-r from-emerald-500/60 to-cyan-500/60'
                            : 'bg-white/10'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1.5, ease: 'circOut' }}
                      />

                      {/* 내용 */}
                      <div className="absolute inset-0 flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                          <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl ${
                            isLeader
                              ? 'bg-emerald-500 text-black'
                              : 'bg-white/10 text-white/60'
                          }`}>
                            {isLeader ? <Crown size={24} /> : i + 1}
                          </span>
                          <span className={`font-bold text-xl md:text-2xl ${isLeader ? 'text-white' : 'text-white/80'}`}>
                            {opt.label}
                          </span>
                          {isLeader && (
                            <motion.span
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                              className="text-yellow-400 text-sm font-black bg-yellow-400/20 px-3 py-1 rounded-full"
                            >
                              🏆 1위
                            </motion.span>
                          )}
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <span className={`font-black text-3xl md:text-4xl tabular-nums ${isLeader ? 'text-white' : 'text-white/80'}`}>
                            {opt.count.toLocaleString()}
                          </span>
                          <span className={`font-bold text-lg px-3 py-1 rounded-lg ${
                            isLeader ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/5 text-white/50'
                          }`}>
                            {percent}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* 하단 정보 */}
              <div className="mt-6 flex justify-center">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Zap size={16} className="text-yellow-500" />
                  <span>실시간으로 업데이트됩니다</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========== 추첨 오버레이 ========== */}
        {view === 'draw' && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="flex flex-col items-center justify-center gap-12 relative"
          >
            {showConfetti && <Confetti />}
            {showConfetti && <SparkleEffect />}

            <motion.h1
              className={`text-7xl md:text-8xl font-black uppercase tracking-tighter ${
                isRolling
                  ? 'text-white'
                  : 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent'
              }`}
              animate={isRolling ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
            >
              {isRolling ? '추첨 중...' : '🎉 당첨자!'}
            </motion.h1>

            <div className="flex gap-8 flex-wrap justify-center max-w-[95vw]">
              {drawData?.winners?.map((winner, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 100, opacity: 0, rotateY: 180 }}
                  animate={{ y: 0, opacity: 1, rotateY: 0 }}
                  transition={{ delay: isRolling ? 0 : i * 0.2, type: 'spring', stiffness: 100 }}
                  className="relative"
                >
                  {/* 글로우 효과 */}
                  {!isRolling && (
                    <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-[2rem] blur-xl opacity-50 animate-pulse" />
                  )}

                  <div className={`relative w-72 h-96 rounded-[2rem] flex flex-col items-center justify-center p-8 overflow-hidden ${
                    isRolling
                      ? 'bg-zinc-900 border-4 border-zinc-700'
                      : 'bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border-4 border-pink-500'
                  }`}>
                    {isRolling ? (
                      // 슬롯 애니메이션
                      <motion.div
                        className="space-y-4"
                        animate={{ y: [-500, 0] }}
                        transition={{ repeat: Infinity, duration: 0.2, ease: 'linear' }}
                      >
                        {Array.from({ length: 10 }).map((_, k) => (
                          <div key={k} className="text-3xl font-black text-white/30">???</div>
                        ))}
                      </motion.div>
                    ) : (
                      <>
                        {/* 왕관 */}
                        <motion.div
                          initial={{ y: -50, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: i * 0.2 + 0.3 }}
                        >
                          <Crown size={64} className="text-yellow-400 mb-4" fill="currentColor" />
                        </motion.div>

                        {/* 순위 뱃지 */}
                        <motion.div
                          className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center font-black text-black text-xl shadow-lg"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 0.5, delay: i * 0.2 + 0.5 }}
                        >
                          {i + 1}
                        </motion.div>

                        {/* 닉네임 */}
                        <motion.h2
                          className="text-3xl md:text-4xl font-black text-white text-center break-all leading-tight mb-4"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.2 + 0.4, type: 'spring' }}
                        >
                          {winner.nickname || winner.nick}
                        </motion.h2>

                        {/* 금액 (후원 추첨인 경우) */}
                        {winner.amount && (
                          <motion.div
                            className="bg-pink-500/20 px-6 py-2 rounded-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.2 + 0.6 }}
                          >
                            <span className="text-pink-400 font-black text-xl">₩{winner.amount.toLocaleString()}</span>
                          </motion.div>
                        )}

                        {/* 축하 이펙트 */}
                        <motion.div
                          className="absolute bottom-4"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Sparkles className="text-yellow-400" size={32} />
                        </motion.div>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ========== 룰렛 오버레이 ========== */}
        {view === 'roulette' && rouletteData?.items && rouletteData.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex flex-col items-center"
          >
            {showConfetti && <Confetti />}

            {/* 포인터 */}
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-[100]"
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            >
              <div className="w-0 h-0 border-l-[35px] border-l-transparent border-r-[35px] border-r-transparent border-t-[70px] border-t-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]" />
            </motion.div>

            {/* 룰렛 휠 */}
            <div className="relative">
              {/* 외곽 글로우 */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full blur-2xl opacity-30 animate-pulse" />

              <motion.div
                className="w-[600px] h-[600px] md:w-[700px] md:h-[700px] rounded-full border-[16px] border-white bg-black shadow-[0_0_100px_rgba(0,0,0,0.9)] overflow-hidden relative"
                animate={{ rotate: rouletteRotation }}
                transition={{ duration: 5, ease: [0.15, 0, 0.15, 1] }}
              >
                <div
                  className="w-full h-full rounded-full relative"
                  style={{
                    background: `conic-gradient(${rouletteData.items
                      .map((item, i, arr) => {
                        const start = (i / arr.length) * 100;
                        const end = ((i + 1) / arr.length) * 100;
                        return `${item.color} ${start}% ${end}%`;
                      })
                      .join(', ')})`,
                  }}
                >
                  {rouletteData.items.map((item, i, arr) => {
                    const angle = i * (360 / arr.length) + 360 / arr.length / 2;
                    return (
                      <div
                        key={item.id}
                        className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 origin-bottom flex justify-center pt-12 pointer-events-none"
                        style={{ transform: `rotate(${angle}deg)` }}
                      >
                        <span
                          className="text-2xl md:text-3xl font-black text-white whitespace-nowrap uppercase tracking-tight"
                          style={{
                            writingMode: 'vertical-rl',
                            textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)'
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 중앙 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white rounded-full shadow-2xl border-8 border-black flex items-center justify-center">
                    <span className="font-black text-black text-xl">SPIN</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 결과 팝업 */}
            <AnimatePresence>
              {rouletteData.selected && showConfetti && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="absolute top-full mt-12 z-[200]"
                >
                  <div
                    className="px-16 py-8 rounded-3xl border-8 shadow-2xl"
                    style={{
                      backgroundColor: rouletteData.selected.color,
                      borderColor: 'white',
                      boxShadow: `0 0 60px ${rouletteData.selected.color}`
                    }}
                  >
                    <p className="text-center text-sm font-bold uppercase tracking-[0.4em] text-white/70 mb-2">
                      WINNER
                    </p>
                    <h2 className="text-5xl md:text-6xl font-black text-white text-center uppercase tracking-tight">
                      {rouletteData.selected.label}
                    </h2>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
