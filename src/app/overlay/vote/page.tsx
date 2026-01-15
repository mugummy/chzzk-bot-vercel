'use client';

import { useEffect, useState } from 'react';
import { useBotStore, BotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, BarChart3, Trophy, Dices, Coins, Loader2 } from 'lucide-react';

const SlotMachine = ({ candidates }: { candidates: any[] }) => {
  const [display, setDisplay] = useState("추첨 중...");
  useEffect(() => {
    if (!candidates || candidates.length === 0) return;
    const interval = setInterval(() => {
      const random = candidates[Math.floor(Math.random() * candidates.length)];
      if (random) setDisplay(random.nickname);
    }, 50);
    return () => clearInterval(interval);
  }, [candidates]);
  return <motion.div key={display} className="text-7xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] italic uppercase tracking-tighter">{display}</motion.div>;
};

export default function OverlayVote() {
  const store = useBotStore() as BotStore;
  const { votes, roulette, draw, settings } = store;
  
  const currentVote = (votes && votes.length > 0) ? votes[0] : null;
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const config = settings?.overlay || { backgroundColor: '#000000', textColor: '#ffffff', accentColor: '#10b981', opacity: 0.9, scale: 1.0 };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    const ws = new WebSocket(`wss://web-production-19eef.up.railway.app/?token=${token}`);
    
    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'connect' }));
      ws.send(JSON.stringify({ type: 'requestData' }));
    };

    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'voteStateUpdate') store.updateVotes(data.payload);
        if (data.type === 'rouletteStateUpdate') store.updateRoulette(data.payload);
        if (data.type === 'drawStateUpdate') store.updateDraw(data.payload);
        if (data.type === 'settingsUpdate') store.updateSettings(data.payload);
        if (data.type === 'connectResult') {
            // 초기 데이터 로드
            if (data.payload.voteState) store.updateVotes(data.payload.voteState);
            if (data.payload.drawState) store.updateDraw(data.payload.drawState);
            if (data.payload.rouletteState) store.updateRoulette(data.payload.rouletteState);
        }
      } catch (err) {}
    };
    setSocket(ws);
    return () => ws.close();
  }, []);

  const showRoulette = roulette.isSpinning || roulette.winner || (roulette.items && roulette.items.length > 0); // 룰렛판 항상 표시 옵션 고려
  // 룰렛은 스핀 중이거나 결과가 있을 때만 띄우는 게 일반적이지만, 사용자가 "안 보인다"고 했으므로 items가 있으면 띄우도록 조건 완화
  const activeRoulette = roulette.items.length > 0 && (roulette.isSpinning || roulette.winner);
  
  const showDraw = draw.isActive || draw.isRolling || (draw.winners && draw.winners.length > 0);
  const showVote = currentVote?.isActive;

  // 아무것도 없을 때 (연결 확인용 작게 표시)
  if (!activeRoulette && !showDraw && !showVote) {
    if (isConnected) return null; // 연결되면 숨김 (OBS용)
    return <div className="h-screen flex items-center justify-center text-white/50 font-bold"><Loader2 className="animate-spin mr-2"/> Connecting to gummybot...</div>;
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center overflow-hidden font-sans p-10 transition-colors duration-500" style={{ backgroundColor: `rgba(0,0,0,${config.backgroundColor === '#000000' ? 0 : 0})` }}>
      <AnimatePresence mode="wait">
        
        {/* 1. 룰렛 */}
        {activeRoulette && !showDraw && (
          <motion.div key="roulette" initial={{ scale: 0 }} animate={{ scale: config.scale }} exit={{ scale: 0 }} className="backdrop-blur-xl border-4 border-white/10 rounded-[3.5rem] p-12 shadow-2xl flex flex-col items-center gap-8 min-w-[500px]" style={{ backgroundColor: `rgba(10,10,10,${config.opacity})` }}>
            <div className="relative">
              <motion.div animate={{ rotate: roulette.isSpinning ? 3600 : 0 }} transition={{ duration: 3, ease: "circOut" }} className="w-80 h-80 rounded-full border-8 border-white/10 bg-black flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 rounded-full overflow-hidden">{roulette.items.map((item, i) => <div key={i} className="absolute w-full h-full left-0 top-0 origin-center border-r border-white/10" style={{ transform: `rotate(${(360 / roulette.items.length) * i}deg)`, background: `conic-gradient(from 0deg, ${i%2===0?'#1f1f1f':'#111'} 0deg ${(360/roulette.items.length)}deg, transparent ${(360/roulette.items.length)}deg)` }}></div>)}</div>
                <PieChart size={100} style={{ color: config.accentColor }} className="relative z-10" />
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-white z-20 drop-shadow-lg" />
              </motion.div>
            </div>
            <div className="text-center space-y-4">
              {roulette.winner ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1.2 }} className="space-y-2"><p className="font-black text-xl uppercase tracking-[0.2em]" style={{ color: config.accentColor }}>Winner</p><h2 className="text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">{roulette.winner.text}</h2></motion.div>
              ) : <h2 className="text-4xl font-black text-white animate-pulse">룰렛이 돌아갑니다!</h2>}
            </div>
          </motion.div>
        )}

        {/* 2. 추첨 */}
        {showDraw && (
          <motion.div key="draw" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1, scale: config.scale }} exit={{ y: 100, opacity: 0 }} className="backdrop-blur-xl border-4 border-white/10 rounded-[3.5rem] p-12 shadow-2xl flex flex-col items-center gap-10 min-w-[600px]" style={{ backgroundColor: `rgba(10,10,10,${config.opacity})` }}>
            <div className="flex items-center gap-4" style={{ color: config.accentColor }}><Dices size={48} className={draw.isRolling ? 'animate-spin' : ''} /><h1 className="text-4xl font-black uppercase tracking-widest">Lucky Draw</h1></div>
            <div className="w-full bg-black/50 p-10 rounded-[2.5rem] border border-white/10 flex items-center justify-center min-h-[200px] relative overflow-hidden">
              {draw.isRolling ? (
                <div className="flex flex-col items-center gap-4"><SlotMachine candidates={draw.candidates} /><p className="font-black text-xl animate-pulse tracking-tighter" style={{ color: config.accentColor }}>참가자 {draw.candidatesCount}명 분석 중</p></div>
              ) : draw.isActive ? (
                 <div className="flex flex-col items-center gap-4"><p className="text-white font-bold text-2xl">참가자 모집 중...</p><p className="text-6xl font-black" style={{ color: config.accentColor }}>{draw.candidatesCount}명</p></div>
              ) : (
                <div className="flex flex-col gap-6 w-full">{draw.winners.map((w: any, i: number) => <motion.div initial={{ scale: 0, x: -50 }} animate={{ scale: 1, x: 0 }} transition={{ type: 'spring', delay: i * 0.2 }} key={i} className="text-black p-8 rounded-3xl font-black text-5xl text-center shadow-2xl flex items-center justify-center gap-6" style={{ backgroundColor: config.accentColor }}><Trophy size={40} /> <span>{w.nickname}</span> <Trophy size={40} /></motion.div>)}</div>
              )}
            </div>
          </motion.div>
        )}

        {/* 3. 투표 */}
        {showVote && !showRoulette && !showDraw && currentVote && (
          <motion.div key="vote" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1, scale: config.scale }} exit={{ y: 100, opacity: 0 }} className="backdrop-blur-xl border-4 border-white/10 rounded-[3rem] p-10 shadow-2xl w-full max-w-4xl" style={{ backgroundColor: `rgba(10,10,10,${config.opacity})` }}>
            <div className="flex items-center gap-6 mb-8"><BarChart3 size={40} style={{ color: config.accentColor }} /><h1 className="text-4xl font-black text-white tracking-tight">{currentVote.question}</h1></div>
            <div className="space-y-4">
              {currentVote.options.map((opt, i) => {
                const total = currentVote.totalVotes || 1;
                const percent = Math.round((currentVote.results[opt.id] / total) * 100);
                return (
                  <div key={opt.id} className="relative bg-white/5 rounded-2xl h-20 w-full overflow-hidden border border-white/5 flex items-center px-8">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1 }} className="absolute left-0 top-0 bottom-0 opacity-30" style={{ backgroundColor: config.accentColor }} />
                    <div className="relative z-10 flex justify-between items-center w-full font-black text-2xl"><span style={{ color: config.textColor }}>{i + 1}. {opt.text}</span><span style={{ color: config.accentColor }}>{percent}%</span></div>
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