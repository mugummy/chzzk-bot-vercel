'use client';

import { useState, useEffect, useRef } from 'react';
import { Coins, Save, Clock, Zap, Trophy, Crown, Star } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import NumberInput from '@/components/ui/NumberInput';

/**
 * PointTab: 포인트 시스템
 * 좌측: 시스템 설정 / 우측: 실시간 랭킹 (Rich List)
 */
export default function PointTab({ onSend }: { onSend: (msg: any) => void }) {
  const { points, settings } = useBotStore();
  const [pointName, setPointName] = useState('포인트');
  const [perChat, setPerChat] = useState(10);
  const [cooldown, setCooldown] = useState(60);
  
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

  // 랭킹 정렬 (상위 50명까지 표시 가능하도록 넉넉히 슬라이스)
  const ranking = Object.entries(points)
    .sort(([, a], [, b]) => b.points - a.points)
    .slice(0, 50);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      
      {/* 1. 좌측: 포인트 시스템 설정 (xl:col-span-5) */}
      <div className="xl:col-span-5 space-y-8 sticky top-0">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 shadow-2xl space-y-10">
          <header className="flex items-center gap-6">
            <div className="w-16 h-16 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500 shadow-2xl shadow-amber-500/10">
              <Coins size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tighter">Economy Settings</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">포인트 시스템 설정</p>
            </div>
          </header>

          <div className="space-y-8">
            {/* 이름 설정 */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Unit Name</label>
              <input 
                value={pointName} 
                onChange={e => setPointName(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 p-6 rounded-[2rem] outline-none font-bold text-xl text-white focus:border-amber-500/50 transition-all shadow-inner" 
                placeholder="예: 치즈, 포인트, 조각" 
              />
            </div>

            {/* 지급량 설정 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Per Chat</label>
                <span className="text-amber-500 font-black text-sm">채팅당 지급</span>
              </div>
              <NumberInput value={perChat} onChange={setPerChat} min={1} max={1000} step={1} className="bg-white/[0.03] p-4" />
            </div>

            {/* 쿨타임 설정 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cooldown</label>
                <span className="text-amber-500 font-black text-sm">지급 간격 (초)</span>
              </div>
              <NumberInput value={cooldown} onChange={setCooldown} min={10} max={3600} step={10} unit="s" className="bg-white/[0.03] p-4" />
            </div>
          </div>

          <button onClick={handleSave} className="w-full bg-white text-black py-6 rounded-[2.5rem] font-black text-lg hover:bg-amber-500 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 group">
            <Save size={24} className="group-hover:rotate-12 transition-transform" /> 
            <span>설정 저장하기</span>
          </button>
        </div>

        {/* 안내 카드 */}
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem] p-8 flex gap-5">
          <Star className="text-amber-500 shrink-0" size={24} />
          <p className="text-xs text-amber-200/60 font-medium leading-relaxed">
            시청자들이 채팅을 칠 때마다 설정된 포인트가 자동으로 지급됩니다. 쿨타임을 적절히 설정하여 포인트 인플레이션을 방지하세요.
          </p>
        </div>
      </div>

      {/* 2. 우측: Rich List (xl:col-span-7) */}
      <div className="xl:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 shadow-2xl min-h-[800px] relative overflow-hidden flex flex-col">
        <header className="flex justify-between items-center mb-12 relative z-10 shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-amber-500 border border-white/5">
              <Trophy size={24} />
            </div>
            <h4 className="text-3xl font-black italic uppercase tracking-tighter text-white">Rich List</h4>
          </div>
          <span className="px-5 py-2 bg-amber-500/10 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] border border-amber-500/20">
            Real-time Ranking
          </span>
        </header>
        
        <div className="flex-1 space-y-3 relative z-10 overflow-y-auto pr-2 custom-scrollbar max-h-[1000px]">
          <AnimatePresence>
            {ranking.map(([id, user], i) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.02 }} 
                key={id} 
                className={`flex items-center justify-between p-6 rounded-[2.5rem] border transition-all ${
                  i === 0 ? 'bg-amber-500/10 border-amber-500/30 shadow-2xl' : 
                  i === 1 ? 'bg-white/[0.04] border-white/10' :
                  'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl ${
                      i === 0 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 
                      i === 1 ? 'bg-gray-300 text-black' :
                      i === 2 ? 'bg-orange-400 text-black' : 'bg-white/5 text-gray-500'
                    }`}>
                      {i + 1}
                    </div>
                    {i === 0 && <Crown className="absolute -top-4 -left-4 text-amber-500 rotate-[-20deg]" size={28} fill="currentColor" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-xl text-gray-200">{user.nickname}</span>
                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Active Earner</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-black text-3xl tracking-tighter leading-none">{user.points.toLocaleString()}</span>
                    <Coins size={16} className="text-amber-500/50" />
                  </div>
                  <span className="text-[10px] font-black text-gray-600 uppercase mt-1">{pointName}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {ranking.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-800 opacity-50 py-40">
              <Coins size={80} strokeWidth={1} className="mb-6 animate-pulse" />
              <p className="text-xl font-black italic uppercase tracking-[0.2em]">Waiting for data...</p>
            </div>
          )}
        </div>

        {/* 배경 장식 */}
        <Trophy className="absolute -bottom-20 -right-20 text-white/[0.01] rotate-12 pointer-events-none" size={500} />
      </div>
    </div>
  );
}
