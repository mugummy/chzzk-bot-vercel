'use client';

import { useEffect, useState } from 'react';
import { useBotStore, BotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, BarChart3, Trophy, Dices, Coins } from 'lucide-react';

/**
 * OverlayVote: 투표, 룰렛, 추첨 통합 오버레이
 * 생략 없는 100% 전체 소스입니다.
 */
export default function OverlayVote() {
  const store = useBotStore() as BotStore;
  const { votes, roulette, draw } = store;
  
  const currentVote = votes?.[0];
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`wss://web-production-19eef.up.railway.app/?token=${token}`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect' }));
      ws.send(JSON.stringify({ type: 'requestData' }));
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'voteStateUpdate') store.updateVotes(data.payload);
        if (data.type === 'rouletteStateUpdate') store.updateRoulette(data.payload);
        if (data.type === 'drawStateUpdate') store.updateDraw(data.payload);
      } catch (err) {}
    };
    setSocket(ws);

    return () => ws.close();
  }, []);

  // 화면 결정 로직
  const showRoulette = roulette.isSpinning || roulette.winner;
  const showDraw = draw.isRolling || draw.winners.length > 0;
  const showVote = currentVote?.isActive;

  if (!showRoulette && !showDraw && !showVote) return null;

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-transparent overflow-hidden font-sans p-10">
      <AnimatePresence mode="wait">
        
        {/* 1. 룰렛 화면 */}
        {showRoulette && !showDraw && (
          <motion.div key="roulette" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="bg-[#0a0a0a]/90 backdrop-blur-xl border-4 border-white/10 rounded-[3.5rem] p-12 shadow-2xl flex flex-col items-center gap-8 min-w-[500px]">
            <div className="relative">
              <motion.div animate={{ rotate: roulette.isSpinning ? 3600 : 0 }} transition={{ duration: 3, ease: "circOut" }} className="w-80 h-80 rounded-full border-8 border-pink-500/30 bg-black flex items-center justify-center relative overflow-hidden" style={{ background: 'conic-gradient(from 0deg, #ec4899 0deg 90deg, #8b5cf6 90deg 180deg, #3b82f6 180deg 270deg, #10b981 270deg 360deg)' }}>
                <div className="w-72 h-72 bg-[#0a0a0a] rounded-full flex items-center justify-center z-10"><PieChart size={100} className="text-pink-500" /></div>
              </motion.div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-white z-20 drop-shadow-lg" />
            </div>
            <div className="text-center space-y-4">
              {roulette.winner ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2 }} className="space-y-2">
                  <p className="text-pink-400 font-black text-xl uppercase tracking-[0.2em]">🎉 Winner 🎉</p>
                  <h2 className="text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]">{roulette.winner.text}</h2>
                </motion.div>
              ) : <h2 className="text-4xl font-black text-white animate-pulse">룰렛이 돌아갑니다!</h2>}
            </div>
          </motion.div>
        )}

        {/* 2. 추첨 슬롯머신 화면 */}
        {showDraw && (
          <motion.div key="draw" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-[#0a0a0a]/95 backdrop-blur-xl border-4 border-amber-500/30 rounded-[3.5rem] p-12 shadow-2xl flex flex-col items-center gap-10 min-w-[600px]">
            <div className="flex items-center gap-4 text-amber-500">
              <Dices size={48} className={draw.isRolling ? 'animate-spin' : ''} />
              <h1 className="text-4xl font-black uppercase tracking-widest">Lucky Draw</h1>
            </div>
            <div className="w-full bg-black/50 p-10 rounded-[2.5rem] border border-white/10 flex items-center justify-center min-h-[200px] relative overflow-hidden">
              {draw.isRolling ? (
                <div className="flex flex-col items-center gap-4">
                  <motion.div animate={{ y: [0, -40, 0] }} transition={{ repeat: Infinity, duration: 0.1 }} className="text-7xl font-black text-white/10 blur-md italic uppercase">Choosing...</motion.div>
                  <p className="text-amber-500 font-black text-xl animate-pulse tracking-tighter">참가자 {draw.candidatesCount}명 분석 중</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6 w-full">
                  {draw.winners.map((w: any, i: number) => (
                    <motion.div initial={{ scale: 0, x: -50 }} animate={{ scale: 1, x: 0 }} transition={{ type: 'spring', delay: i * 0.2 }} key={i} className="bg-gradient-to-r from-amber-500 to-orange-600 text-black p-8 rounded-3xl font-black text-5xl text-center shadow-2xl flex items-center justify-center gap-6">
                      <Trophy size={40} /> <span>{w.nickname}</span> <Trophy size={40} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 3. 투표 화면 */}
        {showVote && !showRoulette && !showDraw && currentVote && (
          <motion.div key="vote" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-[#0a0a0a]/90 backdrop-blur-xl border-4 border-emerald-500/30 rounded-[3rem] p-10 shadow-2xl w-full max-w-4xl">
            <div className="flex items-center gap-6 mb-8"><BarChart3 size={40} className="text-emerald-500" /><h1 className="text-4xl font-black text-white tracking-tight">{currentVote.question}</h1></div>
            <div className="space-y-4">
              {currentVote.options.map((opt, i) => {
                const percent = Math.round((currentVote.results[opt.id] / (currentVote.totalVotes || 1)) * 100);
                return (
                  <div key={opt.id} className="relative bg-white/5 rounded-2xl h-20 w-full overflow-hidden border border-white/5 flex items-center px-8">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1 }} className="absolute left-0 top-0 bottom-0 bg-emerald-500/20" />
                    <div className="relative z-10 flex justify-between items-center w-full font-black text-2xl">
                      <span>{i + 1}. {opt.text}</span>
                      <span className="text-emerald-400">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
