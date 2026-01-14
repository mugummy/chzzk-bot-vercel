'use client';

import { useState, useEffect } from 'react';
import { Users, Play, StopCircle, Trash2, UserPlus, UserCheck, Save, Trophy, Info } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ParticipationTab: 시청자 참여 시스템 제어
 * 모든 UI 요소와 로직이 포함된 100% 전체 소스입니다.
 */
export default function ParticipationTab({ onSend }: { onSend: (msg: any) => void }) {
  const store = useBotStore();
  const { participation, settings } = store;

  const [cmd, setCmd] = useState('!시참');
  const [max, setMax] = useState(10);

  useEffect(() => {
    if (settings?.participationCommand) setCmd(settings.participationCommand);
    if (participation.max) setMax(participation.max);
  }, [settings?.participationCommand, participation.max]);

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
    onSend({ type: 'updateSettings', data: { participationCommand: cmd } });
    onSend({ type: 'updateMaxParticipants', payload: { count: max } });
    notify('참여 설정이 적용되었습니다.');
  };

  const handleRemove = (id: string, nickname: string) => {
    onSend({ type: 'removeParticipant', data: { userIdHash: id } });
    notify(`${nickname}님을 명단에서 제거했습니다.`, 'info');
  };

  return (
    <div className="space-y-10">
      {/* 1. 제어 및 설정 바 */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 flex flex-col xl:flex-row justify-between items-center gap-10 shadow-2xl">
        <div className="flex items-center gap-10 w-full xl:w-auto">
          <div className="space-y-3 flex-1 xl:w-64">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">참여 명령어</label>
            <input value={cmd} onChange={e => setCmd(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-emerald-500 outline-none font-black text-xl text-white shadow-inner" />
          </div>
          <div className="space-y-3 w-32">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">최대 인원</label>
            <input type="number" value={max} onChange={e => setMax(parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-emerald-500 outline-none font-black text-xl text-center text-white" />
          </div>
          <button onClick={handleSaveSettings} className="bg-white text-black p-5 rounded-2xl hover:bg-emerald-500 transition-all mt-6 shadow-xl active:scale-95"><Save size={24}/></button>
        </div>

        <div className="flex gap-4 w-full xl:w-auto">
          <button onClick={handleToggle} className={`flex-1 xl:px-12 py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 ${participation.isActive ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-emerald-500 text-black shadow-emerald-500/20 shadow-xl'}`}>
            {participation.isActive ? <StopCircle size={24}/> : <Play size={24} fill="currentColor"/>}
            <span>{participation.isActive ? '모집 종료' : '참여 모집 시작'}</span>
          </button>
          <button onClick={handleClear} className="bg-white/5 text-gray-400 border border-white/5 p-6 rounded-[2rem] hover:bg-white/10 transition-all active:scale-95"><Trash2 size={24}/></button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* 2. 실시간 명단 영역 */}
        <div className="col-span-12 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 대기열 */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col min-h-[500px]">
            <h4 className="text-xl font-black mb-8 flex items-center gap-3 text-white"><UserPlus className="text-cyan-500" size={24}/> 승인 대기열 <span className="text-cyan-500">{participation.queue.length}</span></h4>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {participation.queue.map((p, i) => (
                  <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:20}} key={p.userIdHash} className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-cyan-500/30 transition-all">
                    <span className="font-black text-lg text-white">{p.nickname}</span>
                    <button onClick={() => handleApprove(p.userIdHash)} className="px-6 py-2.5 bg-cyan-500 text-black font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg text-xs">승인하기</button>
                  </motion.div>
                ))}
                {participation.queue.length === 0 && <div className="h-full flex flex-col items-center justify-center text-gray-700 py-32 italic font-bold">대기자가 없습니다.</div>}
              </AnimatePresence>
            </div>
          </div>

          {/* 최종 명단 */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col min-h-[500px]">
            <h4 className="text-xl font-black mb-8 flex items-center gap-3 text-white"><UserCheck className="text-emerald-500" size={24}/> 확정 명단 <span className="text-emerald-500">{participation.active.length}/{max}</span></h4>
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
          </div>
        </div>

        {/* 3. 참여왕 랭킹 보드 */}
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
            {(!participation.ranking || participation.ranking.length === 0) && (
              <div className="py-24 text-center text-gray-700 font-bold italic border border-dashed border-white/5 rounded-3xl">데이터 집계 중...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
