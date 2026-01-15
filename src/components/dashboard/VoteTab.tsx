import { useState } from 'react';
import { useBotStore } from '@/lib/store';
import { Plus, Trash2, Play, Square, Activity, DollarSign, Vote, Users } from 'lucide-react';

export default function VoteTab({ onSend }: { onSend: (msg: any) => void }) {
  const { vote } = useBotStore();
  const currentVote = vote.currentVote;

  // 생성 폼 상태
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [mode, setMode] = useState<'normal' | 'donation'>('normal');

  const handleAddOption = () => setOptions([...options, '']);
  const handleRemoveOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx));
  const handleOptionChange = (idx: number, val: string) => {
    const newOpts = [...options];
    newOpts[idx] = val;
    setOptions(newOpts);
  };

  const handleCreate = () => {
    const validOptions = options.filter(o => o.trim());
    if (!title.trim() || validOptions.length < 2) return alert('제목과 최소 2개의 항목이 필요합니다.');
    onSend({ type: 'createVote', title, options: validOptions, mode });
    // 초기화
    setTitle('');
    setOptions(['', '']);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. 투표 생성 패널 (투표가 없을 때만 표시하거나, 종료된 후 표시) */}
      {!currentVote || currentVote.status === 'ended' ? (
        <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem]">
          <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Vote className="text-emerald-500" /> 새 투표 만들기</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">투표 제목</label>
              <input 
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder="예: 오늘 저녁 메뉴는?"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setMode('normal')}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${mode === 'normal' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'}`}
              >
                <Users size={24} />
                <span className="font-bold">일반 투표 (1인 1표)</span>
              </button>
              <button 
                onClick={() => setMode('donation')}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${mode === 'donation' ? 'bg-pink-500/20 border-pink-500 text-pink-500' : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'}`}
              >
                <DollarSign size={24} />
                <span className="font-bold">후원 투표 (금액 비례)</span>
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-400 ml-1">투표 항목</label>
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-10 h-12 flex items-center justify-center bg-white/5 rounded-xl font-black text-gray-500">{i + 1}</div>
                  <input 
                    value={opt} onChange={e => handleOptionChange(i, e.target.value)}
                    placeholder={`항목 ${i + 1}`}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
                  />
                  {options.length > 2 && (
                    <button onClick={() => handleRemoveOption(i)} className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={handleAddOption} className="w-full py-3 rounded-xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all font-bold flex items-center justify-center gap-2">
                <Plus size={18} /> 항목 추가
              </button>
            </div>

            <button onClick={handleCreate} className="w-full py-4 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              투표 생성하기
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] relative overflow-hidden">
            {/* 배경 데코 */}
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ${currentVote.status === 'active' ? 'bg-emerald-500 text-black animate-pulse' : 'bg-gray-500 text-white'}`}>
                        {currentVote.status === 'active' ? 'Voting In Progress' : 'Vote Ended'}
                    </span>
                    <h2 className="text-4xl font-black">{currentVote.title}</h2>
                    <p className="text-gray-400 mt-1 font-medium">{currentVote.mode === 'normal' ? '👤 1인 1표' : '💰 후원 금액 비례'}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Total Votes</p>
                    <p className="text-4xl font-black tabular-nums">{currentVote.totalParticipants}</p>
                </div>
            </div>

            <div className="space-y-4 mb-8 relative z-10">
                {currentVote.options.map((opt: any, i: number) => {
                    const total = currentVote.options.reduce((acc: number, o: any) => acc + o.count, 0);
                    const percent = total === 0 ? 0 : Math.round((opt.count / total) * 100);
                    return (
                        <div key={opt.id} className="relative h-16 bg-black/40 rounded-2xl overflow-hidden border border-white/5">
                            <div 
                                className="absolute top-0 left-0 h-full bg-emerald-500/20 transition-all duration-1000 ease-out"
                                style={{ width: `${percent}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-between px-6">
                                <span className="font-bold text-lg"><span className="text-emerald-500 mr-3">{i + 1}.</span> {opt.label}</span>
                                <div className="text-right">
                                    <span className="font-black text-xl tabular-nums block">{opt.count}</span>
                                    <span className="text-xs text-gray-400 font-bold">{percent}%</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-4 relative z-10">
                {currentVote.status === 'ready' && (
                    <button onClick={() => onSend({ type: 'startVote' })} className="flex-1 py-4 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
                        <Play fill="currentColor" /> 투표 시작
                    </button>
                )}
                {currentVote.status === 'active' && (
                    <button onClick={() => onSend({ type: 'endVote' })} className="flex-1 py-4 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                        <Square fill="currentColor" /> 투표 종료
                    </button>
                )}
                <button onClick={() => onSend({ type: 'toggleOverlay', visible: true, view: 'vote' })} className="px-6 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all">
                    오버레이 표시
                </button>
            </div>
        </div>
      )}
    </div>
  );
}
