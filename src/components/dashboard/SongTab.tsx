'use client';

import { Play, SkipForward, Trash2, ExternalLink, Music, Disc } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion } from 'framer-motion';

/**
 * SongTab: 신청곡 대기열 및 플레이어 제어
 */
export default function SongTab({ onControl }: { onControl: (action: string) => void }) {
  const { songs } = useBotStore();

  // [수정] 더 안정적인 플레이스홀더 이미지 서비스 사용
  const fallbackImg = "https://placehold.co/600x400/111/00ff94?text=gummybot+Music";

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* 1. 현재 재생 중인 곡 카드 */}
        <div className="xl:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
          <div className="relative mb-10 z-10">
            <div className="absolute inset-0 bg-pink-500/20 blur-[100px] rounded-full group-hover:bg-pink-500/30 transition-all duration-700" />
            <motion.div
              animate={songs.current ? { rotate: 360 } : {}}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="relative z-10"
            >
              <img 
                src={songs.current?.thumbnail || fallbackImg} 
                className="w-72 h-72 rounded-full object-cover shadow-[0_0_50px_rgba(0,0,0,0.5)] border-8 border-white/5 ring-1 ring-white/10"
                alt="Album Art"
                onError={(e) => { (e.target as HTMLImageElement).src = fallbackImg; }}
              />
            </motion.div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#0a0a0a] rounded-full border-4 border-white/5 z-20 flex items-center justify-center">
              <Disc className={`text-emerald-500 ${songs.current ? 'animate-spin-slow' : ''}`} size={32} />
            </div>
          </div>

          <div className="relative z-10 space-y-2 mb-10 max-w-lg">
            <h3 className="text-3xl font-black tracking-tighter line-clamp-1 text-white">
              {songs.current?.title || '현재 재생 중인 곡이 없습니다'}
            </h3>
            <p className="text-gray-500 font-bold text-lg uppercase tracking-widest">
              {songs.current?.requester ? `${songs.current.requester}님의 신청곡` : 'JUKEBOX READY'}
            </p>
          </div>
          
          <div className="relative z-10 flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => onControl('togglePlayPause')}
              className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
            >
              <Play fill="currentColor" size={32} />
            </button>
            <button 
              onClick={() => onControl('skip')}
              className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <SkipForward size={32} />
            </button>
            <button 
              onClick={() => window.open('/overlay/player', '_blank', 'width=850,height=650')}
              className="px-10 bg-white/5 rounded-[2rem] border border-white/10 font-black text-white hover:bg-white/10 transition-all flex items-center gap-3"
            >
              <ExternalLink size={20} className="text-emerald-500" />
              <span>플레이어 열기</span>
            </button>
          </div>
        </div>

        {/* 2. 신청곡 대기열 카드 */}
        <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col shadow-2xl">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black flex items-center gap-3 text-white">
              <Music className="text-emerald-500" /> 대기열 <span className="text-emerald-500/50">{songs.queue.length}</span>
            </h3>
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Next Tracks</span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
            {songs.queue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50 py-20">
                <Music size={48} strokeWidth={1} className="mb-4" />
                <p className="font-bold italic">대기 중인 곡이 없습니다.</p>
              </div>
            ) : (
              songs.queue.map((song, i) => (
                <div key={i} className="flex items-center gap-5 bg-white/[0.02] p-5 rounded-2xl border border-white/5 group hover:border-emerald-500/20 transition-all">
                  <div className="relative shrink-0">
                    <img src={song.thumbnail} className="w-14 h-14 rounded-xl object-cover shadow-lg" alt="Track" />
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-black text-[10px] font-black">{i + 1}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate text-sm mb-1">{song.title}</p>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">{song.requester}</p>
                  </div>
                  <button className="p-3 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}