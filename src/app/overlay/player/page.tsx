'use client';

import { useEffect, useState, useRef } from 'react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, SkipForward, ListMusic, Volume2, AlertCircle } from 'lucide-react';

export default function OverlayPlayer() {
  const store = useBotStore();
  const currentSong = store.songs.current;
  const queue = store.songs.queue;
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isApiReady, setIsApiReady] = useState(false); // [수정] API 로드 완료 상태
  const [isPlayerReady, setIsPlayerReady] = useState(false); // [수정] 플레이어 객체 준비 완료 상태
  const [needsInteraction, setNeedsInteraction] = useState(true);
  const playerRef = useRef<any>(null);

  // 1. WebSocket 및 YouTube API 로드
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`wss://web-production-19eef.up.railway.app/?token=${token}`);
    
    ws.onopen = () => {
      console.log('[Player] Connected');
      ws.send(JSON.stringify({ type: 'connect' }));
      ws.send(JSON.stringify({ type: 'requestData' })); // [중요] 접속 즉시 데이터 요청
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'songStateUpdate') store.updateSongs(data.payload);
      if (data.type === 'connectResult') store.updateSongs(data.payload || { queue: [], currentSong: null }); // 초기 데이터 동기화
    };
    setSocket(ws);

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = () => setIsApiReady(true);
    } else {
      setIsApiReady(true);
    }

    return () => ws.close();
  }, []);

  // 2. 플레이어 초기화 및 곡 변경 로직
  useEffect(() => {
    if (!currentSong || !isApiReady) return;

    if (!playerRef.current) {
      // 플레이어 최초 생성
      playerRef.current = new (window as any).YT.Player('yt-player', {
        height: '360',
        width: '640',
        videoId: currentSong.videoId,
        playerVars: { 
          'autoplay': 1, 
          'controls': 0, 
          'disablekb': 1,
          'modestbranding': 1,
          'rel': 0
        },
        events: {
          'onReady': (event: any) => {
            setIsPlayerReady(true);
            event.target.playVideo();
            if (!needsInteraction) event.target.unMute();
          },
          'onStateChange': (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
            }
          },
          'onError': () => {
            if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
          }
        }
      });
    } else if (isPlayerReady && playerRef.current.loadVideoById) {
      // [수정] 플레이어가 준비된 상태에서만 메서드 호출 (getVideoData 에러 방지)
      const currentId = playerRef.current.getVideoData?.()?.video_id;
      if (currentId !== currentSong.videoId) {
        playerRef.current.loadVideoById(currentSong.videoId);
      }
    }
  }, [currentSong, isApiReady, isPlayerReady, needsInteraction]); // 의존성 추가

  const handleInteraction = () => {
    setNeedsInteraction(false);
    if (playerRef.current && typeof playerRef.current.unMute === 'function') {
      playerRef.current.unMute();
      playerRef.current.playVideo();
    }
  };

  if (!currentSong) return (
    <div className="h-screen bg-black flex items-center justify-center p-10 text-white font-black italic text-3xl">
      <Music className="animate-pulse mr-4" size={48} /> gummybot Jukebox Ready...
    </div>
  );

  return (
    <div className="h-screen bg-[#050505] text-white font-sans p-10 overflow-hidden relative">
      <AnimatePresence>
        {needsInteraction && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleInteraction}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-black mb-8 animate-bounce shadow-2xl">
              <Volume2 size={48} />
            </div>
            <h2 className="text-4xl font-black mb-4">Click to Start Audio</h2>
            <p className="text-gray-500 font-bold tracking-widest uppercase">Resume Playback</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-10 h-full max-w-7xl mx-auto">
        <div className="col-span-8 flex flex-col justify-center space-y-12">
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/20 blur-[120px] rounded-full group-hover:bg-emerald-500/30 transition-all duration-1000" />
            <div className="rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video relative z-10">
              <div id="yt-player" className="w-full h-full pointer-events-none" />
            </div>
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3 text-emerald-500 font-black text-xs uppercase tracking-[0.4em]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Now Performance
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-none line-clamp-2">{currentSong.title}</h1>
            <div className="flex items-center gap-4 text-gray-400 font-bold bg-white/5 w-fit px-6 py-3 rounded-2xl border border-white/5">
              <User size={20} className="text-emerald-500" />
              <span className="text-lg">Requested by {currentSong.requester}</span>
            </div>
          </div>
        </div>

        <div className="col-span-4 flex flex-col pt-20">
          <div className="bg-white/5 border border-white/5 rounded-[3rem] p-10 flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-10 shrink-0">
              <h3 className="text-2xl font-black flex items-center gap-3 italic">
                <ListMusic className="text-emerald-500" /> Next Tracks
              </h3>
              <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">Queue</span>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
              <AnimatePresence initial={false}>
                {queue.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50 py-32">
                    <AlertCircle size={48} strokeWidth={1} className="mb-4" />
                    <p className="font-bold italic">No more songs in line.</p>
                  </div>
                ) : (
                  queue.map((song, i) => (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={i} className="flex items-center gap-5 group">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 font-black text-emerald-500 border border-white/5 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate text-sm mb-1">{song.title}</p>
                        <p className="text-[10px] text-gray-500 font-black uppercase">{song.requester}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
