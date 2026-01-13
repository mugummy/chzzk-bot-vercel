'use client';

import { useState } from 'react';
import { Poll, Plus, Trash2, Play, StopCircle, RotateCcw, Users, Activity } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion } from 'framer-motion';

export default function VotePanel({ onSend }: { onSend: (msg: any) => void }) {
  const { votes } = useBotStore();
  const currentVote = votes.length > 0 ? votes[votes.length - 1] : null;
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const addOption = () => setOptions([...options, '']);
  const updateOption = (idx: number, val: string) => {
    const newOpts = [...options];
    newOpts[idx] = val;
    setOptions(newOpts);
  };

  const handleStart = () => {
    if (!question || options.filter(o => o.trim()).length < 2) return;
    onSend({
      type: 'createVote',
      data: { question, options: options.filter(o => o.trim()), settings: { duration: 60, mode: 'any' } }
    });
    setTimeout(() => onSend({ type: 'startVote' }), 200);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* Creation Side */}
      <div className="xl:col-span-5 bg-[#111] p-10 rounded-[3rem] border border-white/5 space-y-8 h-fit">
        <h3 className="text-2xl font-black flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Plus size={18} className="text-black" />
          </div>
          새 투표 시스템 가동
        </h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">질문 내용</label>
            <input 
              value={question} onChange={e => setQuestion(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-emerald-500 transition-all outline-none font-bold"
              placeholder="시청자들에게 무엇을 물어볼까요?"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">선택지 리스트</label>
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-12 bg-emerald-500/10 flex items-center justify-center rounded-2xl font-black text-emerald-500 border border-emerald-500/20">{i + 1}</div>
                  <input 
                    value={opt} onChange={e => updateOption(i, e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl focus:border-emerald-500 transition-all outline-none font-medium"
                    placeholder={`항목 ${i + 1}`}
                  />
                </div>
              ))}
            </div>
            <button 
              onClick={addOption}
              className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-gray-500 font-bold hover:border-emerald-500/50 hover:text-emerald-500 transition-all"
            >
              + 항목 추가하기
            </button>
          </div>
        </div>

        <button 
          onClick={handleStart}
          className="w-full py-6 bg-emerald-500 text-black font-black rounded-3xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-lg"
        >
          투표 서버에 전송 및 시작
        </button>
      </div>

      {/* Results Side (The chzzk-vote style) */}
      <div className="xl:col-span-7 bg-[#111] p-10 rounded-[3rem] border border-white/5 flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h3 className="text-2xl font-black flex items-center gap-3 mb-2">
              <Activity className="text-emerald-500" /> 실시간 라이브 현황
            </h3>
            <p className="text-gray-500 font-medium">시청자들의 반응이 밀리초 단위로 집계됩니다.</p>
          </div>
          {currentVote && (
            <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${currentVote.isActive ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-white/5 text-gray-500'}`}>
              {currentVote.isActive ? 'LIVE STREAMING' : 'READY / ENDED'}
            </div>
          )}
        </div>

        {!currentVote ? (
          <div className="flex-1 flex flex-col items-center justify-center py-32 text-gray-700">
            <Poll size={80} strokeWidth={1} className="mb-6 opacity-20" />
            <p className="text-xl font-bold italic tracking-tight">대기 중인 투표 데이터가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-10">
            <h2 className="text-4xl font-black tracking-tighter text-white border-l-4 border-emerald-500 pl-6">{currentVote.question}</h2>
            
            <div className="space-y-8">
              {currentVote.options.map((opt: any, i: number) => {
                const total = Object.values(currentVote.results as Record<string, number>).reduce((a, b) => a + b, 0);
                const count = (currentVote.results as any)[opt.id] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#f43f5e', '#f59e0b'];
                
                return (
                  <div key={i} className="group">
                    <div className="flex justify-between items-end mb-3 px-1">
                      <span className="text-lg font-bold text-gray-300 group-hover:text-white transition-colors">{i + 1}. {opt.text}</span>
                      <span className="text-emerald-400 font-black text-xl">{pct}% <span className="text-[10px] text-gray-500 ml-1">({count}표)</span></span>
                    </div>
                    <div className="h-5 bg-white/5 rounded-2xl overflow-hidden border border-white/5 p-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-xl relative"
                        style={{ background: `linear-gradient(90deg, ${colors[i % colors.length]}, #fff2)` }}
                      >
                        <div className="absolute inset-0 bg-white/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-10 flex justify-between items-center border-t border-white/5 mt-8">
              <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                <Users size={20} className="text-emerald-500" />
                <span className="font-black text-gray-300">총 {Object.values(currentVote.results as Record<string, number>).reduce((a, b) => a + b, 0).toLocaleString()}명 참여</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => onSend({type:'endVote'})} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg" title="투표 강제 마감"><StopCircle size={24}/></button>
                <button onClick={() => onSend({type:'resetVote'})} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5" title="데이터 초기화"><RotateCcw size={24}/></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
