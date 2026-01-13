'use client';

import { useState } from 'react';
import { Poll, Plus, Trash2, Play, StopCircle, RotateCcw, Users, Activity, Gift, Dices, Settings2 } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function VotePanel({ onSend }: { onSend: (msg: any) => void }) {
  const store = useBotStore();
  const [subTab, setSubTab] = useState<'vote' | 'draw' | 'roulette' | 'settings'>('vote');
  
  // States for Vote
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [voteSettings, setVoteSettings] = useState({ duration: 60, mode: 'any', allowDonation: true, donationWeight: 100 });

  // States for Draw
  const [drawKeyword, setDrawKeyword] = useState('!참여');
  const [winnerCount, setWinnerCount] = useState(1);

  // States for Roulette
  const [rouletteItems, setRouletteItems] = useState([{ text: '꽝', weight: 1 }, { text: '당첨', weight: 1 }]);

  const handleStartVote = () => {
    onSend({ type: 'createVote', data: { question, options: options.filter(o => o.trim()), settings: voteSettings } });
    setTimeout(() => onSend({ type: 'startVote' }), 200);
  };

  const currentVote = store.votes[0];

  return (
    <div className="space-y-8">
      {/* Sub-navigation Tabs */}
      <div className="flex gap-2 p-2 bg-white/5 rounded-[2rem] w-fit border border-white/5">
        {[
          { id: 'vote', label: '실시간 투표', icon: Poll },
          { id: 'draw', label: '키워드 추첨', icon: Gift },
          { id: 'roulette', label: '행운의 룰렛', icon: Dices },
          { id: 'settings', label: '오버레이 설정', icon: Settings2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black transition-all ${subTab === tab.id ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <tab.icon size={18} />
            <span className="text-sm uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* [1] VOTE TAB */}
        {subTab === 'vote' && (
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="grid grid-cols-12 gap-8">
            <div className="col-span-5 bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5 space-y-8 h-fit">
              <h3 className="text-xl font-black">투표 생성</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">질문</label>
                  <input value={question} onChange={e => setQuestion(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-emerald-500 transition-all outline-none" placeholder="질문을 입력하세요" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">선택지</label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-3">
                      <input value={opt} onChange={e => {
                        const n = [...options]; n[i] = e.target.value; setOptions(n);
                      }} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none" placeholder={`항목 ${i+1}`} />
                      <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="p-4 bg-red-500/10 text-red-500 rounded-2xl"><Trash2 size={18}/></button>
                    </div>
                  ))}
                  <button onClick={() => setOptions([...options, ''])} className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-gray-500 font-bold">+ 항목 추가</button>
                </div>
                <button onClick={handleStartVote} className="w-full py-6 bg-emerald-500 text-black font-black rounded-3xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">투표 시작</button>
              </div>
            </div>
            <div className="col-span-7 bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5 min-h-[500px]">
              {!currentVote ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-50 py-32">
                  <Poll size={80} className="mb-6" />
                  <p className="text-xl font-bold italic">진행 중인 투표가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-10">
                  <div className="flex justify-between items-start">
                    <h2 className="text-4xl font-black tracking-tighter text-emerald-500 border-l-4 border-emerald-500 pl-6">{currentVote.question}</h2>
                    <div className="bg-emerald-500/20 text-emerald-400 px-4 py-1 rounded-full text-[10px] font-black animate-pulse">LIVE</div>
                  </div>
                  <div className="space-y-8">
                    {currentVote.options.map((opt: any, i: number) => {
                      const total = Object.values(currentVote.results as Record<string, number>).reduce((a, b) => a + b, 0);
                      const count = (currentVote.results as any)[opt.id] || 0;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={i} className="space-y-3">
                          <div className="flex justify-between font-bold px-1">
                            <span className="text-gray-300">{i+1}. {opt.text}</span>
                            <span className="text-emerald-400">{pct}% ({count}표)</span>
                          </div>
                          <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1">
                            <motion.div initial={{width:0}} animate={{width:`${pct}%`}} className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="pt-8 border-t border-white/5 flex justify-between items-center text-gray-500">
                    <div className="flex items-center gap-3 font-bold"><Users size={20}/> <span>총 {Object.values(currentVote.results as Record<string, number>).reduce((a, b) => a + b, 0)}명 참여</span></div>
                    <div className="flex gap-2">
                      <button onClick={() => onSend({type:'endVote'})} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><StopCircle/></button>
                      <button onClick={() => onSend({type:'resetVote'})} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><RotateCcw/></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* [2] DRAW TAB */}
        {subTab === 'draw' && (
          <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3.5rem] flex flex-col items-center text-center space-y-10 shadow-2xl">
            <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-black shadow-2xl shadow-emerald-500/20">
              <Gift size={48} />
            </div>
            <div className="max-w-xl space-y-4">
              <h2 className="text-4xl font-black tracking-tighter">실시간 채팅 키워드 추첨</h2>
              <p className="text-gray-500 font-medium">채팅창에 특정 키워드를 입력한 시청자들 중 당첨자를 무작위로 선정합니다.</p>
            </div>
            <div className="flex gap-6 w-full max-w-2xl">
              <div className="flex-1 space-y-3 text-left">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">추첨 키워드</label>
                <input value={drawKeyword} onChange={e => setDrawKeyword(e.target.value)} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl focus:border-emerald-500 outline-none font-black text-2xl" placeholder="!참여" />
              </div>
              <div className="w-40 space-y-3 text-left">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">당첨 인원</label>
                <input type="number" value={winnerCount} onChange={e => setWinnerCount(parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl focus:border-emerald-500 outline-none font-black text-2xl text-center" />
              </div>
            </div>
            <button onClick={() => onSend({type:'startDraw', payload:{keyword:drawKeyword, settings:{winnerCount}}})} className="px-20 py-8 bg-white text-black font-black text-2xl rounded-[2.5rem] hover:bg-emerald-500 transition-all active:scale-95 shadow-2xl">추첨 시스템 가동</button>
          </motion.div>
        )}

        {/* [3] ROULETTE TAB (Chzzk-Vote Style) */}
        {subTab === 'roulette' && (
          <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="grid grid-cols-12 gap-8">
            <div className="col-span-5 bg-[#0a0a0a] border border-white/5 p-10 rounded-[3rem] space-y-8">
              <h3 className="text-xl font-black flex items-center gap-3"><Dices className="text-emerald-500"/> 룰렛 항목 설정</h3>
              <div className="space-y-4">
                {rouletteItems.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <input value={item.text} onChange={e => {
                      const n = [...rouletteItems]; n[i].text = e.target.value; setRouletteItems(n);
                    }} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl outline-none" placeholder="항목 이름" />
                    <input type="number" value={item.weight} onChange={e => {
                      const n = [...rouletteItems]; n[i].weight = parseInt(e.target.value); setRouletteItems(n);
                    }} className="w-20 bg-white/5 border border-white/10 p-4 rounded-2xl text-center font-bold" />
                    <button onClick={() => setRouletteItems(rouletteItems.filter((_, idx) => idx !== i))} className="p-4 text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                  </div>
                ))}
                <button onClick={() => setRouletteItems([...rouletteItems, {text:'', weight:1}])} className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-gray-500 font-bold hover:text-white transition-all">+ 룰렛 조각 추가</button>
              </div>
              <button onClick={() => onSend({type:'createRoulette', payload:{items:rouletteItems}})} className="w-full py-6 bg-emerald-500 text-black font-black rounded-3xl shadow-xl hover:scale-[1.02] transition-all">룰렛 생성하기</button>
            </div>
            <div className="col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center">
              <div className="w-64 h-64 rounded-full border-8 border-white/5 flex items-center justify-center relative mb-10">
                <Dices size={100} className="text-emerald-500/20" />
                <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full" />
              </div>
              <h2 className="text-3xl font-black mb-4">행운의 룰렛 대기 중</h2>
              <button onClick={() => onSend({type:'spinRoulette'})} className="px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-emerald-500 transition-all">돌리기!</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}