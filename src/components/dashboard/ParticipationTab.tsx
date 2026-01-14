'use client';

import { useState, useEffect } from 'react';
import { Users, Play, StopCircle, Trash2, UserPlus, UserCheck, Save, Trophy, Terminal, UserCog, Minus, Plus } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function ParticipationTab({ onSend }: { onSend: (msg: any) => void }) {
  const store = useBotStore();
  const { participation } = store;

  const [max, setMax] = useState(participation.max || 10);

  useEffect(() => {
    if (participation.max) setMax(participation.max);
  }, [participation.max]);

  const notify = (msg: string, type: 'success' | 'info' = 'success') => {
    if (typeof window !== 'undefined' && (window as any).ui?.notify) (window as any).ui.notify(msg, type);
  };

  const handleToggle = () => {
    onSend({ type: 'toggleParticipation' });
    notify(participation.isActive ? '참여 모집을 종료했습니다.' : '참여 모집을 시작합니다.', participation.isActive ? 'info' : 'success');
  };

  const handleApprove = (id: string) => {
    onSend({ type: 'moveToParticipants', data: { userIdHash: id } });
    notify('참여자로 확정되었습니다.');
  };

  const handleClear = () => {
    if (confirm('모든 명단을 초기화할까요?')) {
      onSend({ type: 'clearParticipants' });
      notify('모든 명단이 초기화되었습니다.', 'info');
    }
  };
  
  const handleSaveSettings = () => {
    onSend({ type: 'updateMaxParticipants', payload: { count: max } });
    notify('인원 설정이 적용되었습니다.');
  };

  const handleRemove = (id: string, nickname: string) => {
    onSend({ type: 'removeParticipant', data: { userIdHash: id } });
    notify(`${nickname}님을 명단에서 제거했습니다.`, 'info');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 1;
    setMax(val);
  };

  const adjustMax = (delta: number) => {
    const newVal = max + delta;
    if (newVal < 1) return;
    setMax(newVal);
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* 가이드 영역 */}
        <div className="xl:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col justify-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3 text-emerald-500 mb-2">
              <Terminal size={24} />
              <h3 className="text-xl font-black uppercase tracking-widest">Command Guide</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GuideItem cmd="!시참" desc="참여 방법 및 인원 현황 안내" />
              <GuideItem cmd="!시참 참여" desc="대기열에 내 닉네임 등록" highlight />
              <GuideItem cmd="!시참 현황" desc="현재 참여/대기 인원 확인" />
              <GuideItem cmd="!시참 대기열" desc="현재 대기 중인 명단 확인" />
            </div>
          </div>
          <UserCog className="absolute -bottom-10 -right-10 text-white/[0.02] rotate-12" size={300} />
        </div>

        {/* 인원 설정 영역 */}
        <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col justify-center shadow-2xl">
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest">Max Participants</h4>
                <p className="text-2xl font-black text-white">최대 인원 설정</p>
              </div>
              
              {/* [수정] 커스텀 숫자 입력기 */}
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-[1.5rem] border border-white/10">
                <button onClick={() => adjustMax(-1)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white">
                  <Minus size={18} />
                </button>
                <div className="flex items-baseline gap-1 min-w-[4rem] justify-center">
                  <input 
                    type="number" value={max} onChange={handleInputChange}
                    className="bg-transparent text-3xl font-black text-emerald-500 text-center w-16 outline-none"
                  />
                  <span className="text-xs font-bold text-gray-500">명</span>
                </div>
                <button onClick={() => adjustMax(1)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full hover:bg-emerald-500 hover:text-black active:scale-95 transition-all text-white">
                  <Plus size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              <input 
                type="range" min="1" max="20" step="1" 
                value={max > 20 ? 20 : max} 
                onChange={e => setMax(parseInt(e.target.value))} 
                className="w-full accent-emerald-500 h-2 bg-white/5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-black text-gray-600 uppercase tracking-widest">
                <span>1 Person</span>
                <span>Slider Limit: 20 People</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleSaveSettings} className="flex-1 bg-white text-black py-5 rounded-2xl font-black hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-xl">
                <Save size={20} /> 설정 저장
              </button>
              <button onClick={handleToggle} className={`flex-[1.5] py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all ${participation.isActive ? 'bg-red-500 text-white' : 'bg-emerald-500 text-black shadow-emerald-500/20 shadow-lg hover:scale-[1.02]'}`}>
                {participation.isActive ? <StopCircle size={20}/> : <Play size={20} fill="currentColor"/>}
                <span>{participation.isActive ? '모집 종료' : '모집 시작'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col min-h-[500px] shadow-xl">
            <div className="flex justify-between items-center mb-8 shrink-0">
              <h4 className="text-xl font-black flex items-center gap-3 text-white"><UserPlus className="text-cyan-500" size={24}/> 승인 대기열</h4>
              <span className="bg-cyan-500/10 text-cyan-500 px-4 py-1 rounded-full text-xs font-black">{participation.queue.length}</span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {participation.queue.map((p) => (
                  <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:20}} key={p.userIdHash} className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-cyan-500/30 transition-all">
                    <span className="font-black text-lg text-white">{p.nickname}</span>
                    <button onClick={() => handleApprove(p.userIdHash)} className="px-6 py-2.5 bg-cyan-500 text-black font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg text-xs">승인</button>
                  </motion.div>
                ))}
                {participation.queue.length === 0 && <div className="h-full flex flex-col items-center justify-center text-gray-700 py-32 italic font-bold">대기자가 없습니다.</div>}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col min-h-[500px] shadow-xl">
            <div className="flex justify-between items-center mb-8 shrink-0">
              <h4 className="text-xl font-black flex items-center gap-3 text-white"><UserCheck className="text-emerald-500" size={24}/> 확정 명단</h4>
              <span className="bg-emerald-500/10 text-emerald-500 px-4 py-1 rounded-full text-xs font-black">{participation.active.length}/{max}</span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {participation.active.map((p, i) => (
                  <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} key={p.userIdHash} className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500 text-black rounded-xl flex items-center justify-center font-black text-xs">{i+1}</div>
                      <span className="font-black text-lg text-emerald-400">{p.nickname}</span>
                    </div>
                    <button onClick={() => handleRemove(p.userIdHash, p.nickname)} className="p-3 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                  </motion.div>
                ))}
                {participation.active.length === 0 && <div className="h-full flex flex-col items-center justify-center text-gray-700 py-32 italic font-bold">참여자가 없습니다.</div>}
              </AnimatePresence>
            </div>
            <button onClick={handleClear} className="w-full mt-6 py-4 rounded-2xl bg-white/5 text-gray-500 font-bold hover:bg-red-500/10 hover:text-red-500 transition-all text-sm border border-white/5">전체 초기화</button>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col shadow-2xl">
          <div className="flex items-center gap-3 mb-10">
            <Trophy size={28} className="text-amber-500" />
            <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white">Hall of Fame</h4>
          </div>
          <div className="space-y-4">
            {participation.ranking?.slice(0, 10).map((rank, i) => (
              <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay: i * 0.05}} key={i} className={`flex items-center justify-between p-6 rounded-[2rem] border ${i === 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                <div className="flex items-center gap-5">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-500'}`}>{i + 1}</span>
                  <span className="font-black text-lg text-gray-200">{rank.nickname}</span>
                </div>
                <div className="text-right">
                  <span className="text-amber-500 font-black text-xl tracking-tighter">{rank.count}</span>
                  <span className="text-[10px] font-black text-gray-600 uppercase ml-1">Wins</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GuideItem({ cmd, desc, highlight }: { cmd: string, desc: string, highlight?: boolean }) {
  return (
    <div className={`p-5 rounded-2xl border ${highlight ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
      <code className={`text-sm font-black mb-1 block ${highlight ? 'text-emerald-400' : 'text-white'}`}>{cmd}</code>
      <p className="text-[11px] text-gray-500 font-bold">{desc}</p>
    </div>
  );
}