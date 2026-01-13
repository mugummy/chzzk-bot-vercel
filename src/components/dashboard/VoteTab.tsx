'use client';

import { useState } from 'react';
import { Poll, Plus, Trash2, Play, StopCircle, RotateCcw, Users } from 'lucide-react';
import { useBotStore } from '@/lib/store';

export default function VoteTab({ onSend }: { onSend: (msg: any) => void }) {
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

  const startVote = () => {
    onSend({
      type: 'createVote',
      data: { question, options: options.filter(o => o.trim()), settings: { duration: 60, mode: 'any' } }
    });
    setTimeout(() => onSend({ type: 'startVote' }), 200);
  };

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Creation Form */}
      <div className="col-span-5 bg-[#111] p-10 rounded-[3rem] border border-white/5 space-y-8">
        <h3 className="text-xl font-black flex items-center gap-2">
          <Plus size={20} className="text-emerald-500" /> 투표 생성
        </h3>
        <div className="space-y-4">
          <label className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">투표 질문</label>
          <input 
            value={question} onChange={e => setQuestion(e.target.value)}
            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:border-emerald-500 transition-all outline-none"
            placeholder="예: 오늘 저녁 메뉴는?"
          />
        </div>
        <div className="space-y-4">
          <label className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">선택지</label>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-12 bg-white/5 flex items-center justify-center rounded-2xl font-black text-emerald-500">{i + 1}</div>
              <input 
                value={opt} onChange={e => updateOption(i, e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl focus:border-emerald-500 transition-all outline-none"
                placeholder={`항목 ${i + 1}`}
              />
            </div>
          ))}
          <button onClick={addOption} className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-gray-500 font-bold hover:border-emerald-500/50 hover:text-emerald-500 transition-all">+ 선택지 추가</button>
        </div>
        <button 
          onClick={startVote}
          className="w-full py-5 bg-emerald-500 text-black font-black rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          투표 시작하기
        </button>
      </div>

      {/* Real-time Results */}
      <div className="col-span-7 bg-[#111] p-10 rounded-[3rem] border border-white/5">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black flex items-center gap-2">
            <Activity size={20} className="text-emerald-500" /> 실시간 현황
          </h3>
          {currentVote && (
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${currentVote.isActive ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-red-500/20 text-red-400'}`}>
              {currentVote.isActive ? 'Live' : 'Ended'}
            </div>
          )}
        </div>

        {!currentVote ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-600">
            <Poll size={64} className="mb-4 opacity-20" />
            <p className="font-bold">진행 중인 투표가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-8">
            <h2 className="text-3xl font-black tracking-tight">{currentVote.question}</h2>
            <div className="space-y-6">
              {currentVote.options.map((opt: any, i: number) => {
                const total = Object.values(currentVote.results as Record<string, number>).reduce((a, b) => a + b, 0);
                const count = (currentVote.results as any)[opt.id] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#f43f5e'];
                
                return (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-300">{i + 1}. {opt.text}</span>
                      <span className="text-emerald-500">{pct}% ({count}표)</span>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        className="h-full rounded-full"
                        style={{ background: colors[i % colors.length] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="pt-8 flex justify-between items-center border-t border-white/5 text-gray-500 font-bold">
              <div className="flex items-center gap-2">
                <Users size={18} /> <span>총 {Object.values(currentVote.results as Record<string, number>).reduce((a, b) => a + b, 0)}명 참여</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onSend({type:'endVote'})} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><StopCircle size={20}/></button>
                <button onClick={() => onSend({type:'resetVote'})} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all"><RotateCcw size={20}/></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { Activity } from 'lucide-react';
