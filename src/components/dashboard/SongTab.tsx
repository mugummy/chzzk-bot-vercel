'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Trash2, ExternalLink, Music, Disc, Settings2, Save, DollarSign, Clock } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import NumberInput from '@/components/ui/NumberInput';

export default function SongTab({ onControl, onSend }: { onControl: (action: string, index?: number) => void, onSend: (msg: any) => void }) {
  const store = useBotStore();
  const { songs, settings } = store;
  const fallbackImg = "https://placehold.co/600x400/111/00ff94?text=gummybot+Music";

  const [mode, setMode] = useState<'all' | 'cooldown' | 'donation' | 'off'>('all');
  const [cooldown, setCooldown] = useState(30);
  const [minDonation, setMinDonation] = useState(1000);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (settings && !isLoaded.current) {
      setMode(settings.songRequestMode);
      setCooldown(settings.songRequestCooldown);
      setMinDonation(settings.minDonationAmount);
      isLoaded.current = true;
    }
  }, [settings]);

  const notify = (msg: string, type: 'success' | 'info' = 'success') => {
    if (typeof window !== 'undefined' && (window as any).ui?.notify) (window as any).ui.notify(msg, type);
  };

  const handleSaveSettings = () => {
    onSend({ type: 'updateSettings', data: { songRequestMode: mode, songRequestCooldown: cooldown, minDonationAmount: minDonation } });
    notify('신청곡 설정이 저장되었습니다.');
  };

  const handleControl = (action: string, index?: number) => {
    if (action !== 'remove' && !songs.current) return;
    onControl(action, index);
    if (action === 'togglePlayPause') notify(songs.isPlaying ? '노래를 일시정지했습니다.' : '노래를 재생합니다.', 'info');
    else if (action === 'skip') notify('노래를 스킵했습니다.', 'success');
    else if (action === 'playNext') notify('선택한 곡을 재생합니다.', 'success');
    else if (action === 'remove') notify('삭제되었습니다.', 'info');
  };

  return (
    <div className="space-y-10">
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 space-y-8 shadow-2xl">
        <header className="flex justify-between items-center">
          <h3 className="text-2xl font-black flex items-center gap-3 text-white"><Settings2 className="text-emerald-500" /> 신청곡 시스템 설정</h3>
          <button onClick={handleSaveSettings} className="bg-emerald-500 text-black px-8 py-3 rounded-2xl font-black hover:scale-105 transition-all flex items-center gap-2"><Save size={20} /> 저장</button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['all', 'cooldown', 'donation', 'off'].map((m) => (
            <button key={m} onClick={() => setMode(m as any)} className={`p-6 rounded-3xl border transition-all text-center font-bold uppercase tracking-widest ${mode === m ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}>
              {m === 'all' && '전체 허용'} {m === 'cooldown' && '쿨타임'} {m === 'donation' && '후원 전용'} {m === 'off' && '기능 끄기'}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {mode === 'cooldown' && (
            <motion.div key="cooldown" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-col md:flex-row md:items-center gap-6 bg-white/5 p-6 rounded-3xl border border-white/5 overflow-hidden">
              <div className="flex items-center gap-4 flex-1">
                <Clock className="text-emerald-500 shrink-0" />
                <div className="flex-1"><label className="text-xs font-black text-gray-500 uppercase tracking-widest">재신청 대기 시간 (초)</label><input type="range" min="10" max="300" step="10" value={cooldown} onChange={e => setCooldown(parseInt(e.target.value))} className="w-full accent-emerald-500 mt-2 h-1.5 bg-white/10 rounded-lg cursor-pointer" /></div>
              </div>
              <NumberInput value={cooldown} onChange={setCooldown} min={10} max={3600} step={10} unit="초" className="w-48" />
            </motion.div>
          )}
          {mode === 'donation' && (
            <motion.div key="donation" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-6 bg-white/5 p-6 rounded-3xl border border-white/5 overflow-hidden">
              <div className="flex items-center gap-4 flex-1">
                <DollarSign className="text-emerald-500 shrink-0" />
                <div className="flex-1"><label className="text-xs font-black text-gray-500 uppercase tracking-widest">최소 후원 금액 (치즈)</label><p className="text-sm text-gray-400 mt-1">설정한 금액 이상의 후원만 신청곡으로 인정됩니다.</p></div>
              </div>
              <NumberInput value={minDonation} onChange={setMinDonation} min={100} max={1000000} step={100} unit="치즈" className="w-56" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
          <div className="relative mb-10 z-10">
            <div className="absolute inset-0 bg-pink-500/20 blur-[100px] rounded-full group-hover:bg-pink-500/30 transition-all duration-700" />
            <motion.div animate={songs.isPlaying ? { rotate: 360 } : { rotate: 0 }} transition={songs.isPlaying ? { duration: 20, repeat: Infinity, ease: "linear" } : { duration: 0.5 }} className="relative z-10">
              <img src={songs.current?.thumbnail || fallbackImg} className="w-72 h-72 rounded-full object-cover shadow-[0_0_50px_rgba(0,0,0,0.5)] border-8 border-white/5 ring-1 ring-white/10" alt="Album Art" onError={(e) => { (e.target as HTMLImageElement).src = fallbackImg; }} />
            </motion.div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#0a0a0a] rounded-full border-4 border-white/5 z-20 flex items-center justify-center">
              <Disc className={`text-emerald-500 ${songs.isPlaying ? 'animate-spin-slow' : ''}`} size={32} />
            </div>
          </div>

          <div className="relative z-10 space-y-2 mb-10 max-w-lg">
            <h3 className="text-3xl font-black tracking-tighter line-clamp-1 text-white">{songs.current?.title || '현재 재생 중인 곡이 없습니다'}</h3>
            <p className="text-gray-500 font-bold text-lg uppercase tracking-widest">{songs.current?.requester ? `${songs.current.requester}님의 신청곡` : 'JUKEBOX READY'}</p>
          </div>
          
          <div className="relative z-10 flex flex-wrap justify-center gap-4">
            <button disabled={!songs.current} onClick={() => handleControl('togglePlayPause')} className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed">
              {songs.isPlaying ? <Pause fill="currentColor" size={32} /> : <Play fill="currentColor" size={32} />}
            </button>
            <button disabled={!songs.current} onClick={() => handleControl('skip')} className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><SkipForward size={32} /></button>
            <button onClick={() => window.open('/overlay/player?token=' + localStorage.getItem('chzzk_session_token'), '_blank')} className="px-10 bg-white/5 rounded-[2rem] border border-white/10 font-black text-white hover:bg-white/10 transition-all flex items-center gap-3"><ExternalLink size={20} className="text-emerald-500" /><span>플레이어 열기</span></button>
          </div>
        </div>

        <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col shadow-2xl">
          <div className="flex justify-between items-center mb-10"><h3 className="text-2xl font-black flex items-center gap-3 text-white"><Music className="text-emerald-500" /> 대기열 <span className="text-emerald-500/50">{songs.queue.length}</span></h3><span className="text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Next Tracks</span></div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
            {songs.queue.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50 py-20"><Music size={48} className="mb-4" /><p className="font-bold italic">대기 중인 곡이 없습니다.</p></div> : songs.queue.map((song, i) => (
              <div key={i} className="flex items-center gap-5 bg-white/[0.02] p-5 rounded-2xl border border-white/5 group hover:border-emerald-500/20 transition-all">
                <div className="relative shrink-0"><img src={song.thumbnail} className="w-14 h-14 rounded-xl object-cover" /><div className="absolute -top-2 -left-2 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-black text-[10px] font-black">{i + 1}</div></div>
                <div className="flex-1 min-w-0"><p className="font-bold text-white truncate text-sm mb-1">{song.title}</p><p className="text-[10px] text-gray-500 font-black uppercase">{song.requester}</p></div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => handleControl('playNext', i)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg"><Play size={18} /></button><button onClick={() => handleControl('remove', i)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={18} /></button></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}