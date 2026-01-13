'use client';

import { Users, Play, StopCircle, Trash2, UserPlus, UserCheck, Settings2, Info } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ParticipationTab: 시청자 참여 대기열 및 목록 관리 컴포넌트
 */
export default function ParticipationTab({ onSend }: { onSend: (msg: any) => void }) {
  const { participation } = useBotStore();

  const handleToggle = () => onSend({ type: 'toggleParticipation' });
  const handleApprove = (id: string) => onSend({ type: 'moveToParticipants', data: { userIdHash: id } });
  const handleClear = () => confirm('모든 명단을 초기화할까요?') && onSend({ type: 'clearParticipants' });

  return (
    <div className="space-y-10">
      {/* 1. 상단 설정 및 제어 카드 */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col lg:flex-row justify-between items-center gap-8 shadow-2xl">
        <div className="flex items-center gap-8">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 ${participation.isActive ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-gray-500'}`}>
            <Users size={40} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-3xl font-black tracking-tighter">참여 시스템</h3>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${participation.isActive ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-white/5 text-gray-500'}`}>
                {participation.isActive ? '모집 중' : '모집 중단'}
              </span>
            </div>
            <p className="text-gray-500 font-medium italic">!시참 명령어로 시청자들의 신청을 받습니다.</p>
          </div>
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <button 
            onClick={handleToggle}
            className={`flex-1 lg:flex-none px-10 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 ${participation.isActive ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' : 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/20'}`}
          >
            {participation.isActive ? <StopCircle size={22} /> : <Play size={22} fill="currentColor" />}
            <span>{participation.isActive ? '모집 종료' : '모집 시작'}</span>
          </button>
          <button 
            onClick={handleClear}
            className="flex-1 lg:flex-none bg-white/5 text-gray-400 border border-white/5 px-10 py-5 rounded-[2rem] font-black hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3"
          >
            <Trash2 size={22} /> <span>명단 초기화</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* 2. 대기열 (Queue) */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-black flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-500 border border-cyan-500/20">
                <UserPlus size={18} />
              </div>
              승인 대기열 <span className="text-cyan-500 ml-1">{participation.queue.length}</span>
            </h4>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Incoming Requests</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence initial={false}>
              {participation.queue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50 py-20">
                  <Info size={48} strokeWidth={1} className="mb-4" />
                  <p className="font-bold tracking-tight">대기 중인 시청자가 없습니다.</p>
                </div>
              ) : (
                participation.queue.map((p, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                    key={p.userIdHash} 
                    className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500 font-black text-xs">
                        {i + 1}
                      </div>
                      <span className="font-black text-lg text-gray-200">{p.nickname}</span>
                    </div>
                    <button 
                      onClick={() => handleApprove(p.userIdHash)}
                      className="px-6 py-2.5 bg-cyan-500 text-black font-black rounded-xl hover:scale-105 active:scale-95 transition-all text-xs"
                    >
                      승인하기
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 3. 참여 명단 (Active) */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-black flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <UserCheck size={18} />
              </div>
              최종 참여 명단 <span className="text-emerald-500 ml-1">{participation.active.length}/{participation.max}</span>
            </h4>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Active Players</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence initial={false}>
              {participation.active.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50 py-20">
                  <UserCheck size={48} strokeWidth={1} className="mb-4" />
                  <p className="font-bold tracking-tight">확정된 참여자가 없습니다.</p>
                </div>
              ) : (
                participation.active.map((p, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    key={p.userIdHash} 
                    className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500 text-black rounded-xl flex items-center justify-center font-black text-xs">
                        {i + 1}
                      </div>
                      <span className="font-black text-lg text-emerald-400">{p.nickname}</span>
                    </div>
                    <button 
                      onClick={() => onSend({ type: 'removeParticipant', data: { userIdHash: p.userIdHash } })}
                      className="p-3 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
