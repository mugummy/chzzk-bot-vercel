'use client';

import { useState } from 'react';
import { Vote, Plus, Trash2, Play, StopCircle, RotateCcw, Users, Activity, Gift, Dices, Settings2, Link, Layers, Monitor, ShieldCheck, CheckSquare, Square, ChevronRight } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function VotePanel({ onSend }: { onSend: (msg: any) => void }) {
  const store = useBotStore();
  const [subTab, setSubTab] = useState<'vote' | 'draw' | 'roulette' | 'settings'>('vote');
  
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [voteSettings, setVoteSettings] = useState({ duration: 60, mode: 'any', allowDonation: true, donationWeight: 100, subscriberOnly: false });

  const [drawKeyword, setDrawKeyword] = useState('!참여');
  const [winnerCount, setWinnerCount] = useState(1);
  const [drawSettings, setDrawSettings] = useState({ subscriberOnly: false, excludePreviousWinners: true });

  const [rouletteItems, setRouletteItems] = useState([{ text: '꽝', weight: 1 }, { text: '당첨', weight: 1 }]);

  const handleStartVote = () => {
    onSend({ type: 'createVote', data: { question, options: options.filter(o => o.trim()), settings: voteSettings } });
    setTimeout(() => onSend({ type: 'startVote' }), 200);
  };

  const copyUrl = (path: string) => {
    const token = localStorage.getItem('chzzk_session_token');
    const url = `${window.location.origin}/overlay/${path}?token=${token}`;
    navigator.clipboard.writeText(url);
    if (typeof window !== 'undefined' && (window as any).ui?.notify) {
      (window as any).ui.notify('URL이 복사되었습니다.', 'success');
    }
  };

  const currentVote = store.votes[0];

  return (
    <div className="space-y-10">
      <div className="flex gap-2 p-2 bg-white/5 rounded-3xl w-fit border border-white/5 shadow-2xl">
        {[
          { id: 'vote', label: '투표', icon: Vote },
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
        {subTab === 'vote' && (
          <motion.div key="vote" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="grid grid-cols-12 gap-8">
            <div className="col-span-12 xl:col-span-5 bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5 space-y-10">
              <h3 className="text-2xl font-black flex items-center gap-3"><Plus className="text-emerald-500"/> 투표 정밀 설정</h3>
              <div className="space-y-6">
                <input value={question} onChange={e => setQuestion(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-emerald-500 outline-none font-bold" placeholder="질문을 입력하세요" />
                <div className="space-y-4">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-12 bg-white/5 flex items-center justify-center rounded-2xl font-black text-emerald-500">{i+1}</div>
                      <input value={opt} onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl outline-none" placeholder={`항목 ${i+1}`} />
                    </div>
                  ))}
                  <button onClick={() => setOptions([...options, ''])} className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-gray-500 font-bold hover:text-white">+ 항목 추가</button>
                </div>
                <button onClick={handleStartVote} className="w-full py-6 bg-emerald-500 text-black font-black rounded-3xl shadow-xl hover:scale-105 transition-all text-lg">투표 엔진 가동</button>
              </div>
            </div>
            <div className="col-span-12 xl:col-span-7 bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5">
              {!currentVote ? <div className="h-full flex flex-col items-center justify-center text-gray-700 py-32"><Vote size={80} className="opacity-20 mb-4"/><p className="font-bold italic">진행 중인 투표가 없습니다.</p></div> : (
                <div className="space-y-10">
                  <h2 className="text-4xl font-black tracking-tighter text-white border-l-4 border-emerald-500 pl-6">{currentVote.question}</h2>
                  <div className="space-y-8">
                    {currentVote.options.map((opt: any, i: number) => {
                      const total = Object.values(currentVote.results as Record<string, number>).reduce((a, b) => a + b, 0);
                      const count = (currentVote.results as any)[opt.id] || 0;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between font-bold text-gray-300 px-1"><span>{opt.text}</span><span>{pct}% ({count}표)</span></div>
                          <div className="h-5 bg-white/5 rounded-2xl overflow-hidden p-1 border border-white/5">
                            <motion.div initial={{width:0}} animate={{width:`${pct}%`}} className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="pt-10 border-t border-white/5 flex justify-between items-center text-gray-500">
                    <div className="flex gap-3 items-center font-black"><Users size={20} className="text-emerald-500"/> <span>총 {Object.values(currentVote.results as Record<string, number>).reduce((a, b) => a + b, 0).toLocaleString()}명 참여</span></div>
                    <div className="flex gap-3">
                      <button onClick={() => onSend({type:'endVote'})} className="p-5 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><StopCircle size={24}/></button>
                      <button onClick={() => onSend({type:'resetVote'})} className="p-5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><RotateCcw size={24}/></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {subTab === 'draw' && (
          <motion.div key="draw" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-[#0a0a0a] border border-white/5 p-16 rounded-[4rem] flex flex-col items-center text-center space-y-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-cyan-500" />
            <div className="w-28 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-black shadow-2xl">
              <Gift size={56} />
            </div>
            <h2 className="text-5xl font-black tracking-tighter">스마트 키워드 추첨기</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
              <input value={drawKeyword} onChange={e => setDrawKeyword(e.target.value)} className="w-full bg-white/5 border border-white/10 p-6 rounded-[2rem] focus:border-emerald-500 outline-none font-black text-3xl text-center" />
              <input type="number" value={winnerCount} onChange={e => setWinnerCount(parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 p-6 rounded-[2rem] focus:border-emerald-500 outline-none font-black text-3xl text-center" />
            </div>
            <button onClick={() => onSend({type:'startDraw', payload:{keyword:drawKeyword, settings:{...drawSettings, winnerCount}}})} className="group px-24 py-8 bg-white text-black font-black text-2xl rounded-[3rem] hover:bg-emerald-500 hover:scale-105 transition-all active:scale-95 shadow-2xl flex items-center gap-4">
              추첨 가동 시작 <ChevronRight size={28} />
            </button>
          </motion.div>
        )}

        {subTab === 'settings' && (
          <motion.div key="settings" initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3.5rem] space-y-10">
              <h3 className="text-2xl font-black">브라우저 소스 주소</h3>
              <div className="space-y-6">
                <button onClick={() => copyUrl('vote')} className="w-full py-4 bg-emerald-500 text-black font-black rounded-xl">투표 오버레이 복사</button>
                <button onClick={() => copyUrl('player')} className="w-full py-4 bg-emerald-500 text-black font-black rounded-xl">플레이어 오버레이 복사</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}