'use client';

import { useState, useEffect, useRef } from 'react';
import { Coins, Save, Clock, Zap, Trophy, Medal, Crown } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import NumberInput from '@/components/ui/NumberInput';

/**
 * PointTab: 포인트 시스템 및 랭킹
 * 레이아웃을 기존의 직관적인 구조로 복구하고 커스텀 컨트롤러를 적용한 최종본입니다.
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

  // 랭킹 데이터 정렬 (상위 20명)
  const ranking = Object.entries(points)
    .sort(([, a], [, b]) => b.points - a.points)
    .slice(0, 20);

  return (
    <div className="space-y-10">
      
      {/* 1. 포인트 시스템 설정 (상단 가로형 바) */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl flex flex-col xl:flex-row items-center gap-10">
        <div className="flex items-center gap-6 shrink-0">
          <div className="w-16 h-16 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500">
            <Coins size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">포인트 설정</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Economy System</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
          {/* 이름 설정 */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Unit Name</label>
            <input 
              value={pointName} 
              onChange={e => setPointName(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none font-bold text-white focus:border-amber-500/50 transition-all" 
              placeholder="단위 명칭" 
            />
          </div>

          {/* 지급량 설정 */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Per Chat</label>
            <NumberInput value={perChat} onChange={setPerChat} min={1} max={1000} step={1} className="bg-white/[0.03]" />
          </div>

          {/* 쿨타임 설정 */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Cooldown (Sec)</label>
            <NumberInput value={cooldown} onChange={setCooldown} min={10} max={3600} step={10} unit="s" className="bg-white/[0.03]" />
          </div>
        </div>

        <button onClick={handleSave} className="bg-white text-black px-10 py-5 rounded-[2rem] font-black hover:bg-amber-500 transition-all flex items-center gap-2 shadow-xl active:scale-95 shrink-0">
          <Save size={20} /> 저장하기
        </button>
      </div>

      {/* 2. Rich List (하단 메인 랭킹) */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 shadow-2xl min-h-[600px] relative overflow-hidden">
        <header className="flex justify-between items-center mb-12 relative z-10">
          <div className="flex items-center gap-4">
            <Trophy className="text-amber-500" size={32} />
            <h4 className="text-3xl font-black italic uppercase tracking-tighter text-white">Rich List <span className="text-amber-500/30 ml-2">Top 20</span></h4>
          </div>
          <div className="px-6 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
            Real-time Ranking
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10">
          <AnimatePresence>
            {ranking.map(([id, user], i) => (
              <motion.div 
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.03 }} 
                key={id} 
                className={`flex items-center justify-between p-6 rounded-[2.5rem] border transition-all ${
                  i === 0 ? 'bg-amber-500/10 border-amber-500/30 shadow-2xl shadow-amber-500/5' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <span className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl ${
                      i === 0 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 
                      i === 1 ? 'bg-gray-300 text-black' :
                      i === 2 ? 'bg-orange-400 text-black' : 'bg-white/5 text-gray-500'
                    }`}>
                      {i + 1}
                    </span>
                    {i === 0 && <Crown className="absolute -top-3 -left-3 text-amber-500 rotate-[-20deg]" size={24} fill="currentColor" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-xl text-gray-200">{user.nickname}</span>
                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Active Supporter</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-amber-500 font-black text-3xl tracking-tighter leading-none">{user.points.toLocaleString()}</span>
                  <span className="text-[10px] font-black text-gray-600 uppercase mt-1">{pointName}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {ranking.length === 0 && (
          <div className="py-40 text-center flex flex-col items-center justify-center relative z-10">
            <Coins size={64} className="text-gray-800 mb-6 animate-pulse" />
            <p className="text-gray-600 font-black italic text-xl uppercase tracking-widest">Waiting for the first earner...</p>
          </div>
        )}

        {/* 배경 장식 */}
        <Trophy className="absolute -bottom-20 -right-20 text-white/[0.01] rotate-12" size={500} />
      </div>
    </div>
  );
}
