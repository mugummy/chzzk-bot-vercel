'use client';

import { useEffect, useState, useRef } from 'react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, SkipForward, ListMusic, Volume2, AlertCircle, Play } from 'lucide-react';

export default function OverlayPlayer() {
  const store = useBotStore();
  const currentSong = store.songs.current;
  const queue = store.songs.queue;
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [playerState, setPlayerState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const playerRef = useRef<any>(null);

  // 1. WebSocket 연결 및 API 로드
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    const ws = new WebSocket(`wss://web-production-19eef.up.railway.app/?token=${token}`);
    
    ws.onopen = () => {
      console.log('[Player] Connected');
      ws.send(JSON.stringify({ type: 'connect' }));
      // [핵심] 연결 즉시 플레이어의 존재를 서버에 알림 (서버가 이를 인지하고 자동 재생 트리거 가능)
      // 현재 서버에는 이 핸들러가 없지만, requestData로 상태 동기화
      ws.send(JSON.stringify({ type: 'requestData' }));
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'songStateUpdate') store.updateSongs(data.payload);
      if (data.type === 'connectResult') store.updateSongs(data.payload || { queue: [], currentSong: null });
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

  // 2. 노래 변경 감지 및 플레이어 제어
  useEffect(() => {
    if (!isApiReady || !currentSong) {
      if (!currentSong) setPlayerState('idle');
      return;
    }

    const loadOrPlay = () => {
      if (!playerRef.current) {
        // 플레이어 최초 생성
        setPlayerState('loading');
        playerRef.current = new (window as any).YT.Player('yt-player', {
          height: '100%',
          width: '100%',
          videoId: currentSong.videoId,
          playerVars: { 
            'autoplay': 1, 
            'controls': 0, 
            'disablekb': 1,
            'modestbranding': 1,
            'rel': 0,
            'showinfo': 0
          },
          events: {
            'onReady': (event: any) => {
              setPlayerState('playing');
              event.target.playVideo();
              // [중요] 자동 재생 정책으로 소리가 안 나면 인터랙션 유도
              if (event.target.isMuted() || event.target.getPlayerState() !== 1) {
                setNeedsInteraction(true);
              }
            },
            'onStateChange': (event: any) => {
              if (event.data === (window as any).YT.PlayerState.ENDED) {
                if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
              }
              // 재생 중(1)이면 인터랙션 배너 제거
              if (event.data === 1) setNeedsInteraction(false);
            },
            'onError': () => {
              if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
            }
          }
        });
      } else {
        // 이미 있으면 곡만 변경
        const currentId = playerRef.current.getVideoData?.()?.video_id;
        if (currentId !== currentSong.videoId) {
          setPlayerState('loading');
          playerRef.current.loadVideoById(currentSong.videoId);
          setPlayerState('playing');
        }
      }
    };

    loadOrPlay();
  }, [currentSong, isApiReady]); // currentSong이 바뀌면 즉시 실행됨

  const handleInteraction = () => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.unMute();
      playerRef.current.playVideo();
      setNeedsInteraction(false);
    }
  };

  // [UI 1] 대기 화면 (노래 없음)
  if (!currentSong) return (
    <div className="h-screen bg-black flex items-center justify-center p-10 text-white font-black italic text-3xl">
      <Music className="animate-pulse mr-4" size={48} /> gummybot Jukebox Ready...
    </div>
  );

  // [UI 2] 재생 화면
  return (
    <div className="h-screen bg-[#050505] text-white font-sans p-10 overflow-hidden relative">
      <AnimatePresence>
        {needsInteraction && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleInteraction}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-black mb-8 animate-bounce shadow-2xl">
              <Play size={48} fill="currentColor" />
            </div>
            <h2 className="text-4xl font-black mb-4">Click to Enable Sound</h2>
            <p className="text-gray-500 font-bold tracking-widest uppercase">Autoplay Policy Restriction</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-10 h-full max-w-7xl mx-auto">
        <div className="col-span-8 flex flex-col justify-center space-y-12">
          <div className="relative w-full aspect-video rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-black group">
            <div id="yt-player" className="w-full h-full" />
            {/* Overlay to prevent direct interaction with iframe */}
            <div className="absolute inset-0 z-10 pointer-events-none" />
          </div>

          <div className="space-y-4">
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