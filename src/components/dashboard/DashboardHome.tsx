'use client';

import { Users, LayoutGrid, MessageSquare, Heart, Gamepad2, Zap, MonitorPlay, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DashboardHome: 대시보드 메인 화면
 * 방송 제목 겹침 현상 해결 및 이미지 Fallback 강화 버전입니다.
 */
export default function DashboardHome({ store }: { store: any }) {
  return (
    <div className="grid grid-cols-12 gap-8">
      {/* 1. 방송 라이브 카드 */}
      <div className="col-span-12 lg:col-span-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-[3.5rem] p-12 text-black relative overflow-hidden group shadow-2xl border border-white/10">
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="px-5 py-2 bg-black/10 rounded-full text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 border border-black/5 backdrop-blur-sm">
                <Zap size={14} className="fill-current animate-pulse" /> 
                <span>Live Transmission Active</span>
              </div>
            </div>
            
            {/* [수정] 방송 제목: 줄바꿈 시 간격 확보(leading-tight) 및 최대 2줄 제한(line-clamp-2) */}
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-12 leading-[1.1] max-w-2xl group-hover:scale-[1.01] transition-transform duration-700 line-clamp-2 drop-shadow-sm">
              {store.liveStatus?.liveTitle || '방송 정보를 동기화 중입니다...'}
            </h2>
          </div>

          <div className="flex flex-wrap gap-5 mt-auto">
            <div className="bg-black/90 px-10 py-5 rounded-[2.5rem] text-white font-black flex items-center gap-5 shadow-2xl hover:bg-black transition-colors">
              <Users size={28} className="text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Live Viewers</span>
                <span className="text-2xl leading-none">{store.liveStatus?.concurrentUserCount?.toLocaleString() || 0}</span>
              </div>
            </div>
            
            <div className="bg-black/10 backdrop-blur-md px-10 py-5 rounded-[2.5rem] font-black flex items-center gap-5 border border-white/10">
              <Gamepad2 size={28} />
              <div className="flex flex-col">
                <span className="text-[10px] text-black/40 uppercase font-black tracking-widest mb-1">Streaming In</span>
                <span className="text-2xl leading-none font-bold">{store.liveStatus?.category || '미지정'}</span>
              </div>
            </div>

            <div className="bg-black/10 backdrop-blur-md px-10 py-5 rounded-[2.5rem] font-black flex items-center gap-5 border border-white/10">
              <Heart size={28} className="text-red-600 fill-current" />
              <div className="flex flex-col">
                <span className="text-[10px] text-black/40 uppercase font-black tracking-widest mb-1">Channel Fans</span>
                <span className="text-2xl leading-none font-bold">{store.channelInfo?.followerCount?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute -top-20 -right-20 p-12 opacity-10 rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-[2000ms] ease-out">
          <MonitorPlay size={600} strokeWidth={0.5} />
        </div>
      </div>

      {/* 2. 실시간 채팅 모니터 */}
      <div className="col-span-12 lg:col-span-4 bg-[#0a0a0a] rounded-[3.5rem] border border-white/5 p-10 flex flex-col shadow-2xl relative group hover:border-white/10 transition-all duration-500">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-3 text-white">
              <MessageSquare className="text-emerald-500" /> 실시간 채팅
            </h3>
            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Global Stream Cache</p>
          </div>
          <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover:text-emerald-500 transition-colors">
            <Activity size={20} />
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[550px]">
          <AnimatePresence initial={false}>
            {store.chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50 py-32">
                <MessageSquare size={64} strokeWidth={1} className="mb-6 animate-bounce" />
                <p className="text-lg font-bold italic tracking-tight">메시지 대기 중...</p>
              </div>
            ) : (
              store.chatHistory.map((chat: any, i: number) => (
                <motion.div 
                  initial={{ opacity: 0, x: 30 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  key={i} 
                  className="bg-white/[0.03] p-5 rounded-[1.5rem] border border-white/5 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-black text-sm tracking-tight" style={{ color: chat.profile.color || '#00ff94' }}>
                      {chat.profile.nickname}
                    </span>
                    <span className="text-[9px] text-gray-600 font-black">
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
        </div>
      </div>
    </div>
  );
}