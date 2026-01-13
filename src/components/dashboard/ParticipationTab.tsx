'use client';

import { useState } from 'react';
import { Users, Play, StopCircle, Trash2, UserPlus, UserCheck, Settings2, Info, Save, Zap, Trophy, Medal } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function ParticipationTab({ onSend }: { onSend: (msg: any) => void }) {
  const store = useBotStore();
  const { participation, settings } = store;

  const [cmd, setCmd] = useState(settings?.participationCommand || '!시참');
  const [max, setMax] = useState(participation.max || 10);

  const handleToggle = () => onSend({ type: 'toggleParticipation' });
  const handleApprove = (id: string) => onSend({ type: 'moveToParticipants', data: { userIdHash: id } });
  const handleClear = () => confirm('모든 명단을 초기화할까요?') && onSend({ type: 'clearParticipants' });
  
  const handleSaveSettings = () => {
    onSend({ type: 'updateSettings', data: { participationCommand: cmd } });
    onSend({ type: 'updateMaxParticipants', payload: { count: max } });
    window.ui.notify('참여 설정이 적용되었습니다.', 'success');
  };

  return (
    <div className="space-y-10">
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 flex flex-col xl:flex-row justify-between items-center gap-10 shadow-2xl">
        <div className="flex items-center gap-10 w-full xl:w-auto">
          <div className="space-y-3 flex-1 xl:w-64">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">참여 명령어</label>
            <input value={cmd} onChange={e => setCmd(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-emerald-500 outline-none font-black text-xl" />
          </div>
          <div className="space-y-3 w-32">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">최대 인원</label>
            <input type="number" value={max} onChange={e => setMax(parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-emerald-500 outline-none font-black text-xl text-center" />
          </div>
          <button onClick={handleSaveSettings} className="bg-white text-black p-5 rounded-2xl hover:bg-emerald-500 transition-all mt-6"><Save size={24}/></button>
        </div>

        <div className="flex gap-4 w-full xl:w-auto">
          <button onClick={handleToggle} className={`flex-1 xl:px-12 py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all hover:scale-105 ${participation.isActive ? 'bg-red-500 text-white' : 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/20'}`}>
            {participation.isActive ? <StopCircle size={24}/> : <Play size={24} fill="currentColor"/>}
            <span>{participation.isActive ? '모집 종료' : '참여 모집 시작'}</span>
          </button>
          <button onClick={handleClear} className="bg-white/5 text-gray-400 border border-white/5 p-6 rounded-[2rem] hover:bg-white/10 transition-all"><Trash2 size={24}/></button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* 명단 영역 */}
        <div className="col-span-12 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col min-h-[500px]">
            <h4 className="text-xl font-black mb-8 flex items-center gap-3"><UserPlus className="text-cyan-500"/> 승인 대기열 <span className="text-cyan-500">{participation.queue.length}</span></h4>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {participation.queue.map((p, i) => (
                <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} key={p.userIdHash} className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-cyan-500/30 transition-all">
                  <span className="font-black text-lg">{p.nickname}</span>
                  <button onClick={() => handleApprove(p.userIdHash)} className="px-6 py-2.5 bg-cyan-500 text-black font-black rounded-xl hover:scale-105 active:scale-95 transition-all">승인</button>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col min-h-[500px]">
            <h4 className="text-xl font-black mb-8 flex items-center gap-3"><UserCheck className="text-emerald-500"/> 최종 명단 <span className="text-emerald-500">{participation.active.length}/{max}</span></h4>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {participation.active.map((p, i) => (
                <div key={p.userIdHash} className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 flex items-center justify-between group">
                  <span className="font-black text-lg text-emerald-400">{p.nickname}</span>
                  <button onClick={() => onSend({type:'removeParticipant', data:{userIdHash:p.userIdHash}})} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* [신규] 참여왕 랭킹 보드 */}
        <div className="col-span-12 xl:col-span-4 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Trophy size={24} className="text-amber-500" />
            <h4 className="text-xl font-black italic uppercase tracking-tighter">참여왕 명예의 전당</h4>
          </div>
          <div className="space-y-4">
            {participation.ranking?.slice(0, 5).map((rank, i) => (
              <div key={i} className={`flex items-center justify-between p-5 rounded-3xl border ${i === 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-500 text-black' : 'bg-white/10 text-gray-400'}`}>{i + 1}</span>
                  <span className="font-bold">{rank.nickname}</span>
                </div>
                <span className="text-amber-500 font-black tracking-widest text-sm">{rank.count}회</span>
              </div>
            ))}
            {(!participation.ranking || participation.ranking.length === 0) && (
              <div className="py-20 text-center text-gray-600 font-bold italic">데이터 집계 중...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
