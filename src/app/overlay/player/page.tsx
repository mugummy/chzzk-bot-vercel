'use client';

import { useEffect, useState, useRef } from 'react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, SkipForward } from 'lucide-react';

/**
 * OverlayPlayer: OBS 방송 화면에 띄우는 신청곡 플레이어 컴포넌트
 */
export default function OverlayPlayer() {
  const store = useBotStore();
  const currentSong = store.songs.current;
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const playerRef = useRef<any>(null);

  // 1. WebSocket & YouTube API 초기화
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    // WebSocket 연결 (대시보드와 동일한 서버 주소)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`wss://web-production-19eef.up.railway.app/?token=${token}`);
    
    ws.onopen = () => {
      console.log('[Player] Linked to System');
      ws.send(JSON.stringify({ type: 'connect' }));
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'songStateUpdate') store.updateSongs(data.payload);
    };

    setSocket(ws);

    // YouTube IFrame API 로드
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      console.log('[Player] YouTube API Ready');
    };

    return () => ws.close();
  }, []);

  // 2. 노래 변경 감지 시 재생
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
              // 곡이 끝나면 서버에 다음곡 요청 (스킵 신호)
              if (event.data === 0) {
                if (socket) socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
              }
            },
            'onError': () => {
              // 재생 실패 시 자동으로 다음곡 스킵
              if (socket) socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
            }
          }
        });
      } else {
        playerRef.current.loadVideoById(currentSong.videoId);
      }
    }
  }, [currentSong]);

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-10 left-10 w-[450px] font-sans">
      {/* Hidden Player */}
      <div id="yt-player" className="hidden" />

      {/* Visual UI: Glassmorphism Design */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentSong.videoId}
          initial={{ opacity: 0, x: -50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          className="bg-black/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl flex items-center gap-8 relative overflow-hidden"
        >
          {/* Progress Ring Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent pointer-events-none" />
          
          <div className="relative shrink-0">
            <img 
              src={currentSong.thumbnail} 
              className="w-24 h-24 rounded-2xl object-cover shadow-2xl ring-1 ring-white/20"
              alt="Thumbnail"
            />
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-xl flex items-center justify-center text-black shadow-lg">
              <Music size={16} fill="currentColor" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Now Playing
            </p>
            <h2 className="text-xl font-black text-white tracking-tighter truncate mb-2 drop-shadow-md">
              {currentSong.title}
            </h2>
            <div className="flex items-center gap-2 text-gray-400 font-bold text-xs bg-white/5 w-fit px-3 py-1.5 rounded-full">
              <User size={12} className="text-emerald-500" />
              <span>{currentSong.requester} 님의 신청곡</span>
            </div>
          </div>

          {/* Skip Visual (Optional) */}
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <SkipForward size={60} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
