'use client';

import { useEffect, useState, useRef } from 'react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, SkipForward, ListMusic, Volume2, AlertCircle, Play, Pause, Volume1, VolumeX } from 'lucide-react';

export default function OverlayPlayer() {
  const store = useBotStore();
  const currentSong = store.songs.current;
  const queue = store.songs.queue;
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const playerRef = useRef<any>(null);

  // 1. WebSocket 및 YouTube API 로드
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
      const data = JSON.parse(e.data);
      if (data.type === 'songStateUpdate' || data.type === 'connectResult') {
        store.updateSongs(data.payload || { queue: [], currentSong: null });
        if (data.payload.isPlaying !== undefined) setIsPlaying(data.payload.isPlaying);
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

  // 2. 플레이어 제어 로직
  useEffect(() => {
    // [중요] videoId가 없으면 절대 실행하지 않음
    if (!isReady || !currentSong || !currentSong.videoId || !(window as any).YT) return;

    const loadVideo = () => {
      if (!playerRef.current) {
        try {
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
                event.target.setVolume(volume);
                if (!needsInteraction) {
                  event.target.unMute();
                  event.target.playVideo();
                }
                setIsPlaying(true);
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
        } catch (e) { console.error(e); }
      } else {
        if (typeof playerRef.current.loadVideoById === 'function') {
          const currentId = playerRef.current.getVideoData?.()?.video_id;
          if (currentId !== currentSong.videoId) {
            playerRef.current.loadVideoById(currentSong.videoId);
            setIsPlaying(true);
          } else if (store.songs.isPlaying) {
            playerRef.current.playVideo();
          }
        }
      }
    };

    loadVideo();
  }, [isReady, currentSong]);

  // [신규] 컨트롤러 액션
  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      socket?.send(JSON.stringify({ type: 'controlMusic', action: 'togglePlayPause' })); // 서버 상태 동기화
    } else {
      playerRef.current.playVideo();
      socket?.send(JSON.stringify({ type: 'controlMusic', action: 'togglePlayPause' }));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkip = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'controlMusic', action: 'skip' }));
    }
  };

  const handleVolume = (e: any) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    if (playerRef.current) playerRef.current.setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      playerRef.current?.unMute();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleInteraction = () => {
    setNeedsInteraction(false);
    if (playerRef.current) {
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
              <div id="yt-player" className="w-full h-full" />
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div>
              <h1 className="text-5xl font-black tracking-tighter leading-none line-clamp-1 mb-2">{currentSong.title}</h1>
              <p className="text-gray-500 font-bold text-lg flex items-center gap-2"><User size={18} className="text-emerald-500"/> Requested by {currentSong.requester}</p>
            </div>

            {/* [신규] 플레이어 컨트롤러 UI */}
            <div className="flex items-center gap-6 bg-white/5 p-4 rounded-[2rem] border border-white/5 backdrop-blur-md w-fit">
              <button onClick={togglePlay} className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-black hover:scale-110 transition-all shadow-lg shadow-emerald-500/20">
                {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
              </button>
              <button onClick={handleSkip} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all">
                <SkipForward size={24} />
              </button>
              
              <div className="h-8 w-[1px] bg-white/10 mx-2" />
              
              <div className="flex items-center gap-3 group/vol">
                <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
                  {isMuted || volume === 0 ? <VolumeX size={24} /> : (volume < 50 ? <Volume1 size={24} /> : <Volume2 size={24} />)}
                </button>
                <input 
                  type="range" min="0" max="100" value={isMuted ? 0 : volume} onChange={handleVolume}
                  className="w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 opacity-50 group-hover/vol:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4 flex flex-col pt-20">
          <div className="bg-white/5 border border-white/5 rounded-[3rem] p-10 flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-10 shrink-0">
              <h3 className="text-2xl font-black flex items-center gap-3 italic"><ListMusic className="text-emerald-500" /> Queue</h3>
              <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">{queue.length}</span>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
              {queue.map((song, i) => (
                <div key={i} className="flex items-center gap-5 group">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 font-black text-emerald-500 border border-white/5 group-hover:bg-emerald-500 group-hover:text-black transition-all">{i + 1}</div>
                  <div className="flex-1 min-w-0"><p className="font-bold text-white truncate text-sm mb-1">{song.title}</p><p className="text-[10px] text-gray-500 font-black uppercase">{song.requester}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
