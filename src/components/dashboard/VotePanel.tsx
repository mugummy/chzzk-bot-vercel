'use client';

import { useState } from 'react';
import { BarChart3, PieChart, Play, StopCircle, Plus, Trash2, RotateCw, ExternalLink, Settings2, Trophy } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function VotePanel({ onSend }: { onSend: (msg: any) => void }) {
  const { votes, roulette } = useBotStore();
  const [activeSubTab, setActiveSubTab] = useState<'vote' | 'roulette' | 'settings'>('vote');

  // 투표 상태
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([{ id: '1', text: '' }, { id: '2', text: '' }]);

  // 룰렛 상태
  const [rouletteItems, setRouletteItems] = useState([{ id: '1', text: '', weight: 1, color: '#10b981' }]);

  const notify = (msg: string, type: 'success' | 'info' = 'success') => {
    if (typeof window !== 'undefined' && (window as any).ui?.notify) (window as any).ui.notify(msg, type);
  };

  const handleAddOption = () => {
    if (options.length >= 6) return notify('최대 6개까지만 가능합니다.', 'info');
    setOptions([...options, { id: Date.now().toString(), text: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return notify('최소 2개는 있어야 합니다.', 'info');
    const newOpts = [...options];
    newOpts.splice(index, 1);
    setOptions(newOpts);
  };

  const handleCreateVote = () => {
    if (!question) return notify('질문을 입력해주세요.', 'info');
    if (options.some(o => !o.text)) return notify('빈 항목을 채워주세요.', 'info');
    onSend({ type: 'createVote', data: { question, options, settings: { multiVote: false } } });
    notify('투표가 생성되었습니다. 시작 버튼을 눌러주세요.');
  };

  const handleStartVote = () => { onSend({ type: 'startVote' }); notify('투표를 시작했습니다.'); };
  const handleEndVote = () => { onSend({ type: 'endVote' }); notify('투표를 종료했습니다.'); };
  const handleResetVote = () => { onSend({ type: 'resetVote' }); notify('투표를 초기화했습니다.'); };

  const handleAddRouletteItem = () => {
    setRouletteItems([...rouletteItems, { id: Date.now().toString(), text: '', weight: 1, color: '#10b981' }]);
  };

  const handleRemoveRouletteItem = (index: number) => {
    const newItems = [...rouletteItems];
    newItems.splice(index, 1);
    setRouletteItems(newItems);
  };

  const handleCreateRoulette = () => {
    if (rouletteItems.some(i => !i.text)) return notify('항목 내용을 입력해주세요.', 'info');
    onSend({ type: 'createRoulette', payload: { items: rouletteItems } });
    notify('룰렛이 생성되었습니다.');
  };

  const handleSpin = () => { onSend({ type: 'spinRoulette' }); notify('룰렛을 돌립니다!'); };

  const currentVote = votes?.[0];

  return (
    <div className="space-y-8">
      <header className="flex gap-4 p-2 bg-white/5 rounded-[2rem] border border-white/5 w-fit">
        {[
          { id: 'vote', icon: <BarChart3 size={20}/>, label: '실시간 투표' },
          { id: 'roulette', icon: <PieChart size={20}/>, label: '행운의 룰렛' },
          { id: 'settings', icon: <Settings2 size={20}/>, label: '오버레이 설정' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-8 py-4 rounded-[1.5rem] font-bold flex items-center gap-3 transition-all ${activeSubTab === tab.id ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </header>

      {/* 1. 투표 탭 */}
      {activeSubTab === 'vote' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-xl space-y-8">
            <div>
              <h3 className="text-2xl font-black text-white mb-6">투표 설정</h3>
              <input value={question} onChange={e => setQuestion(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-bold text-lg text-white mb-4" placeholder="투표 질문 (예: 오늘 점심 뭐 먹지?)" />
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {options.map((opt, i) => (
                  <div key={opt.id} className="flex gap-3">
                    <input 
                      value={opt.text} 
                      onChange={e => { const n = [...options]; n[i].text = e.target.value; setOptions(n); }} 
                      className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-white font-medium" 
                      placeholder={`항목 ${i + 1}`} 
                    />
                    <button onClick={() => handleRemoveOption(i)} className="p-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>
              <button onClick={handleAddOption} className="w-full py-4 mt-4 rounded-xl border border-dashed border-white/20 text-gray-500 hover:text-emerald-500 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2 font-bold"><Plus size={18}/> 항목 추가</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handleCreateVote} className="bg-white text-black py-5 rounded-2xl font-black hover:bg-emerald-500 transition-all">투표 생성</button>
              <button onClick={handleResetVote} className="bg-white/5 text-gray-400 py-5 rounded-2xl font-black hover:bg-white/10 transition-all">초기화</button>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
            {currentVote ? (
              <div className="w-full space-y-8 relative z-10">
                <h2 className="text-3xl font-black text-white leading-tight">{currentVote.question}</h2>
                <div className="space-y-4">
                  {currentVote.options.map((opt, i) => (
                    <div key={opt.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/20 transition-all duration-1000" style={{ width: `${(currentVote.results[opt.id] / (currentVote.totalVotes || 1)) * 100}%` }} />
                      <span className="relative z-10 font-bold ml-2">{i+1}. {opt.text}</span>
                      <span className="relative z-10 font-black text-emerald-500">{currentVote.results[opt.id]}표</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-4 mt-8">
                  <button onClick={handleStartVote} disabled={currentVote.isActive} className="px-10 py-4 bg-emerald-500 text-black rounded-2xl font-black hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"><Play size={20}/> 시작</button>
                  <button onClick={handleEndVote} disabled={!currentVote.isActive} className="px-10 py-4 bg-red-500 text-white rounded-2xl font-black hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"><StopCircle size={20}/> 종료</button>
                </div>
              </div>
            ) : (
              <div className="text-gray-700 font-black italic text-xl flex flex-col items-center gap-4">
                <BarChart3 size={64} className="opacity-20" />
                <p>투표를 먼저 생성해주세요.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. 룰렛 탭 */}
      {activeSubTab === 'roulette' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-xl space-y-8">
            <h3 className="text-2xl font-black text-white">룰렛 항목 설정</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {rouletteItems.map((item, i) => (
                <div key={item.id} className="flex gap-3">
                  <input 
                    value={item.text} 
                    onChange={e => { const n = [...rouletteItems]; n[i].text = e.target.value; setRouletteItems(n); }} 
                    className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-white font-medium" 
                    placeholder={`항목 ${i + 1}`} 
                  />
                  <button onClick={() => handleRemoveRouletteItem(i)} className="p-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
            <button onClick={handleAddRouletteItem} className="w-full py-4 rounded-xl border border-dashed border-white/20 text-gray-500 hover:text-emerald-500 hover:border-emerald-500/50 transition-all font-bold flex items-center justify-center gap-2"><Plus size={18}/> 항목 추가</button>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={handleCreateRoulette} className="bg-white text-black py-5 rounded-2xl font-black hover:bg-emerald-500 transition-all">룰렛 생성</button>
              <button onClick={handleSpin} className="bg-emerald-500 text-black py-5 rounded-2xl font-black hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"><RotateCw size={20} className={roulette?.isSpinning ? 'animate-spin' : ''} /> 돌리기</button>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-xl flex items-center justify-center relative overflow-hidden">
            {roulette?.items?.length > 0 ? (
              <div className="text-center space-y-8">
                <div className="w-64 h-64 rounded-full border-8 border-white/10 relative flex items-center justify-center animate-spin-slow" style={{ animationDuration: roulette.isSpinning ? '0.2s' : '20s' }}>
                  <PieChart size={100} className="text-emerald-500" />
                </div>
                {roulette.winner && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-emerald-500/20 text-emerald-400 px-8 py-4 rounded-2xl font-black text-2xl border border-emerald-500/50">
                    🎉 {roulette.winner.text}
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-gray-700 font-black italic text-xl flex flex-col items-center gap-4">
                <PieChart size={64} className="opacity-20" />
                <p>룰렛 항목을 생성해주세요.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. 오버레이 설정 탭 */}
      {activeSubTab === 'settings' && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 shadow-xl space-y-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-emerald-500"><Settings2 size={32} /></div>
            <div><h3 className="text-2xl font-black text-white">오버레이 설정</h3><p className="text-gray-500 font-bold">OBS에 추가할 통합 링크입니다.</p></div>
          </div>
          
          <div className="grid grid-cols-1">
            {/* [수정] 통합된 단일 링크 제공 */}
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between h-48 hover:border-emerald-500/30 transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <BarChart3 size={32} className="text-emerald-500" />
                  <PieChart size={32} className="text-pink-500" />
                </div>
                <button onClick={() => window.open('/overlay/vote?token=' + localStorage.getItem('chzzk_session_token'), '_blank')} className="px-6 py-2 bg-white/10 rounded-full text-xs font-black hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2">Open Overlay <ExternalLink size={12}/></button>
              </div>
              <div>
                <h4 className="text-xl font-black text-white">통합 오버레이 (Vote + Roulette)</h4>
                <p className="text-xs text-gray-500 mt-1">투표나 룰렛을 시작하면 자동으로 화면이 전환됩니다. 평소엔 투명합니다.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
