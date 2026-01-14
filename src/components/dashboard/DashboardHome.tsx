'use client';

import { useEffect, useRef } from 'react';
import { Users, MessageSquare, Heart, Gamepad2, Zap, MonitorPlay, Activity, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DashboardHome: gummybot 상황실
 * 모든 UI 요소와 로직이 포함된 100% 전체 소스입니다.
 */
export default function DashboardHome({ store }: { store: any }) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 채팅 자동 스크롤
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [store.chatHistory]);

  return (
    <div className="grid grid-cols-12 gap-8 items-start">
      {/* 1. 방송 라이브 정보 카드 */}
      <div className="col-span-12 lg:col-span-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-[3.5rem] p-12 text-black relative overflow-hidden group shadow-2xl border border-white/10 min-h-[500px] flex flex-col justify-between">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="px-5 py-2 bg-black/10 rounded-full text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 border border-black/5 backdrop-blur-sm">
              <Zap size={14} className="fill-current animate-pulse" /> 
              <span>Live Transmission Active</span>
            </div>
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-12 leading-[1.1] max-w-2xl line-clamp-2 drop-shadow-sm">
            {store.liveStatus?.liveTitle || '데이터 동기화 중...'}
          </h2>
        </div>

        <div className="relative z-10 flex flex-wrap gap-5 mt-auto">
          <div className="bg-black/90 px-8 py-4 rounded-[2rem] text-white font-black flex items-center gap-4 shadow-xl border border-white/5">
            <Users size={24} className="text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest leading-none mb-1">Viewers</span>
              <span className="text-lg leading-none font-bold">{store.liveStatus?.concurrentUserCount?.toLocaleString() || 0}</span>
            </div>
          </div>
          <div className="bg-black/90 px-8 py-4 rounded-[2rem] text-white font-black flex items-center gap-4 shadow-xl border border-white/5">
            <Gamepad2 size={24} className="text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest leading-none mb-1">Category</span>
              <span className="text-lg leading-none font-bold">{store.liveStatus?.category || '미지정'}</span>
            </div>
          </div>
          <div className="bg-black/90 px-8 py-4 rounded-[2rem] text-white font-black flex items-center gap-4 shadow-xl border border-white/5">
            <Heart size={24} className="text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest leading-none mb-1">Followers</span>
              <span className="text-lg leading-none font-bold">{store.channelInfo?.followerCount?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="absolute -top-20 -right-20 p-12 opacity-10 rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-[2000ms]">
          <MonitorPlay size={600} strokeWidth={0.5} />
        </div>
      </div>

      {/* 2. 실시간 채팅 및 로그 */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
        
        {/* 실시간 채팅 모니터 */}
        <div className="bg-[#0a0a0a] rounded-[3.5rem] border border-white/5 p-10 flex flex-col shadow-2xl h-[450px] relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <h3 className="text-xl font-black flex items-center gap-3 text-white"><MessageSquare className="text-emerald-500" /> 실시간 채팅</h3>
            <Activity className="text-emerald-500 animate-pulse" size={18} />
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {store.chatHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-700 opacity-50 py-20">
                  <MessageSquare size={48} className="mb-4 animate-bounce" />
                  <p className="font-bold italic">메시지 대기 중...</p>
                </div>
              ) : (
                store.chatHistory.map((chat: any, i: number) => (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={i} className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs" style={{ color: chat.profile.color || '#00ff94' }}>{chat.profile.nickname}</span>
                      <span className="text-[8px] text-gray-600 font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed break-words">{chat.message}</p>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* 시스템 활동 로그 */}
        <div className="bg-[#0a0a0a] rounded-[3.5rem] border border-white/5 p-8 flex flex-col shadow-2xl h-[250px] relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <Terminal className="text-pink-500" size={18} />
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Activity Log</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            <div className="flex items-center gap-3 text-[11px] text-emerald-500/60 font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>gummybot Services fully synchronized.</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-600 font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
              <span>Monitoring 치지직 live transmission...</span>
            </div>
            {store.commands.length > 0 && (
              <div className="flex items-center gap-3 text-[11px] text-blue-500/60 font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>{store.commands.length} commands are armed and ready.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}