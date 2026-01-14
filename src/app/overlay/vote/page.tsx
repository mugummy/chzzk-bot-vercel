'use client';

import { useEffect, useState } from 'react';
import { useBotStore, BotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, BarChart3, Trophy, Dices } from 'lucide-react';

export default function OverlayVote() {
  const store = useBotStore() as BotStore;
  const { votes, roulette } = store; // draw state needs to be added to store if not present, but we can use local state for draw events if simpler, or add to store. 
  // To be consistent, let's assume store has been updated or handle draw data locally via socket event.
  // Actually, I should update the store to hold draw state too. But for now, let's listen to socket for draw events directly to trigger animation.
  
  const currentVote = votes?.[0];
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  // 추첨 상태 로컬 관리 (Store에 없으므로)
  const [drawState, setDrawState] = useState<any>({ isRolling: false, winners: [] });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

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
        
        // [신규] 추첨 상태 업데이트
        if (data.type === 'drawStateUpdate') {
            setDrawState({
                isRolling: data.payload.isRolling,
                winners: data.payload.winners,
                candidatesCount: data.payload.candidatesCount
            });
        }
      } catch (err) {}
    };
    setSocket(ws);

    return () => ws.close();
  }, []);

  const showRoulette = roulette?.isSpinning || roulette?.winner;
  const showVote = currentVote?.isActive;
  const showDraw = drawState.isRolling || (drawState.winners && drawState.winners.length > 0);

  if (!showRoulette && !showVote && !showDraw) return null;

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-transparent overflow-hidden font-sans p-10">
      <AnimatePresence mode="wait">
        
        {/* 1. 룰렛 */}
        {showRoulette && !showDraw && (
          <motion.div key="roulette" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="bg-[#0a0a0a]/90 backdrop-blur-xl border-4 border-white/10 rounded-[3rem] p-12 shadow-2xl flex flex-col items-center gap-8 min-w-[500px]">
            <div className="relative">
              <motion.div animate={{ rotate: roulette.isSpinning ? 3600 : 0 }} transition={{ duration: 5, ease: "circOut" }} className="w-80 h-80 rounded-full border-8 border-pink-500/30 bg-black flex items-center justify-center relative overflow-hidden" style={{ background: 'conic-gradient(from 0deg, #ec4899 0deg 90deg, #8b5cf6 90deg 180deg, #3b82f6 180deg 270deg, #10b981 270deg 360deg)' }}>
                <div className="w-72 h-72 bg-[#0a0a0a] rounded-full flex items-center justify-center z-10"><PieChart size={100} className="text-pink-500" /></div>
              </motion.div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-white z-20 drop-shadow-lg" />
            </div>
            <div className="text-center space-y-4">
              {roulette.winner ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2, rotate: [0, -5, 5, 0] }} className="space-y-2">
                  <p className="text-pink-400 font-black text-xl uppercase tracking-widest">Winner</p>
                  <h2 className="text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]">{roulette.winner.text}</h2>
                </motion.div>
              ) : <h2 className="text-4xl font-black text-white animate-pulse">추첨 진행 중...</h2>}
            </div>
          </motion.div>
        )}

        {/* 2. 추첨 (슬롯머신) */}
        {showDraw && (
          <motion.div key="draw" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-[#0a0a0a]/95 backdrop-blur-xl border-4 border-amber-500/30 rounded-[3rem] p-12 shadow-2xl flex flex-col items-center gap-10 min-w-[600px]">
            <div className="flex items-center gap-4 text-amber-500">
              <Dices size={48} />
              <h1 className="text-4xl font-black uppercase tracking-widest">Lucky Draw</h1>
            </div>
            
            <div className="w-full bg-black/50 p-8 rounded-3xl border border-white/10 flex items-center justify-center min-h-[200px]">
              {drawState.isRolling ? (
                <div className="flex flex-col items-center gap-4">
                  <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 0.1 }} className="text-6xl font-black text-white/20 blur-sm">
                    Rolling...
                  </motion.div>
                  <p className="text-amber-500 font-bold animate-pulse">참가자 {drawState.candidatesCount}명 중 추첨 중</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 w-full">
                  {drawState.winners.map((w: any, i: number) => (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.2 }} key={i} className="bg-amber-500 text-black p-6 rounded-2xl font-black text-4xl text-center shadow-lg shadow-amber-500/20">
                      {w.nickname}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 3. 투표 */}
        {showVote && !showRoulette && !showDraw && currentVote && (
          <motion.div key="vote" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-[#0a0a0a]/90 backdrop-blur-xl border-4 border-emerald-500/30 rounded-[3rem] p-10 shadow-2xl w-full max-w-4xl">
            <div className="flex items-center gap-6 mb-8"><div className="bg-emerald-500 text-black p-4 rounded-2xl shadow-lg shadow-emerald-500/20"><BarChart3 size={40} strokeWidth={2.5} /></div><h1 className="text-4xl font-black text-white tracking-tight leading-none">{currentVote.question}</h1></div>
            <div className="space-y-4">
              {currentVote.options.map((opt, i) => {
                const total = currentVote.totalVotes || 1;
                const percent = Math.round((currentVote.results[opt.id] / total) * 100);
                return (
                  <div key={opt.id} className="relative"><div className="bg-white/5 rounded-2xl h-20 w-full overflow-hidden border border-white/5 flex items-center px-6 relative z-0"><motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ type: "spring", stiffness: 50 }} className="absolute left-0 top-0 bottom-0 bg-emerald-500/20"/><div className="relative z-10 flex justify-between items-center w-full"><div className="flex items-center gap-4"><span className="bg-emerald-500 text-black w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl">{i + 1}</span><span className="text-2xl font-bold text-white">{opt.text}</span></div><div className="text-right"><span className="text-3xl font-black text-emerald-400">{percent}%</span><span className="text-sm font-bold text-gray-500 ml-2">({currentVote.results[opt.id]}표)</span></div></div></div></div>
                );
              })}
            </div>
            <div className="mt-8 text-center"><p className="text-emerald-500/70 font-black text-sm uppercase tracking-[0.3em] animate-pulse">채팅창에 번호를 입력하여 투표하세요!</p></div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}