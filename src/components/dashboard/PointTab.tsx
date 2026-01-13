'use client';

import { useState, useEffect } from 'react';
import { Coins, Trophy, Settings2, Save, TrendingUp, User, Medal, Clock } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion } from 'framer-motion';

export default function PointTab({ onSend }: { onSend: (msg: any) => void }) {
  const store = useBotStore();
  const { points, settings } = store;
  
  const ranking = Object.entries(points)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  const [localSettings, setLocalSettings] = useState({
    pointsPerChat: 1,
    pointsCooldown: 60,
    pointsName: '포인트'
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        pointsPerChat: settings.pointsPerChat,
        pointsCooldown: settings.pointsCooldown,
        pointsName: settings.pointsName
      });
    }
  }, [settings]);

  const handleSave = () => {
    onSend({ type: 'updateSettings', data: localSettings });
    if (typeof window !== 'undefined' && (window as any).ui?.notify) {
      (window as any).ui.notify('포인트 정책이 저장되었습니다.', 'success');
    }
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 space-y-10 shadow-2xl">
          <header className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <Settings2 size={24} />
                </div>
                포인트 정책 설정
              </h3>
              <p className="text-gray-500 font-medium mt-1">시청자 보상 기준을 정합니다.</p>
            </div>
          </header>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">단위 명칭</label>
              <input 
                value={localSettings.pointsName}
                onChange={e => setLocalSettings({...localSettings, pointsName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-amber-500 transition-all outline-none font-bold text-xl text-white"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">지급액</label>
                <span className="text-amber-500 font-black text-lg">{localSettings.pointsPerChat}{localSettings.pointsName}</span>
              </div>
              <div className="flex gap-4 items-center">
                <input 
                  type="range" min="1" max="100"
                  value={localSettings.pointsPerChat}
                  onChange={e => setLocalSettings({...localSettings, pointsPerChat: parseInt(e.target.value)})}
                  className="w-full accent-amber-500"
                />
                <input 
                  type="number" min="1"
                  value={localSettings.pointsPerChat}
                  onChange={e => setLocalSettings({...localSettings, pointsPerChat: parseInt(e.target.value)})}
                  className="w-20 bg-white/5 border border-white/10 p-2 rounded-xl text-center font-bold text-white outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">지급 간격</label>
                <span className="text-amber-500 font-black text-lg">{localSettings.pointsCooldown}초</span>
              </div>
              <div className="flex gap-4 items-center">
                <input 
                  type="range" min="10" max="600" step="10"
                  value={localSettings.pointsCooldown}
                  onChange={e => setLocalSettings({...localSettings, pointsCooldown: parseInt(e.target.value)})}
                  className="w-full accent-amber-500"
                />
                <input 
                  type="number" min="10" step="10"
                  value={localSettings.pointsCooldown}
                  onChange={e => setLocalSettings({...localSettings, pointsCooldown: parseInt(e.target.value)})}
                  className="w-20 bg-white/5 border border-white/10 p-2 rounded-xl text-center font-bold text-white outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button onClick={handleSave} className="w-full py-6 bg-amber-500 text-black font-black rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all text-lg flex items-center justify-center gap-3">
              <Save size={22} /> <span>정책 적용하기</span>
            </button>
          </div>
        </div>

        <div className="xl:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 flex flex-col shadow-2xl">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-2xl font-black flex items-center gap-3 text-white">
              <Trophy size={28} className="text-amber-500" /> 실시간 포인트 랭킹
            </h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
              <TrendingUp size={16} className="text-emerald-500" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Leaderboard</span>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {ranking.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-700 py-32 italic font-bold">랭킹 데이터 집계 중...</div>
            ) : (
              ranking.map((user, i) => (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={user.id} className="flex items-center justify-between p-6 rounded-3xl border border-white/5 bg-white/[0.02] hover:border-amber-500/30 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${i === 0 ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-500'}`}>{i + 1}</div>
                    <div><p className="font-black text-xl text-white group-hover:text-amber-400 transition-colors">{user.nickname}</p></div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-amber-500">{user.points.toLocaleString()}</p>
                    <p className="text-[10px] font-black text-gray-600 uppercase">{localSettings.pointsName}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
