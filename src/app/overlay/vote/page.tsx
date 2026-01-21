'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, Trophy } from 'lucide-react';

export default function IntegratedOverlay() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [view, setView] = useState<'none' | 'vote' | 'draw' | 'roulette'>('none');
  const [isVisible, setIsVisible] = useState(true);
  const [settings, setSettings] = useState<any>({
      theme: 'basic',
      accentColor: '#10b981',
      opacity: 0.9,
      scale: 1.0,
      backgroundColor: '#000000'
  });
  
  const [voteData, setVoteData] = useState<any>(null);
  const [drawData, setDrawData] = useState<any>(null);
  const [rouletteData, setRouletteData] = useState<any>(null);

  const [isRolling, setIsRolling] = useState(false);
  const [rouletteRotation, setRouletteRotation] = useState(0);

  useEffect(() => {
    // [Critical Fix] Force transparent background for OBS
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
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

        if (type === 'settingsUpdate') setSettings((prev: any) => ({ ...prev, ...(payload.overlay || {}) }));
        if (type === 'overlayStateUpdate') { 
            setIsVisible(payload.isVisible); 
            setView(payload.currentView); 
        }
        
        if (type === 'voteStateUpdate') setVoteData(payload.currentVote);
        if (type === 'drawStateUpdate') { if (payload.status === 'idle') setIsRolling(false); }
        if (type === 'rouletteStateUpdate') setRouletteData((prev: any) => ({ ...prev, items: payload.items }));

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
    return () => {
        ws.close();
        document.body.style.backgroundColor = '';
        document.documentElement.style.backgroundColor = '';
    };
  }, []);

  const handleRouletteSpin = (selectedItem: any) => {
    const items = rouletteData?.items || [];
    if (items.length === 0) return;

    const index = items.findIndex((i: any) => i.id === selectedItem.id);
    if (index === -1) return;

    const segmentAngle = 360 / items.length;
    const baseRotation = 1800; 
    const targetAngle = baseRotation + (360 - (index * segmentAngle)) - (segmentAngle / 2);
    
    setRouletteRotation(targetAngle);
    setRouletteData((prev: any) => ({ ...prev, selected: selectedItem }));
  };

  const getBoxStyle = () => {
      const base: any = {
          backgroundColor: hexToRgba(settings.backgroundColor || '#000000', settings.opacity),
          borderRadius: '2.5rem',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: 'rgba(255,255,255,0.1)',
          transform: `scale(${settings.scale})`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      };

      if (settings.theme === 'neon') {
          base.borderColor = settings.accentColor;
          base.boxShadow = `0 0 30px ${settings.accentColor}60, inset 0 0 15px ${settings.accentColor}20`;
      } else if (settings.theme === 'glass') {
          base.backgroundColor = hexToRgba(settings.backgroundColor || '#000000', Math.max(0.2, settings.opacity - 0.3));
          base.borderColor = 'rgba(255,255,255,0.2)';
          base.backdropFilter = 'blur(16px)';
      } else if (settings.theme === 'pixel') {
          base.borderRadius = '0px';
          base.borderColor = settings.accentColor;
          base.boxShadow = `8px 8px 0px ${settings.accentColor}`;
      }

      return base;
  };

  const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  if (!isVisible || view === 'none') return null;

  return (
    <>
        <style jsx global>{`
            html, body {
                background-color: transparent !important;
                background: none !important;
            }
        `}</style>
        <div className="fixed inset-0 flex items-center justify-center bg-transparent pointer-events-none p-10 overflow-hidden">
        <AnimatePresence mode="wait">
            
            {/* VOTE VIEW */}
            {view === 'vote' && voteData && (
            <motion.div 
                initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                className={`w-[80%] max-w-4xl p-12 border-2 pointer-events-auto shadow-2xl ${settings.theme === 'glass' ? 'backdrop-blur-xl' : ''}`}
                style={getBoxStyle()}
            >
                <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
                    <h1 className="text-5xl font-black text-white tracking-tighter" style={{ fontFamily: settings.theme === 'pixel' ? 'monospace' : 'inherit' }}>{voteData.title}</h1>
                    <div className="px-6 py-2 rounded-2xl font-black italic uppercase tracking-widest transform -rotate-2" style={{ backgroundColor: settings.accentColor, color: '#000' }}>Live Vote</div>
                </div>
                <div className="space-y-5">
                    {voteData.options.map((opt: any, i: number) => {
                        const total = voteData.options.reduce((acc: number, o: any) => acc + o.count, 0);
                        const percent = total === 0 ? 0 : Math.round((opt.count / total) * 100);
                        return (
                            <div key={opt.id} className="relative h-24 bg-white/5 overflow-hidden border border-white/5" style={{ borderRadius: settings.theme === 'pixel' ? '0px' : '1.5rem' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1.2, ease: "circOut" }} className="absolute top-0 left-0 h-full" style={{ backgroundColor: settings.accentColor, opacity: 0.6 }} />
                                <div className="absolute inset-0 flex items-center justify-between px-10">
                                    <span className="font-black text-3xl text-white drop-shadow-lg"><span className="opacity-50 mr-3">{i + 1}</span> {opt.label}</span>
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

            {/* DRAW VIEW */}
            {view === 'draw' && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="flex flex-col items-center gap-10 pointer-events-auto" style={{ transform: `scale(${settings.scale})` }}>
                <h1 className="text-7xl font-black text-white italic uppercase tracking-tighter" style={{ textShadow: `0 0 20px ${settings.accentColor}` }}>
                    {isRolling ? 'Drawing...' : 'Winners!'}
                </h1>
                <div className="flex gap-6">
                    {drawData?.winners?.map((winner: any, i: number) => (
                        <div key={i} 
                            className="w-72 h-[400px] border-4 flex flex-col items-center justify-center p-8 relative shadow-2xl"
                            style={{ 
                                backgroundColor: hexToRgba(settings.backgroundColor || '#000000', settings.opacity),
                                borderColor: settings.accentColor,
                                borderRadius: settings.theme === 'pixel' ? '0px' : '3rem',
                            }}
                        >
                            {isRolling ? (
                                <motion.div animate={{ y: [-1500, 0] }} transition={{ repeat: Infinity, duration: 0.25, ease: "linear" }} className="space-y-12 opacity-20 blur-sm">
                                    {Array.from({length: 10}).map((_, k) => <div key={k} className="text-4xl font-black text-white">???</div>)}
                                </motion.div>
                            ) : (
                                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 12 }}>
                                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto shadow-xl" style={{ backgroundColor: settings.accentColor }}><Trophy size={40} className="text-black" /></div>
                                    <div className="text-4xl font-black text-white text-center break-all leading-tight">{winner.nickname || winner.nick}</div>
                                    {winner.amount && <div className="mt-4 text-xl font-black text-center" style={{ color: settings.accentColor }}>₩{winner.amount.toLocaleString()}</div>}
                                </motion.div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none" />
                        </div>
                    ))}
                </div>
            </motion.div>
            )}

            {/* ROULETTE VIEW */}
            {view === 'roulette' && rouletteData?.items && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative flex flex-col items-center pointer-events-auto" style={{ transform: `scale(${settings.scale})` }}>
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 z-[100] drop-shadow-2xl">
                    <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[60px] border-t-white drop-shadow-lg"></div>
                </div>

                <motion.div 
                    className="w-[800px] h-[800px] rounded-full border-[12px] border-white shadow-2xl overflow-hidden relative"
                    style={{ backgroundColor: '#111' }}
                    animate={{ rotate: rouletteRotation }} 
                    transition={{ duration: 5, ease: [0.15, 0, 0.15, 1] }}
                >
                    <div className="w-full h-full rounded-full relative" style={{ background: `conic-gradient(${rouletteData.items.map((item: any, i: number, arr: any[]) => {
                        const start = (i / arr.length) * 100;
                        const end = ((i + 1) / arr.length) * 100;
                        return `${item.color} ${start}% ${end}%`;
                    }).join(', ')})` }}>
                        {rouletteData.items.map((item: any, i: number, arr: any[]) => {
                            const angle = (i * (360 / arr.length)) + (360 / arr.length / 2);
                            return (
                                <div key={item.id} className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 origin-bottom flex justify-center pt-12" style={{ transform: `rotate(${angle}deg)` }}>
                                    <span className="text-5xl font-black text-white drop-shadow-md whitespace-nowrap -rotate-90 uppercase tracking-tighter" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                                        {item.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center"><div className="w-20 h-20 bg-white rounded-full border-4 border-black flex items-center justify-center font-black text-black">WIN</div></div>
                </motion.div>
                
                {/* Result Pop */}
                <AnimatePresence>
                    {rouletteData.selected && !isRolling && rouletteRotation > 0 && (
                        <motion.div initial={{ opacity: 0, y: 30, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 5.2, type: 'spring' }} 
                            className={`absolute top-full mt-16 px-16 py-8 border-4 z-[200] text-white shadow-2xl ${settings.theme === 'glass' ? 'backdrop-blur-xl' : ''}`}
                            style={{ 
                                backgroundColor: hexToRgba(settings.backgroundColor || '#000', settings.opacity),
                                borderColor: settings.accentColor,
                                borderRadius: settings.theme === 'pixel' ? '0px' : '3rem',
                                boxShadow: `0 0 50px ${settings.accentColor}40`
                            }}
                        >
                            <span className="block text-center text-sm font-bold uppercase tracking-widest mb-1 opacity-60">Result</span>
                            <h2 className="text-7xl font-black text-center uppercase tracking-tighter leading-none" style={{ color: settings.accentColor }}>{rouletteData.selected.label}</h2>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            )}

        </AnimatePresence>
        </div>
    </>
  );
}