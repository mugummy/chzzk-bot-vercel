'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

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

export default function IntegratedOverlay() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [view, setView] = useState<'none' | 'vote' | 'draw' | 'roulette'>('none');
  const [isVisible, setIsVisible] = useState(true);

  // 데이터 상태
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [drawData, setDrawData] = useState<{ winners: Winner[] } | null>(null);
  const [rouletteData, setRouletteData] = useState<{ items: RouletteItem[]; selected?: RouletteItem } | null>(null);

  // 애니메이션 제어
  const [isRolling, setIsRolling] = useState(false);
  const [rouletteRotation, setRouletteRotation] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    // WebSocket URL 처리
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://web-production-19eef.up.railway.app';
    if (!wsUrl.startsWith('ws')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}${wsUrl}`;
    }

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
        if (type === 'voteStateUpdate') setVoteData(payload.currentVote);
        if (type === 'drawStateUpdate') {
          if (payload.status === 'idle') setIsRolling(false);
        }
        if (type === 'rouletteStateUpdate') {
          setRouletteData((prev) => ({ ...prev, items: payload.items }));
        }

        // 이벤트 트리거
        if (type === 'overlayEvent') {
          if (payload.type === 'startDraw') {
            setView('draw');
            setIsRolling(true);
            setDrawData({ winners: payload.winners });
            setTimeout(() => setIsRolling(false), 3000);
          }
          if (payload.type === 'spinRoulette') {
            setView('roulette');
            handleRouletteSpin(payload.selectedItem);
          }
        }
      } catch (err) {
        // ignore
      }
    };

    setSocket(ws);
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
  };

  // 옵션 개수에 따른 동적 높이 계산
  const optionHeight = useMemo(() => {
    if (!voteData?.options) return 80;
    const count = voteData.options.length;
    if (count <= 3) return 80;
    if (count <= 5) return 64;
    if (count <= 8) return 52;
    return 44;
  }, [voteData?.options?.length]);

  // 폰트 크기 동적 계산
  const getFontSize = (optionCount: number) => {
    if (optionCount <= 3) return { label: 'text-2xl', count: 'text-3xl' };
    if (optionCount <= 5) return { label: 'text-xl', count: 'text-2xl' };
    if (optionCount <= 8) return { label: 'text-lg', count: 'text-xl' };
    return { label: 'text-base', count: 'text-lg' };
  };

  if (!isVisible || view === 'none') return null;

  return (
    <div className="w-screen h-screen bg-transparent flex items-center justify-center overflow-hidden font-sans">
      <AnimatePresence mode="wait">

        {/* 투표 오버레이 */}
        {view === 'vote' && voteData && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="w-[85%] max-w-4xl bg-black/85 backdrop-blur-xl rounded-3xl p-8 border-2 border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)]"
          >
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight truncate flex-1 mr-4">
                {voteData.title}
              </h1>
              <div className="shrink-0 bg-emerald-500 text-black px-5 py-2 rounded-xl font-black text-sm uppercase tracking-wider transform -rotate-1">
                {voteData.status === 'active' ? 'LIVE' : voteData.status === 'ended' ? 'ENDED' : 'READY'}
              </div>
            </div>

            {/* 참여 정보 */}
            <div className="flex gap-4 mb-5 text-sm">
              <span className="text-gray-400">
                참여자 <span className="text-white font-bold">{voteData.totalParticipants || 0}명</span>
              </span>
              {voteData.mode === 'donation' && (
                <span className="text-gray-400">
                  총액 <span className="text-emerald-400 font-bold">₩{(voteData.totalVotes || 0).toLocaleString()}</span>
                </span>
              )}
            </div>

            {/* 투표 항목 */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {voteData.options.map((opt, i) => {
                const total = voteData.totalVotes || voteData.options.reduce((acc, o) => acc + o.count, 0);
                const percent = total === 0 ? 0 : Math.round((opt.count / total) * 100);
                const fontSize = getFontSize(voteData.options.length);

                return (
                  <div
                    key={opt.id}
                    className="relative bg-white/5 rounded-2xl overflow-hidden border border-white/5"
                    style={{ height: optionHeight }}
                  >
                    {/* 프로그레스 바 */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1.2, ease: 'circOut' }}
                      className="absolute top-0 left-0 h-full bg-emerald-500/50"
                    />
                    {/* 내용 */}
                    <div className="absolute inset-0 flex items-center justify-between px-6">
                      <span className={`font-bold text-white drop-shadow-lg flex items-center gap-4 ${fontSize.label}`}>
                        <span className="text-emerald-400 font-black">{i + 1}</span>
                        <span className="truncate">{opt.label}</span>
                      </span>
                      <div className="text-right text-white drop-shadow-lg shrink-0 ml-4">
                        <span className={`font-black tabular-nums ${fontSize.count}`}>
                          {opt.count.toLocaleString()}
                        </span>
                        <span className="text-xs opacity-60 ml-2 uppercase font-bold">{percent}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 추첨 오버레이 */}
        {view === 'draw' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center justify-center gap-10"
          >
            <h1 className="text-6xl md:text-7xl font-black text-white drop-shadow-[0_0_30px_rgba(236,72,153,0.8)] uppercase tracking-tighter italic transform -rotate-2">
              {isRolling ? 'Spinning...' : 'Winner!'}
            </h1>
            <div className="flex gap-5 flex-wrap justify-center max-w-[90vw]">
              {drawData?.winners?.map((winner, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: isRolling ? 0 : i * 0.15 }}
                  className="w-64 md:w-72 h-80 md:h-96 bg-black/90 border-4 border-pink-500 rounded-3xl flex flex-col items-center justify-center p-8 shadow-[0_0_80px_rgba(236,72,153,0.4)] relative overflow-hidden"
                >
                  {isRolling ? (
                    <motion.div
                      animate={{ y: [-2000, 0] }}
                      transition={{ repeat: Infinity, duration: 0.15, ease: 'linear' }}
                      className="space-y-8 opacity-30 blur-sm"
                    >
                      {Array.from({ length: 15 }).map((_, k) => (
                        <div key={k} className="text-4xl font-black text-white italic">???</div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(250,204,21,0.6)]">
                        <Trophy size={48} className="text-black" />
                      </div>
                      <div className="text-3xl md:text-4xl font-black text-white text-center break-all leading-tight mb-3">
                        {winner.nickname || winner.nick}
                      </div>
                      {winner.amount && (
                        <div className="text-xl font-bold text-pink-400 uppercase">
                          ₩{winner.amount.toLocaleString()}
                        </div>
                      )}
                    </motion.div>
                  )}
                  {/* 오버레이 그라데이션 */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none rounded-3xl" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 룰렛 오버레이 */}
        {view === 'roulette' && rouletteData?.items && rouletteData.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex flex-col items-center"
          >
            {/* 포인터 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 z-[100] drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
              <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[60px] border-t-white" />
            </div>

            {/* 룰렛 휠 */}
            <motion.div
              className="w-[700px] h-[700px] rounded-full border-[12px] border-white bg-black shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden relative"
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
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 origin-bottom flex justify-center pt-10"
                      style={{ transform: `rotate(${angle}deg)` }}
                    >
                      <span className="text-2xl md:text-3xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] whitespace-nowrap -rotate-90 uppercase tracking-tight">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* 중앙 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full shadow-2xl border-4 border-black flex items-center justify-center font-black text-black text-lg">
                  WIN
                </div>
              </div>
            </motion.div>

            {/* 결과 팝업 */}
            <AnimatePresence>
              {rouletteData.selected && rouletteRotation > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 5.2, type: 'spring' }}
                  className="absolute top-full mt-16 bg-white text-black px-16 py-8 rounded-3xl shadow-[0_0_80px_rgba(255,255,255,0.5)] border-8 border-black z-[200]"
                >
                  <span className="block text-center text-sm font-bold uppercase tracking-[0.4em] mb-2 opacity-40">
                    Result
                  </span>
                  <h2 className="text-5xl md:text-6xl font-black text-center uppercase tracking-tight leading-none">
                    {rouletteData.selected.label}
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
