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
  const [drawData, setDrawData] = useState<any>(null); // { winners: [] }
  const [rouletteData, setRouletteData] = useState<any>(null); // { items: [], selected: null }

  // 애니메이션 제어
  const [isRolling, setIsRolling] = useState(false);
  const [rouletteRotation, setRouletteRotation] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://web-production-19eef.up.railway.app';
    
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

        // 상태 업데이트
        if (type === 'overlayStateUpdate') {
            setIsVisible(payload.isVisible);
            setView(payload.currentView);
        }
        if (type === 'voteStateUpdate') setVoteData(payload.currentVote);
        if (type === 'drawStateUpdate') {
             // 진행 중 상태 업데이트
             if (payload.status === 'idle') setIsRolling(false);
        }
        if (type === 'rouletteStateUpdate') setRouletteData((prev: any) => ({ ...prev, items: payload.items }));

        // 이벤트 (애니메이션 트리거)
        if (msg.type === 'overlayEvent') {
            if (payload.type === 'startDraw') {
                setView('draw');
                setIsRolling(true);
                setDrawData({ winners: payload.winners });
                // 3초 후 롤링 멈춤 (서버와 싱크 맞춤)
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
    // 룰렛 회전 로직
    const items = rouletteData?.items || [];
    if (items.length === 0) return;

    const index = items.findIndex((i: any) => i.id === selectedItem.id);
    const segmentAngle = 360 / items.length;
    // 선택된 아이템이 12시 방향(0도)에 오도록 계산
    // 기본적으로 3시 방향이 0도라고 가정하면 보정 필요하지만 CSS rotate 기준
    const targetAngle = 360 * 5 + (360 - (index * segmentAngle)); // 5바퀴 + 각도
    
    setRouletteRotation(targetAngle);
    setRouletteData((prev: any) => ({ ...prev, selected: selectedItem }));
  };

  if (!isVisible || view === 'none') return null;

  return (
    <div className="w-screen h-screen bg-transparent flex items-center justify-center overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        
        {/* 투표 오버레이 */}
        {view === 'vote' && voteData && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="w-[80%] max-w-4xl bg-black/80 backdrop-blur-md rounded-[3rem] p-10 border border-white/10 shadow-2xl"
          >
            <div className="flex justify-between items-end mb-6">
                <h1 className="text-4xl font-black text-white truncate max-w-[70%]">{voteData.title}</h1>
                <div className="text-right">
                    <span className="block text-emerald-500 font-bold uppercase tracking-widest text-sm mb-1">Total Votes</span>
                    <span className="text-5xl font-black text-white tabular-nums">{voteData.totalParticipants}</span>
                </div>
            </div>
            <div className="space-y-4">
                {voteData.options.map((opt: any, i: number) => {
                    const total = voteData.options.reduce((acc: number, o: any) => acc + o.count, 0);
                    const percent = total === 0 ? 0 : Math.round((opt.count / total) * 100);
                    return (
                        <div key={opt.id} className="relative h-20 bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1 }}
                                className="absolute top-0 left-0 h-full bg-emerald-500/80"
                            />
                            <div className="absolute inset-0 flex items-center justify-between px-8">
                                <span className="font-bold text-2xl text-white drop-shadow-md"><span className="text-emerald-300 mr-4">{i + 1}.</span> {opt.label}</span>
                                <div className="text-right text-white drop-shadow-md">
                                    <span className="font-black text-3xl tabular-nums block">{opt.count}</span>
                                    <span className="text-sm opacity-80 font-bold">{percent}%</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
          </motion.div>
        )}

        {/* 추첨 오버레이 (슬롯머신) */}
        {view === 'draw' && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center justify-center gap-8"
          >
            <h1 className="text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(0,0,0,1)] uppercase tracking-tighter italic">
                {isRolling ? 'Rolling...' : 'Winners!'}
            </h1>
            
            <div className="flex gap-4">
                {drawData?.winners?.map((winner: any, i: number) => (
                    <motion.div 
                        key={i}
                        className="w-64 h-80 bg-black/90 border-4 border-pink-500 rounded-3xl flex flex-col items-center justify-center p-6 shadow-[0_0_50px_rgba(236,72,153,0.5)] overflow-hidden relative"
                    >
                        {isRolling ? (
                            <motion.div 
                                animate={{ y: [-1000, 0] }} 
                                transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                                className="space-y-8 opacity-50 blur-sm"
                            >
                                {/* 더미 데이터로 롤링 효과 */}
                                {Array.from({ length: 10 }).map((_, k) => (
                                    <div key={k} className="text-2xl font-black text-gray-500">???</div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
                                <Trophy size={64} className="text-yellow-400 mb-6 mx-auto" />
                                <div className="text-3xl font-black text-white text-center break-words leading-tight">{winner.nickname || winner.nick}</div>
                                {winner.amount && <div className="mt-2 text-xl font-bold text-pink-400 text-center">₩{winner.amount.toLocaleString()}</div>}
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>
          </motion.div>
        )}

        {/* 룰렛 오버레이 */}
        {view === 'roulette' && rouletteData?.items && (
          <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="relative"
          >
             {/* 화살표 */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-white z-50 drop-shadow-xl" />

             <motion.div
                className="w-[600px] h-[600px] rounded-full border-8 border-white bg-black shadow-2xl overflow-hidden relative"
                animate={{ rotate: rouletteRotation }}
                transition={{ duration: 5, ease: [0.2, 0.8, 0.2, 1] }}
             >
                <div 
                    className="w-full h-full rounded-full"
                    style={{ 
                        background: `conic-gradient(${rouletteData.items.map((item: any, i: number, arr: any[]) => {
                            const start = (i / arr.length) * 100;
                            const end = ((i + 1) / arr.length) * 100;
                            return `${item.color} ${start}% ${end}%`;
                        }).join(', ')})` 
                    }}
                />
                {/* 텍스트 (각 섹션의 중앙에 배치하려면 삼각함수 필요하지만 생략하고 색상만 표시) */}
             </motion.div>
             
             {/* 결과 표시 (회전 끝난 후) */}
             {rouletteData.selected && rouletteRotation > 0 && (
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 5.1 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-10 bg-black/80 px-10 py-6 rounded-3xl border border-white/20"
                 >
                     <h2 className="text-5xl font-black text-white text-center">{rouletteData.selected.label}</h2>
                 </motion.div>
             )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
