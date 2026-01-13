'use client';

import { useEffect, useRef } from 'react';
import { Users, LayoutGrid, MessageSquare, Heart, Gamepad2, Zap, MonitorPlay, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DashboardHome: 대시보드 메인 화면
 * 채팅창 고정 높이 및 독립 스크롤 시스템이 적용된 버전입니다.
 */
export default function DashboardHome({ store }: { store: any }) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 새 채팅이 올 때마다 하단 스크롤 (사용자가 위로 올렸을 때는 방해하지 않음)
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [store.chatHistory]);

  return (
    <div className="grid grid-cols-12 gap-8 items-start">
      {/* 1. 방송 라이브 카드 (고정 높이 권장) */}
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
          <StatChip icon={<Users size={24}/>} label="Viewers" value={store.liveStatus?.concurrentUserCount?.toLocaleString() || 0} />
          <StatChip icon={<Gamepad2 size={24}/>} label="Category" value={store.liveStatus?.category || '미지정'} />
          <StatChip icon={<Heart size={24}/>} label="Followers" value={store.channelInfo?.followerCount?.toLocaleString() || 0} />
        </div>
        
        <div className="absolute -top-20 -right-20 p-12 opacity-10 rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-[2000ms]">
          <MonitorPlay size={600} strokeWidth={0.5} />
        </div>
      </div>

      {/* 2. 실시간 채팅 모니터 (레이아웃 고정의 핵심) */}
      <div className="col-span-12 lg:col-span-4 bg-[#0a0a0a] rounded-[3.5rem] border border-white/5 p-10 flex flex-col shadow-2xl relative group h-[500px] lg:h-[600px] overflow-hidden transition-all duration-500 hover:border-white/10">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-3 text-white">
              <MessageSquare className="text-emerald-500" /> 실시간 채팅
            </h3>
            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Global Stream Cache</p>
          </div>
          <Activity className="text-gray-600 group-hover:text-emerald-500 transition-colors" size={20} />
        </div>

        {/* [중요] 스크롤 가능 영역 고정 */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {store.chatHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-700 opacity-50 py-32">
                <MessageSquare size={64} strokeWidth={1} className="mb-6 animate-bounce" />
                <p className="text-lg font-bold italic tracking-tight text-center">메시지를 <br/>기다리는 중...</p>
              </div>
            ) : (
              store.chatHistory.map((chat: any, i: number) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
                  key={i} className="bg-white/[0.03] p-5 rounded-[1.5rem] border border-white/5 hover:border-emerald-500/30 transition-all shrink-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm tracking-tight" style={{ color: chat.profile.color || '#00ff94' }}>
                      {chat.profile.nickname}
                    </span>
                    <span className="text-[9px] text-gray-600 font-black uppercase">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm font-medium leading-relaxed break-words">
                    {chat.message}
                  </p>
                </motion.div>
              ))
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Bottom Fade Effect */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}

function StatChip({ icon, label, value }: any) {
  return (
    <div className="bg-black/90 px-8 py-4 rounded-[2.5rem] text-white font-black flex items-center gap-4 shadow-xl border border-white/5 hover:scale-105 transition-all">
      <div className="text-emerald-400">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[9px] text-gray-500 uppercase tracking-widest leading-none mb-1">{label}</span>
        <span className="text-lg leading-none font-bold">{value}</span>
      </div>
    </div>
  );
}