'use client';

import { useEffect, useState, useRef } from 'react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, SkipForward, SkipBack, ListMusic, Volume2, AlertCircle, Play, Pause, Trash2 } from 'lucide-react';

export default function OverlayPlayer() {
  const store = useBotStore();
  const currentSong = store.songs.current;
  const queue = store.songs.queue;
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [history, setHistory] = useState<any[]>([]);
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

  // [핵심] 자가 치유(Self-Healing) 재생 로직
  useEffect(() => {
    if (!isReady || !currentSong?.videoId || !(window as any).YT) return;

    setHistory(prev => {
      const last = prev[prev.length - 1];
      if (last?.videoId !== currentSong.videoId) return [...prev, currentSong];
      return prev;
    });

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
                if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
              }
            }
          });
        } else {
          // [보강] 메서드가 없으면 에러가 나지 않게 체크하고 재시도
          if (typeof playerRef.current.loadVideoById === 'function') {
            const currentId = playerRef.current.getVideoData?.()?.video_id;
            if (currentId !== currentSong.videoId) {
              playerRef.current.loadVideoById(currentSong.videoId);
              setIsPlaying(true);
            } else if (store.songs.isPlaying) {
              // 이미 로드된 상태에서 서버가 재생 중이라면 재생 시도
              const state = playerRef.current.getPlayerState();
              if (state !== 1 && state !== 3) playerRef.current.playVideo();
            }
          } else {
            // 메서드가 아직 없다면 1초 뒤 재시도
            console.warn('[Player] API Not Ready - Retrying...');
            retryTimeout.current = setTimeout(initPlayer, 1000);
          }
        }
      } catch (e) {
        console.error('[Player] Init Error - Retrying...', e);
        retryTimeout.current = setTimeout(initPlayer, 1000);
      }
    };

    initPlayer();
  }, [isReady, currentSong]);

  const togglePlay = () => {
    if (isPlaying) {
      safePause();
      socket?.send(JSON.stringify({ type: 'controlMusic', action: 'togglePlayPause' }));
    } else {
      safePlay();
      socket?.send(JSON.stringify({ type: 'controlMusic', action: 'togglePlayPause' }));
    }
  };

  const handleSkip = () => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
  };

  const handlePrev = () => {
    if (playerRef.current) playerRef.current.seekTo(0);
  };

  const handleQueueRemove = (index: number) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'controlMusic', action: 'remove', index }));
    }
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
              <button onClick={handlePrev} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"><SkipBack size={24} /></button>
              <button onClick={togglePlay} className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-black hover:scale-110 transition-all shadow-lg shadow-emerald-500/20">
                {isPlaying ? <Pause fill="currentColor" size={28} /> : <Play fill="currentColor" size={28} />}
              </button>
              <button onClick={handleSkip} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"><SkipForward size={24} /></button>
              <div className="h-8 w-[1px] bg-white/10 mx-2" />
              <input type="range" min="0" max="100" value={volume} onChange={(e) => { setVolume(parseInt(e.target.value)); playerRef.current?.setVolume(parseInt(e.target.value)); }} className="w-24 h-1.5 bg-gray-700 rounded-lg accent-emerald-500" />
            </div>
          </div>
        </div>

        <div className="col-span-4 flex flex-col pt-20">
          <div className="bg-white/5 border border-white/5 rounded-[3rem] p-10 flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-10 shrink-0"><h3 className="text-2xl font-black flex items-center gap-3 italic"><ListMusic className="text-emerald-500" /> Queue</h3><span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">{queue.length} Songs</span></div>
            <div className="flex-1 space-y-4 overflow-y-auto pr-4 custom-scrollbar">
              {queue.map((song, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl group hover:bg-white/10 transition-all">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0 font-black text-emerald-500 border border-white/5">{i + 1}</div>
                  <div className="flex-1 min-w-0"><p className="font-bold text-white truncate text-xs mb-1">{song.title}</p><p className="text-[9px] text-gray-500 font-black uppercase">{song.requester}</p></div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => handleQueueRemove(i)} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={14}/></button></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
