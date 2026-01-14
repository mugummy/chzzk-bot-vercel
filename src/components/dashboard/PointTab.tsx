'use client';

import { useState, useEffect, useRef } from 'react';
import { Coins, Save, Clock, Zap } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import NumberInput from '@/components/ui/NumberInput';

export default function PointTab({ onSend }: { onSend: (msg: any) => void }) {
  const { points, settings } = useBotStore();
  const [pointName, setPointName] = useState('포인트');
  const [perChat, setPerChat] = useState(10);
  const [cooldown, setCooldown] = useState(60);
  
  // [핵심] 최초 로딩 감지용 플래그
  const isLoaded = useRef(false);

  useEffect(() => {
    if (settings && !isLoaded.current) {
      setPointName(settings.pointsName || '포인트');
      setPerChat(settings.pointsPerChat || 10);
      setCooldown(settings.pointsCooldown || 60);
      isLoaded.current = true;
    }
  }, [settings]);

  const notify = (msg: string) => {
    if (typeof window !== 'undefined' && (window as any).ui?.notify) {
      (window as any).ui.notify(msg, 'success');
    }
  };

  const handleSave = () => {
    onSend({ 
      type: 'updateSettings', 
      data: { 
        pointsName: pointName, 
        pointsPerChat: perChat, 
        pointsCooldown: cooldown 
      } 
    });
    notify('포인트 설정이 저장되었습니다.');
  };

  // 랭킹 정렬
  const ranking = Object.entries(points)
    .sort(([, a], [, b]) => b.points - a.points)
    .slice(0, 10);

  return (
    <div className="space-y-10">
      {/* 1. 설정 패널 */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 shadow-2xl">
        <header className="flex justify-between items-center mb-10">
          <h3 className="text-2xl font-black flex items-center gap-3 text-white">
            <Coins className="text-amber-500" size={28} /> 포인트 시스템 설정
          </h3>
          <button onClick={handleSave} className="bg-amber-500 text-black px-8 py-3 rounded-2xl font-black hover:scale-105 transition-all flex items-center gap-2">
            <Save size={20} /> 저장
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">포인트 단위 이름</label>
            <input value={pointName} onChange={e => setPointName(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-[2rem] outline-none font-bold text-xl text-white focus:border-amber-500/50 transition-all" placeholder="예: 치즈, 포인트" />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">채팅 1회당 지급량</label>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/5">
              <Zap className="text-amber-500 shrink-0" />
              <input type="range" min="1" max="100" value={perChat} onChange={e => setPerChat(parseInt(e.target.value))} className="flex-1 accent-amber-500 h-1.5 bg-white/10 rounded-lg cursor-pointer" />
              <NumberInput value={perChat} onChange={setPerChat} min={1} max={1000} step={1} className="w-24 border-amber-500/20" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">지급 쿨타임 (초)</label>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/5">
              <Clock className="text-amber-500 shrink-0" />
              <input type="range" min="10" max="300" step="10" value={cooldown} onChange={e => setCooldown(parseInt(e.target.value))} className="flex-1 accent-amber-500 h-1.5 bg-white/10 rounded-lg cursor-pointer" />
              <NumberInput value={cooldown} onChange={setCooldown} min={10} max={3600} step={10} unit="s" className="w-24 border-amber-500/20" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. 포인트 랭킹 */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl min-h-[500px]">
        <div className="flex items-center gap-3 mb-8">
          <TrophyIcon />
          <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white">Rich List</h4>
        </div>
        
        <div className="space-y-3">
          <AnimatePresence>
            {ranking.map(([id, user], i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={id} className={`flex items-center justify-between p-6 rounded-[2rem] border ${i === 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                <div className="flex items-center gap-6">
                  <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${i === 0 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-gray-500'}`}>{i + 1}</span>
                  <span className="font-black text-xl text-gray-200">{user.nickname}</span>
                </div>
                <div className="text-right">
                  <span className="text-amber-500 font-black text-2xl tracking-tighter">{user.points.toLocaleString()}</span>
                  <span className="text-xs font-bold text-gray-600 uppercase ml-2">{pointName}</span>
                </div>
              </motion.div>
            ))}
            {ranking.length === 0 && (
              <div className="py-32 text-center text-gray-700 font-bold italic border-2 border-dashed border-white/5 rounded-[3rem]">
                아직 포인트를 획득한 시청자가 없습니다.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TrophyIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}