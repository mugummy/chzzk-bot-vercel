'use client';

import { useEffect, useState, useRef } from 'react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, SkipForward, Disc, ListMusic } from 'lucide-react';

export default function OverlayPlayer() {
  const store = useBotStore();
  const currentSong = store.songs.current;
  const queue = store.songs.queue;
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`wss://web-production-19eef.up.railway.app/?token=${token}`);
    
    ws.onopen = () => ws.send(JSON.stringify({ type: 'connect' }));
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'songStateUpdate') store.updateSongs(data.payload);
    };

    setSocket(ws);

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      console.log('[Player] YouTube API Ready');
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    if (currentSong && (window as any).YT && (window as any).YT.Player) {
      if (!playerRef.current) {
        playerRef.current = new (window as any).YT.Player('yt-player', {
          height: '0',
          width: '0',
          videoId: currentSong.videoId,
          playerVars: { 'autoplay': 1, 'controls': 0, 'disablekb': 1 },
          events: {
            'onStateChange': (event: any) => {
              if (event.data === 0 && socket) socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
            },
            'onError': () => {
              if (socket) socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
            }
          }
        });
      } else {
        playerRef.current.loadVideoById(currentSong.videoId);
      }
    }
  }, [currentSong]);

  if (!currentSong) return <div className="fixed bottom-10 left-10 p-6 bg-black/80 rounded-2xl text-white font-bold backdrop-blur-md border border-white/10 flex items-center gap-3"><Music className="animate-bounce" /> 대기 중인 노래가 없습니다.</div>;

  return (
    <div className="fixed bottom-10 left-10 flex gap-6 font-sans items-end">
      <div id="yt-player" className="hidden" />

      {/* Main Player Card */}
      <motion.div 
        layout
        className="w-[450px] bg-black/90 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-48 h-48 rounded-full border-8 border-white/5 shadow-2xl overflow-hidden relative z-10"
            >
              <img src={currentSong.thumbnail} className="w-full h-full object-cover" alt="Cover" />
              <div className="absolute inset-0 bg-black/20" />
            </motion.div>
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black rounded-full border-2 border-white/10 z-20 flex items-center justify-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            </div>
          </div>

          <div className="w-full">
            <h2 className="text-2xl font-black text-white tracking-tight truncate mb-1">{currentSong.title}</h2>
            <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2">
              <User size={12} /> {currentSong.requester}
            </p>
          </div>

          {/* Progress Bar (Visual Only) */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: "100%" }} 
              transition={{ duration: 180, ease: "linear" }} 
              className="h-full bg-gradient-to-r from-pink-500 to-emerald-500" 
            />
          </div>
        </div>
      </motion.div>

      {/* Queue Sidebar */}
      {queue.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="w-64 bg-black/80 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-xl flex flex-col gap-4"
        >
          <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest pb-2 border-b border-white/10">
            <ListMusic size={14} /> Next Up
          </div>
          {queue.slice(0, 3).map((song, i) => (
            <div key={i} className="flex items-center gap-3 opacity-80">
              <span className="text-emerald-500 font-black text-sm">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-bold truncate">{song.title}</p>
                <p className="text-[10px] text-gray-500">{song.requester}</p>
              </div>
            </div>
          ))}
          {queue.length > 3 && <p className="text-[10px] text-center text-gray-600">+{queue.length - 3} more</p>}
        </motion.div>
      )}
    </div>
  );
}