'use client';

import { useState } from 'react';
import { Coins, Trophy, Settings2, Save, TrendingUp, User, Medal, Clock } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion } from 'framer-motion';

/**
 * PointTab: 포인트 시스템 설정 및 실시간 랭킹 컴포넌트
 */
export default function PointTab({ onSend }: { onSend: (msg: any) => void }) {
  const { points, settings } = useBotStore();
  
  // 포인트 랭킹 계산 (상위 10명)
  const ranking = Object.entries(points)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  const [localSettings, setLocalSettings] = useState({
    pointsPerChat: settings?.pointsPerChat || 1,
    pointsCooldown: settings?.pointsCooldown || 60,
    pointsName: settings?.pointsName || '포인트'
  });

  const handleSave = () => {
    onSend({ type: 'updateSettings', data: localSettings });
    window.ui.notify('포인트 설정이 저장되었습니다.', 'success');
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* 1. 포인트 정책 설정 카드 */}
        <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 space-y-10 shadow-2xl">
          <header className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <Settings2 size={24} />
                </div>
                포인트 정책 설정
              </h3>
              <p className="text-gray-500 font-medium mt-1">시청자 활동에 따른 보상 기준을 정합니다.</p>
            </div>
          </header>

          <div className="space-y-8">
            {/* 포인트 이름 */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">포인트 단위 명칭</label>
              <input 
                value={localSettings.pointsName}
                onChange={e => setLocalSettings({...localSettings, pointsName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-amber-500/50 transition-all outline-none font-bold text-xl"
                placeholder="예: 포인트, 코인, 머니"
              />
            </div>

            {/* 지급 포인트 */}
            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">채팅 1회당 지급액</label>
                <span className="text-amber-500 font-black text-lg">{localSettings.pointsPerChat}{localSettings.pointsName}</span>
              </div>
              <input 
                type="range" min="1" max="100"
                value={localSettings.pointsPerChat}
                onChange={e => setLocalSettings({...localSettings, pointsPerChat: parseInt(e.target.value)})}
                className="w-full accent-amber-500 opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>

            {/* 지급 쿨타임 */}
            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">지급 간격 (쿨타임)</label>
                <span className="text-amber-500 font-black text-lg">{localSettings.pointsCooldown}초</span>
              </div>
              <input 
                type="range" min="10" max="600" step="10"
                value={localSettings.pointsCooldown}
                onChange={e => setLocalSettings({...localSettings, pointsCooldown: parseInt(e.target.value)})}
                className="w-full accent-amber-500 opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-6 bg-amber-500 text-black font-black rounded-3xl shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
            >
              <Save size={22} /> <span>정책 적용하기</span>
            </button>
          </div>
        </div>

        {/* 2. 실시간 랭킹 보드 카드 */}
        <div className="xl:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 flex flex-col shadow-2xl">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-2xl font-black flex items-center gap-3">
              <Trophy size={28} className="text-amber-500" /> 실시간 포인트 랭킹
            </h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
              <TrendingUp size={16} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Leaderboard</span>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {ranking.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50 py-32">
                <User size={64} strokeWidth={1} className="mb-4" />
                <p className="text-xl font-bold tracking-tight">데이터를 수집 중입니다...</p>
              </div>
            ) : (
              ranking.map((user, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  key={user.id} 
                  className={`flex items-center justify-between p-6 rounded-3xl border transition-all group ${i < 3 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${
                        i === 0 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' :
                        i === 1 ? 'bg-gray-300 text-black shadow-lg' :
                        i === 2 ? 'bg-orange-400 text-black shadow-lg' : 'bg-white/5 text-gray-500'
                      }`}>
                        {i + 1}
                      </div>
                      {i < 3 && (
                        <Medal size={18} className={`absolute -top-2 -right-2 ${
                          i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : 'text-orange-400'
                        } drop-shadow-lg`} />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-xl text-gray-100 group-hover:text-white transition-colors">{user.nickname}</p>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">마지막 활동: {new Date(user.lastMessageTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black tracking-tighter text-amber-500">{user.points.toLocaleString()}</p>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{localSettings.pointsName}</p>
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
