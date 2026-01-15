'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, Trophy } from 'lucide-react';

export default function IntegratedOverlay() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [view, setView] = useState<'none' | 'vote' | 'draw' | 'roulette'>('none');
  const [isVisible, setIsVisible] = useState(true);
  
  // 데이터 상태
  const [voteData, setVoteData] = useState<any>(null);
  const [drawData, setDrawData] = useState<any>(null);
  const [rouletteData, setRouletteData] = useState<any>(null);

  // 애니메이션 제어
  const [isRolling, setIsRolling] = useState(false);
  const [rouletteRotation, setRouletteRotation] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    // [Fix] 웹소켓 주소 처리 강화
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://web-production-19eef.up.railway.app';
    if (!wsUrl.startsWith('ws')) {
        // 상대 경로인 경우 현재 호스트 사용 (개발 환경 등)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}${wsUrl}`;
    }
    // 이미 wss://... 형태라면 그대로 사용 (배포 환경)
    
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

        if (type === 'overlayStateUpdate') { setIsVisible(payload.isVisible); setView(payload.currentView); }
        if (type === 'voteStateUpdate') setVoteData(payload.currentVote);
        if (type === 'drawStateUpdate') { if (payload.status === 'idle') setIsRolling(false); }
        if (type === 'rouletteStateUpdate') setRouletteData((prev: any) => ({ ...prev, items: payload.items }));

        // [중요] 이벤트 트리거
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
      } catch (err) {}
    };

    setSocket(ws);
    return () => ws.close();
  }, []);

  const handleRouletteSpin = (selectedItem: any) => {
    // 룰렛 데이터가 최신 상태인지 확인 (payload.items가 없을 수 있으므로 rouletteData 참조)
    // 여기서 rouletteData가 null이면 잠시 대기 후 실행하거나, 서버에서 아이템 리스트를 같이 보내줘야 안전함.
    // 일단 현재 상태 기반으로 계산.
    const items = rouletteData?.items || [];
    if (items.length === 0) return;

    const index = items.findIndex((i: any) => i.id === selectedItem.id);
    if (index === -1) return;

    const segmentAngle = 360 / items.length;
    // 12시 방향 화살표 기준 당첨 위치 계산
    // 5바퀴(1800도) + 보정 각도
    const baseRotation = 1800; 
    const targetAngle = baseRotation + (360 - (index * segmentAngle)) - (segmentAngle / 2);
    
    setRouletteRotation(targetAngle);
    setRouletteData((prev: any) => ({ ...prev, selected: selectedItem }));
  };

  if (!isVisible || view === 'none') return null;

  return (
    <div className="w-screen h-screen bg-transparent flex items-center justify-center overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        
        {/* 투표 */}
        {view === 'vote' && voteData && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="w-[80%] max-w-4xl bg-black/85 backdrop-blur-xl rounded-[3rem] p-12 border-2 border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-end mb-8">
                <h1 className="text-5xl font-black text-white tracking-tighter">{voteData.title}</h1>
                <div className="text-right bg-emerald-500 text-black px-6 py-2 rounded-2xl font-black italic uppercase tracking-widest transform -rotate-2">Live Vote</div>
            </div>
            <div className="space-y-5">
                {voteData.options.map((opt: any, i: number) => {
                    const total = voteData.options.reduce((acc: number, o: any) => acc + o.count, 0);
                    const percent = total === 0 ? 0 : Math.round((opt.count / total) * 100);
                    return (
                        <div key={opt.id} className="relative h-24 bg-white/5 rounded-[1.5rem] overflow-hidden border border-white/5">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1.5, ease: "circOut" }} className="absolute top-0 left-0 h-full bg-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.3)]" />
                            <div className="absolute inset-0 flex items-center justify-between px-10">
                                <span className="font-black text-3xl text-white drop-shadow-lg"><span className="text-emerald-400 mr-6 text-2xl">{i + 1}</span> {opt.label}</span>
                                <div className="text-right text-white drop-shadow-lg">
                                    <span className="font-black text-4xl tabular-nums block">{opt.count.toLocaleString()}</span>
                                    <span className="text-sm opacity-60 font-bold uppercase tracking-widest">{percent}%</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
          </motion.div>
        )}

        {/* 추첨 */}
        {view === 'draw' && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex flex-col items-center justify-center gap-12">
            <h1 className="text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(236,72,153,0.8)] uppercase tracking-tighter italic transform -rotate-3">
                {isRolling ? 'Spinning...' : 'Winner!'}
            </h1>
            <div className="flex gap-6">
                {drawData?.winners?.map((winner: any, i: number) => (
                    <motion.div key={i} className="w-80 h-[450px] bg-black/90 border-8 border-pink-500 rounded-[4rem] flex flex-col items-center justify-center p-10 shadow-[0_0_100px_rgba(236,72,153,0.4)] relative">
                        {isRolling ? (
                            <motion.div animate={{ y: [-2000, 0] }} transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }} className="space-y-16 opacity-30 blur-md">
                                {Array.from({length: 10}).map((_, k) => <div key={k} className="text-5xl font-black text-white italic">???</div>)}
                            </motion.div>
                        ) : (
                            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 10 }}>
                                <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mb-8 mx-auto shadow-[0_0_40px_rgba(250,204,21,0.6)]"><Trophy size={56} className="text-black" /></div>
                                <div className="text-5xl font-black text-white text-center break-all leading-none tracking-tighter mb-4">{winner.nickname || winner.nick}</div>
                                {winner.amount && <div className="mt-4 text-2xl font-black text-pink-400 text-center uppercase">₩{winner.amount.toLocaleString()}</div>}
                            </motion.div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none rounded-[3.5rem]" />
                    </motion.div>
                ))}
            </div>
          </motion.div>
        )}

        {/* 룰렛 */}
        {view === 'roulette' && rouletteData?.items && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative flex flex-col items-center">
             {/* 화살표 (Pointer) */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-10 z-[100] drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                <div className="w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-t-[80px] border-t-white relative">
                    <div className="absolute top-[-85px] left-[-40px] w-20 h-2 bg-white rounded-full opacity-50 blur-sm" />
                </div>
             </div>

             <motion.div className="w-[850px] h-[850px] rounded-full border-[16px] border-white bg-black shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative" animate={{ rotate: rouletteRotation }} transition={{ duration: 5, ease: [0.15, 0, 0.15, 1] }}>
                <div className="w-full h-full rounded-full relative" style={{ background: `conic-gradient(${rouletteData.items.map((item: any, i: number, arr: any[]) => {
                    const start = (i / arr.length) * 100;
                    const end = ((i + 1) / arr.length) * 100;
                    return `${item.color} ${start}% ${end}%`;
                }).join(', ')})` }}>
                    {rouletteData.items.map((item: any, i: number, arr: any[]) => {
                        const angle = (i * (360 / arr.length)) + (360 / arr.length / 2);
                        return (
                            <div key={item.id} className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 origin-bottom flex justify-center pt-12" style={{ transform: `rotate(${angle}deg)` }}>
                                <span className="text-4xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] whitespace-nowrap -rotate-90 uppercase tracking-tighter">{item.label}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="absolute inset-0 flex items-center justify-center"><div className="w-24 h-24 bg-white rounded-full shadow-2xl border-8 border-black flex items-center justify-center font-black text-black">WIN</div></div>
             </motion.div>
             
             {/* 결과 팝업 */}
             <AnimatePresence>
                 {rouletteData.selected && !isRolling && rouletteRotation > 0 && (
                     <motion.div initial={{ opacity: 0, y: 50, scale: 0.5 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 5.2, type: 'spring' }} className="absolute top-full mt-20 bg-white text-black px-20 py-10 rounded-[4rem] shadow-[0_0_100px_rgba(255,255,255,0.6)] border-[10px] border-black z-[200]">
                         <span className="block text-center text-xl font-bold uppercase tracking-[0.5em] mb-2 opacity-40">Result</span>
                         <h2 className="text-8xl font-black text-center uppercase tracking-tighter leading-none">{rouletteData.selected.label}</h2>
                     </motion.div>
                 )}
             </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
