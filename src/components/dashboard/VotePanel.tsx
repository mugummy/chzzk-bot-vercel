'use client';

import { useState } from 'react';
import { Poll, Plus, Trash2, Play, StopCircle, RotateCcw, Users, Activity, Gift, Dices, Settings2, Link, Layers, Monitor } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function VotePanel({ onSend }: { onSend: (msg: any) => void }) {
  const store = useBotStore();
  const [subTab, setSubTab] = useState<'vote' | 'draw' | 'roulette' | 'settings'>('vote');
  
  // States
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [drawKeyword, setDrawKeyword] = useState('!참여');
  const [winnerCount, setWinnerCount] = useState(1);
  const [rouletteItems, setRouletteItems] = useState([{ text: '꽝', weight: 1 }, { text: '당첨', weight: 1 }]);

  const handleStartVote = () => {
    onSend({ type: 'createVote', data: { question, options: options.filter(o => o.trim()), settings: { duration: 60, mode: 'any' } } });
    setTimeout(() => onSend({ type: 'startVote' }), 200);
  };

  const copyUrl = (path: string) => {
    const token = localStorage.getItem('chzzk_session_token');
    const url = `${window.location.origin}/overlay/${path}?token=${token}`;
    navigator.clipboard.writeText(url);
    window.ui.notify('오버레이 URL이 복사되었습니다.', 'success');
  };

  const currentVote = store.votes[0];

  return (
    <div className="space-y-10">
      {/* Sub-navigation Tabs */}
      <div className="flex gap-2 p-2 bg-white/5 rounded-3xl w-fit border border-white/5 shadow-2xl">
        {[
          { id: 'vote', label: '투표', icon: Poll },
          { id: 'draw', label: '추첨', icon: Gift },
          { id: 'roulette', label: '룰렛', icon: Dices },
          { id: 'settings', label: '오버레이', icon: Settings2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all ${subTab === tab.id ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <tab.icon size={18} />
            <span className="text-sm uppercase tracking-tight">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* [1] VOTE TAB CONTENT */}
        {subTab === 'vote' && (
          <motion.div key="vote" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-5 bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5 space-y-8">
              <h3 className="text-xl font-black flex items-center gap-2 text-emerald-500"><Plus size={20}/> 신규 투표 생성</h3>
              <div className="space-y-6">
                <input value={question} onChange={e => setQuestion(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-emerald-500 outline-none font-bold" placeholder="질문을 입력하세요" />
                <div className="space-y-3">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-12 bg-white/5 flex items-center justify-center rounded-2xl font-black text-emerald-500">{i+1}</div>
                      <input value={opt} onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl outline-none" placeholder="항목 입력" />
                    </div>
                  ))}
                  <button onClick={() => setOptions([...options, ''])} className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-gray-500 font-bold hover:text-white">+ 추가</button>
                </div>
                <button onClick={handleStartVote} className="w-full py-6 bg-emerald-500 text-black font-black rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all">투표 가동</button>
              </div>
            </div>
            <div className="xl:col-span-7 bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5">
              {!currentVote ? <div className="h-full flex flex-col items-center justify-center text-gray-700 py-32"><Poll size={80} className="opacity-20 mb-4"/><p className="font-bold italic">진행 중인 투표 없음</p></div> : (
                <div className="space-y-10">
                  <h2 className="text-4xl font-black tracking-tighter text-white border-l-4 border-emerald-500 pl-6">{currentVote.question}</h2>
                  <div className="space-y-8">
                    {currentVote.options.map((opt: any, i: number) => {
                      const total = Object.values(currentVote.results as Record<string, number>).reduce((a, b) => a + b, 0);
                      const count = (currentVote.results as any)[opt.id] || 0;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between font-bold text-gray-300"><span>{opt.text}</span><span>{pct}% ({count}표)</span></div>
                          <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1">
                            <motion.div initial={{width:0}} animate={{width:`${pct}%`}} className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full shadow-lg shadow-emerald-500/20" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="pt-8 border-t border-white/5 flex justify-between items-center"><div className="flex gap-2 items-center text-gray-500 font-bold"><Users size={18}/> {Object.values(currentVote.results as Record<string, number>).reduce((a, b) => a + b, 0)}명 참여</div><div className="flex gap-2"><button onClick={() => onSend({type:'endVote'})} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><StopCircle/></button><button onClick={() => onSend({type:'resetVote'})} className="p-4 bg-white/5 rounded-2xl transition-all"><RotateCcw/></button></div></div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* [2] SETTINGS TAB (Overlay URLs) */}
        {subTab === 'settings' && (
          <motion.div key="settings" initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3.5rem] space-y-10">
              <div><h3 className="text-2xl font-black mb-2">오버레이 브라우저 주소</h3><p className="text-gray-500 font-medium">OBS에서 '브라우저 소스'로 추가하세요.</p></div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">투표 오버레이</label>
                  <div className="flex gap-3 bg-black/40 p-2 pl-6 rounded-2xl border border-white/10">
                    <span className="flex-1 py-3 text-sm text-gray-500 truncate">https://.../overlay/vote?token=***</span>
                    <button onClick={() => copyUrl('vote')} className="px-6 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 flex items-center gap-2"><Link size={16}/> 복사</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">신청곡 플레이어</label>
                  <div className="flex gap-3 bg-black/40 p-2 pl-6 rounded-2xl border border-white/10">
                    <span className="flex-1 py-3 text-sm text-gray-500 truncate">https://.../overlay/player?token=***</span>
                    <button onClick={() => copyUrl('player')} className="px-6 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 flex items-center gap-2"><Link size={16}/> 복사</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-emerald-500 rounded-[3.5rem] p-12 text-black flex flex-col justify-center">
              <Monitor size={64} className="mb-6 opacity-40" />
              <h2 className="text-4xl font-black tracking-tighter mb-4 leading-none">방송 화면에 <br /> 생동감을 더하세요.</h2>
              <p className="font-bold text-black/60 leading-relaxed">모든 오버레이는 실시간 WebSocket 기술로 <br /> 대시보드와 지연 없이 동기화됩니다.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
