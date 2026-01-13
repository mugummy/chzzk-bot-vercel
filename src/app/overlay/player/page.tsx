'use client';

import { useEffect, useState, useRef } from 'react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, SkipForward, ListMusic, Volume2, AlertCircle, Play, Pause } from 'lucide-react';

export default function OverlayPlayer() {
  const store = useBotStore();
  const currentSong = store.songs.current;
  const queue = store.songs.queue;
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);

  // 1. WebSocket 및 YouTube API 로드
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    // 중복 실행 방지
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
      const data = JSON.parse(e.data);
      if (data.type === 'songStateUpdate' || data.type === 'connectResult') {
        store.updateSongs(data.payload || { queue: [], currentSong: null });
      }
      if (data.type === 'playerControl') {
        if (data.action === 'play') {
          playerRef.current?.playVideo();
          setIsPlaying(true);
        }
        if (data.action === 'pause') {
          playerRef.current?.pauseVideo();
          setIsPlaying(false);
        }
      }
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

    return () => {
      ws.close();
      bc.close();
    };
  }, []);

  // [핵심] 재생 로직 강화 (첫 곡 자동 재생 포함)
  useEffect(() => {
    if (!isReady || !currentSong || !(window as any).YT) return;

    const loadVideo = () => {
      // 플레이어 객체 생성
      if (!playerRef.current) {
        playerRef.current = new (window as any).YT.Player('yt-player', {
          height: '100%',
          width: '100%',
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
              event.target.playVideo();
              setIsPlaying(true);
              if (!needsInteraction) event.target.unMute();
            },
            'onStateChange': (event: any) => {
              if (event.data === (window as any).YT.PlayerState.ENDED) {
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
        // 이미 플레이어가 있다면 ID 비교 후 로드
        const currentId = playerRef.current.getVideoData?.()?.video_id;
        if (currentId !== currentSong.videoId) {
          playerRef.current.loadVideoById(currentSong.videoId);
          setIsPlaying(true);
        } else {
            // [추가] 같은 곡이지만 재생이 멈춰있다면 다시 재생 시도 (첫 곡 등)
            const state = playerRef.current.getPlayerState();
            if (state !== 1) playerRef.current.playVideo();
        }
      }
    };

    loadVideo();
  }, [isReady, currentSong]); // currentSong이 바뀌면 무조건 실행

  const handleInteraction = () => {
    setNeedsInteraction(false);
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.unMute();
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  if (!currentSong) return (
    <div className="h-screen bg-black flex items-center justify-center p-10 text-white font-black italic text-3xl">
      <Music className="animate-pulse mr-4" size={48} /> Jukebox Ready...
    </div>
  );

  return (
    <div className="h-screen bg-[#050505] text-white font-sans p-10 overflow-hidden relative">
      <AnimatePresence>
        {needsInteraction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleInteraction} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-black mb-8 animate-bounce shadow-2xl"><Play size={48} fill="currentColor" /></div>
            <h2 className="text-4xl font-black mb-4">Click to Start</h2>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-10 h-full max-w-7xl mx-auto">
        <div className="col-span-8 flex flex-col justify-center space-y-12">
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/20 blur-[120px] rounded-full group-hover:bg-emerald-500/30 transition-all duration-1000" />
            <div className="rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video relative z-10">
              {/* [중요] key를 변경하여 DOM을 강제로 리셋하지 않고, 내부 로직으로 제어 */}
              <div id="yt-player" className="w-full h-full" />
            </div>
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3 text-emerald-500 font-black text-xs uppercase tracking-[0.4em]">
              {isPlaying ? <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> : <span className="w-2 h-2 rounded-full bg-red-500" />}
              {isPlaying ? 'Now Playing' : 'Paused'}
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-none line-clamp-2">{currentSong.title}</h1>
            <div className="flex items-center gap-4 text-gray-400 font-bold bg-white/5 w-fit px-6 py-3 rounded-2xl border border-white/5"><User size={20} className="text-emerald-500" /><span className="text-lg">Requested by {currentSong.requester}</span></div>
          </div>
        </div>

        <div className="col-span-4 flex flex-col pt-20">
          <div className="bg-white/5 border border-white/5 rounded-[3rem] p-10 flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-10 shrink-0"><h3 className="text-2xl font-black flex items-center gap-3 italic"><ListMusic className="text-emerald-500" /> Queue</h3><span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">{queue.length} Songs</span></div>
            <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
              {queue.map((song, i) => (
                <div key={i} className="flex items-center gap-5 group"><div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 font-black text-emerald-500 border border-white/5 group-hover:bg-emerald-500 group-hover:text-black transition-all">{i + 1}</div><div className="flex-1 min-w-0"><p className="font-bold text-white truncate text-sm mb-1">{song.title}</p><p className="text-[10px] text-gray-500 font-black uppercase">{song.requester}</p></div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}