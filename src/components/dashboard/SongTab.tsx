'use client';

import { Play, SkipForward, Trash2, ExternalLink, Music } from 'lucide-react';
import { useBotStore } from '@/lib/store';

export default function SongTab({ onControl }: { onControl: (action: string) => void }) {
  const { songs } = useBotStore();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-12 gap-8">
        {/* Current Song */}
        <div className="col-span-7 bg-[#111] border border-white/5 rounded-[3rem] p-10 flex flex-col items-center text-center">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full group-hover:bg-emerald-500/40 transition-all duration-700" />
            <img 
              src={songs.current?.thumbnail || 'https://via.placeholder.com/400x225?text=No+Music'} 
              className="relative z-10 w-full max-w-md aspect-video rounded-3xl object-cover shadow-2xl ring-1 ring-white/10"
              alt="Thumbnail"
            />
          </div>
          <h3 className="text-2xl font-black mb-2 line-clamp-1">{songs.current?.title || '현재 재생 중인 곡이 없습니다'}</h3>
          <p className="text-gray-500 font-bold mb-8">{songs.current?.requester ? `${songs.current.requester} 님의 신청곡` : '플레이어 대기 중'}</p>
          
          <div className="flex gap-4">
            <button 
              onClick={() => onControl('togglePlayPause')}
              className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-black hover:scale-110 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Play fill="currentColor" size={28} />
            </button>
            <button 
              onClick={() => onControl('skip')}
              className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white hover:bg-white/10 transition-all"
            >
              <SkipForward size={28} />
            </button>
            <button 
              onClick={() => window.open('/player.html', '_blank', 'width=850,height=650')}
              className="px-8 bg-white/5 rounded-2xl font-black flex items-center gap-3 hover:bg-white/10 transition-all"
            >
              <ExternalLink size={20} />
              <span>플레이어 열기</span>
            </button>
          </div>
        </div>

        {/* Queue */}
        <div className="col-span-5 bg-[#111] border border-white/5 rounded-[3rem] p-10 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black">대기열 ({songs.queue.length})</h3>
            <Music className="text-emerald-500" />
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-4 custom-scrollbar max-h-[400px]">
            {songs.queue.length === 0 ? (
              <div className="text-center py-20 text-gray-600 font-bold">대기 중인 곡이 없습니다</div>
            ) : (
              songs.queue.map((song, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                  <img src={song.thumbnail} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{song.title}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{song.requester}</p>
                  </div>
                  <button className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
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
