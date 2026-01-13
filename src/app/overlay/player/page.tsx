'use client';

import { useEffect, useState, useRef } from 'react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, SkipForward, SkipBack, ListMusic, Volume2, AlertCircle, Play, Pause } from 'lucide-react';

export default function OverlayPlayer() {
  const store = useBotStore();
  const currentSong = store.songs.current;
  const queue = store.songs.queue;
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const playerRef = useRef<any>(null);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    const bc = new BroadcastChannel('gummybot_player_channel');
    bc.postMessage('new_player_opened');
    bc.onmessage = (event) => {
      if (event.data === 'new_player_opened') {
        alert('플레이어가 이미 실행 중입니다.');
        window.close();
      }
    };

    const ws = new WebSocket(`wss://web-production-19eef.up.railway.app/?token=${token}`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'connect' }));
      ws.send(JSON.stringify({ type: 'requestData' }));
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.payload && (data.type === 'songStateUpdate' || data.type === 'connectResult')) {
          store.updateSongs(data.payload);
          if (data.payload.isPlaying !== undefined) setIsPlaying(data.payload.isPlaying);
        }
        if (data.type === 'playerControl') {
          if (data.action === 'play') safePlay();
          if (data.action === 'pause') safePause();
        }
      } catch (err) {}
    };
    setSocket(ws);

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = () => setIsReady(true);
    } else {
      setIsReady(true);
    }

    return () => { ws.close(); bc.close(); if(retryTimeout.current) clearTimeout(retryTimeout.current); };
  }, []);

  const safePlay = () => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const safePause = () => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
  };

  // [핵심] Video ID 검증 및 재생 로직
  useEffect(() => {
    // 1. 기본 조건 체크
    if (!isReady || !(window as any).YT) return;

    // 2. 노래가 없으면 플레이어 정지 및 리턴
    if (!currentSong || !currentSong.videoId) {
        if (playerRef.current) {
            try { playerRef.current.stopVideo(); } catch(e) {}
        }
        return;
    }

    // 3. Video ID 유효성 정밀 체크 (길이 11자리)
    if (currentSong.videoId.length !== 11) {
        console.warn(`[Player] Invalid ID: ${currentSong.videoId} -> Skipping`);
        if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
        return;
    }

    const initPlayer = () => {
      try {
        if (!playerRef.current) {
          playerRef.current = new (window as any).YT.Player('yt-player', {
            height: '100%',
            width: '100%',
            videoId: currentSong.videoId,
            playerVars: { 'autoplay': 1, 'controls': 0, 'disablekb': 1, 'modestbranding': 1, 'rel': 0 },
            events: {
              'onReady': (event: any) => {
                event.target.setVolume(volume);
                if (!needsInteraction) {
                  event.target.unMute();
                  event.target.playVideo();
                }
                setIsPlaying(true);
              },
              'onStateChange': (event: any) => {
                if (event.data === 0) { 
                  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
                }
                setIsPlaying(event.data === 1);
              },
              'onError': () => {
                console.error('[Player] Playback Error - Auto Skipping');
                if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
              }
            }
          });
        } else {
          if (typeof playerRef.current.loadVideoById === 'function') {
            const currentId = playerRef.current.getVideoData?.()?.video_id;
            if (currentId !== currentSong.videoId) {
              playerRef.current.loadVideoById(currentSong.videoId);
              setIsPlaying(true);
            } else if (store.songs.isPlaying) {
              const state = playerRef.current.getPlayerState();
              if (state !== 1 && state !== 3) playerRef.current.playVideo();
            }
          } else {
            retryTimeout.current = setTimeout(initPlayer, 1000);
          }
        }
      } catch (e) {
        retryTimeout.current = setTimeout(initPlayer, 1000);
      }
    };

    initPlayer();
  }, [isReady, currentSong]);

  const togglePlay = () => {
    if (!currentSong) return;
    if (isPlaying) {
      safePause();
      socket?.send(JSON.stringify({ type: 'controlMusic', action: 'togglePlayPause' }));
    } else {
      safePlay();
      socket?.send(JSON.stringify({ type: 'controlMusic', action: 'togglePlayPause' }));
    }
  };

  const handleSkip = () => {
    if (!currentSong) return;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
  };

  const handlePrev = () => {
    if (!currentSong) return;
    if (playerRef.current) playerRef.current.seekTo(0);
  };

  const handleInteraction = () => {
    setNeedsInteraction(false);
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.unMute();
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  if (!currentSong) return <div className="h-screen bg-black flex items-center justify-center text-white text-3xl font-black"><Music className="animate-pulse mr-4"/> Jukebox Ready...</div>;

  return (
    <div className="h-screen bg-[#050505] text-white font-sans p-10 overflow-hidden relative">
      <AnimatePresence>
        {needsInteraction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleInteraction} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer">
            <Play size={64} className="mb-4 text-emerald-500 animate-bounce" />
            <h2 className="text-4xl font-black">Click to Start</h2>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-10 h-full max-w-7xl mx-auto">
        <div className="col-span-8 flex flex-col justify-center space-y-12">
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/20 blur-[120px] rounded-full group-hover:bg-emerald-500/30 transition-all duration-1000" />
            <div className="rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video relative z-10">
              <div id="yt-player" className="w-full h-full" />
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div>
              <h1 className="text-5xl font-black tracking-tighter leading-none line-clamp-1 mb-2">{currentSong.title}</h1>
              <p className="text-gray-500 font-bold text-lg flex items-center gap-2"><User size={18} className="text-emerald-500"/> Requested by {currentSong.requester}</p>
            </div>

            <div className="flex items-center gap-6 bg-white/5 p-4 rounded-[2rem] border border-white/5 backdrop-blur-md w-fit">
              <button onClick={handlePrev} disabled={!currentSong} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><SkipBack size={24} /></button>
              <button onClick={togglePlay} disabled={!currentSong} className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-black hover:scale-110 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed">
                {isPlaying ? <Pause fill="currentColor" size={28} /> : <Play fill="currentColor" size={28} />}
              </button>
              <button onClick={handleSkip} disabled={!currentSong} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><SkipForward size={24} /></button>
              <div className="h-8 w-[1px] bg-white/10 mx-2" />
              <input type="range" min="0" max="100" value={volume} onChange={(e) => { setVolume(parseInt(e.target.value)); playerRef.current?.setVolume(parseInt(e.target.value)); }} className="w-24 h-1.5 bg-gray-700 rounded-lg accent-emerald-500" />
            </div>
          </div>
        </div>

        <div className="col-span-4 flex flex-col pt-20">
          {/* Queue UI 생략 (기존 유지) */}
        </div>
      </div>
    </div>
  );
}