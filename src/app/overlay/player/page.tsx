'use client';

import { useEffect, useState, useRef } from 'react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, SkipForward, SkipBack, ListMusic, Volume2, AlertCircle, Play, Pause, Volume1, VolumeX, Disc } from 'lucide-react';

/**
 * OverlayPlayer: OBS 방송 화면 전용 하이엔드 플레이어
 * 요약이나 생략 없는 100% 전체 소스 코드입니다.
 */
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
  const lastIdRef = useRef<string | null>(null);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);

  // 1. 시스템 연결 및 초기화
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    // 중복 탭 실행 방지
    const bc = new BroadcastChannel('gummybot_player_channel');
    bc.postMessage('new_player_opened');
    bc.onmessage = (event) => {
      if (event.data === 'new_player_opened') {
        alert('플레이어가 이미 다른 탭에서 실행 중입니다.');
        window.close();
      }
    };

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`wss://web-production-19eef.up.railway.app/?token=${token}`);
    
    ws.onopen = () => {
      console.log('[Player] Connected to gummybot Server');
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
          if (data.action === 'play') safeControl('play');
          if (data.action === 'pause') safeControl('pause');
        }
      } catch (err) {}
    };
    setSocket(ws);

    // 유튜브 API 로드
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
      if(retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, []);

  // 2. 안전한 메서드 호출 제어
  const safeControl = (action: 'play' | 'pause' | 'skip') => {
    if (!playerRef.current) return;
    try {
      if (action === 'play' && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
        setIsPlaying(true);
      } else if (action === 'pause' && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      }
    } catch (e) {
      console.error('[Player] Control Error:', e);
    }
  };

  // 3. 재생 로직 (동일 영상 체크 및 자동 재생)
  useEffect(() => {
    if (!isReady || !currentSong?.videoId || !(window as any).YT) return;

    if (lastIdRef.current === currentSong.videoId) {
        // 영상은 같은데 재생 상태만 바뀐 경우 대응
        if (store.songs.isPlaying && typeof playerRef.current?.playVideo === 'function') {
            playerRef.current.playVideo();
        }
        return;
    }

    lastIdRef.current = currentSong.videoId;

    const initOrLoad = () => {
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
          if (typeof playerRef.current.loadVideoById === 'function') {
            playerRef.current.loadVideoById(currentSong.videoId);
            setIsPlaying(true);
          } else {
            retryTimeout.current = setTimeout(initOrLoad, 1000);
          }
        }
      } catch (e) {
        retryTimeout.current = setTimeout(initOrLoad, 1000);
      }
    };

    initOrLoad();
  }, [isReady, currentSong]);

  const handleInteraction = () => {
    setNeedsInteraction(false);
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.unMute();
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      socket?.send(JSON.stringify({ type: 'controlMusic', action: 'togglePlayPause' }));
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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(val);
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleInteraction} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-black mb-8 animate-bounce shadow-2xl"><Play size={48} fill="currentColor" /></div>
            <h2 className="text-4xl font-black mb-4 tracking-tighter">화면을 클릭하여 소리를 활성화하세요</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest">YouTube Autoplay Policy</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-10 h-full max-w-7xl mx-auto">
        {/* Left: Player Section */}
        <div className="col-span-8 flex flex-col justify-center space-y-12">
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/20 blur-[120px] rounded-full group-hover:bg-emerald-500/30 transition-all duration-1000" />
            <div className="rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video relative z-10">
              <div id="yt-player" className="w-full h-full" />
            </div>
          </div>

          <div className="space-y-8 relative z-10">
            <div>
              <div className="flex items-center gap-3 text-emerald-500 font-black text-xs uppercase tracking-[0.4em] mb-4">
                {isPlaying ? <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> : <span className="w-2 h-2 rounded-full bg-red-500" />}
                {isPlaying ? 'Now Performing' : 'Playback Paused'}
              </div>
              <h1 className="text-6xl font-black tracking-tighter leading-none line-clamp-1 mb-4">{currentSong.title}</h1>
              <div className="flex items-center gap-4 text-gray-400 font-bold bg-white/5 w-fit px-6 py-3 rounded-2xl border border-white/5 shadow-xl">
                <User size={20} className="text-emerald-500" />
                <span className="text-lg">Requested by {currentSong.requester}</span>
              </div>
            </div>

            {/* Player Controls */}
            <div className="flex items-center gap-6 bg-white/5 p-5 rounded-[2.5rem] border border-white/5 backdrop-blur-md w-fit shadow-2xl">
              <button onClick={() => playerRef.current?.seekTo(0)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <SkipBack size={24} />
              </button>
              <button onClick={togglePlay} className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-xl shadow-emerald-500/20">
                {isPlaying ? <Pause fill="currentColor" size={28} /> : <Play fill="currentColor" size={28} />}
              </button>
              <button onClick={handleSkip} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <SkipForward size={24} />
              </button>
              
              <div className="h-10 w-[1px] bg-white/10 mx-2" />
              
              <div className="flex items-center gap-4 group/vol px-2">
                <div onClick={() => setIsMuted(!isMuted)} className="cursor-pointer text-emerald-500">
                  {isMuted || volume === 0 ? <VolumeX size={24}/> : (volume < 50 ? <Volume1 size={24}/> : <Volume2 size={24}/>)}
                </div>
                <input 
                  type="range" min="0" max="100" value={isMuted ? 0 : volume} 
                  onChange={handleVolumeChange}
                  className="w-32 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Queue Sidebar */}
        <div className="col-span-4 flex flex-col pt-20">
          <div className="bg-white/5 border border-white/5 rounded-[3.5rem] p-10 flex-1 flex flex-col overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-10 shrink-0">
              <h3 className="text-2xl font-black flex items-center gap-3 italic">
                <ListMusic className="text-emerald-500" /> Next Tracks
              </h3>
              <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-500/50">{queue.length} Songs</span>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
              <AnimatePresence initial={false}>
                {queue.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50 py-32">
                    <AlertCircle size={48} strokeWidth={1} className="mb-4" />
                    <p className="font-bold italic">Queue is empty.</p>
                  </div>
                ) : (
                  queue.map((song, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
                      key={song.videoId + i} className="flex items-center gap-5 group"
                    >
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 font-black text-emerald-500 border border-white/5 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate text-sm mb-1">{song.title}</p>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">{song.requester}</p>
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