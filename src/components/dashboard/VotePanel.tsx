'use client';

import { useState } from 'react';
import { Poll, Plus, Trash2, Play, StopCircle, RotateCcw, Users, Activity, Gift, Dices, Settings2, Link, Layers, Monitor, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

export default function VotePanel({ onSend }: { onSend: (msg: any) => void }) {
  const store = useBotStore();
  const [subTab, setSubTab] = useState<'vote' | 'draw' | 'roulette' | 'settings'>('vote');
  
  // Vote Creation States
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [voteSettings, setVoteSettings] = useState({ duration: 60, mode: 'any', allowDonation: true, donationWeight: 100, subscriberOnly: false });

  // Draw Creation States
  const [drawKeyword, setDrawKeyword] = useState('!참여');
  const [winnerCount, setWinnerCount] = useState(1);
  const [drawSettings, setDrawSettings] = useState({ subscriberOnly: false, excludePreviousWinners: true });

  // Roulette States
  const [rouletteItems, setRouletteItems] = useState([{ text: '꽝', weight: 1 }, { text: '당첨', weight: 1 }]);

  const handleStartVote = () => {
    onSend({ type: 'createVote', data: { question, options: options.filter(o => o.trim()), settings: voteSettings } });
    setTimeout(() => onSend({ type: 'startVote' }), 200);
  };

  const copyUrl = (path: string) => {
    const token = localStorage.getItem('chzzk_session_token');
    const url = `${window.location.origin}/overlay/${path}?token=${token}`;
    navigator.clipboard.writeText(url);
    window.ui.notify('URL이 복사되었습니다.', 'success');
  };

  const currentVote = store.votes[0];

  return (
    <div className="space-y-10">
      {/* Navigation Tabs */}
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
        {/* [1] VOTE TAB */}
        {subTab === 'vote' && (
          <motion.div key="vote" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="grid grid-cols-12 gap-8">
            <div className="col-span-12 xl:col-span-5 bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5 space-y-10">
              <h3 className="text-2xl font-black flex items-center gap-3"><Plus className="text-emerald-500"/> 투표 정밀 설정</h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">질문 내용</label>
                  <input value={question} onChange={e => setQuestion(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-emerald-500 outline-none font-bold" placeholder="질문을 입력하세요" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">선택지 관리</label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-12 bg-white/5 flex items-center justify-center rounded-2xl font-black text-emerald-500">{i+1}</div>
                      <input value={opt} onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl outline-none" placeholder={`항목 ${i+1}`} />
                    </div>
                  ))}
                  <button onClick={() => setOptions([...options, ''])} className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-gray-500 font-bold hover:text-white">+ 항목 추가</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-3">투표 모드</label>
                    <select value={voteSettings.mode} onChange={e => setVoteSettings({...voteSettings, mode: e.target.value as any})} className="w-full bg-transparent outline-none font-bold text-sm">
                      <option value="any">자유 (숫자포함)</option>
                      <option value="command">명령어 (!1 형태)</option>
                    </select>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-3">제한 시간 (초)</label>
                    <input type="number" value={voteSettings.duration} onChange={e => setVoteSettings({...voteSettings, duration: parseInt(e.target.value)})} className="w-full bg-transparent outline-none font-bold text-sm" />
                  </div>
                </div>
                <button onClick={handleStartVote} className="w-full py-6 bg-emerald-500 text-black font-black rounded-3xl shadow-xl hover:scale-105 transition-all text-lg">투표 엔진 가동</button>
              </div>
            </div>
            <div className="col-span-12 xl:col-span-7 bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5">
              {!currentVote ? <div className="h-full flex flex-col items-center justify-center text-gray-700 py-32"><Poll size={80} className="opacity-20 mb-4"/><p className="font-bold italic">진행 중인 투표가 없습니다.</p></div> : (
                <div className="space-y-10">
                  <div className="flex justify-between items-start">
                    <h2 className="text-4xl font-black tracking-tighter text-white border-l-4 border-emerald-500 pl-6">{currentVote.question}</h2>
                    <div className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-xl text-[10px] font-black animate-pulse">LIVE MONITOR</div>
                  </div>
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

        {/* [2] DRAW TAB */}
        {subTab === 'draw' && (
          <motion.div key="draw" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-[#0a0a0a] border border-white/5 p-16 rounded-[4rem] flex flex-col items-center text-center space-y-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-cyan-500" />
            <div className="w-28 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-black shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <Gift size={56} />
            </div>
            <div className="max-w-2xl space-y-4">
              <h2 className="text-5xl font-black tracking-tighter">스마트 키워드 추첨기</h2>
              <p className="text-gray-500 font-medium text-lg italic">채팅창의 목소리를 당첨의 기회로 연결합니다.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
              <div className="space-y-3 text-left">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] ml-2">참여 키워드</label>
                <input value={drawKeyword} onChange={e => setDrawKeyword(e.target.value)} className="w-full bg-white/5 border border-white/10 p-6 rounded-[2rem] focus:border-emerald-500 outline-none font-black text-3xl tracking-tighter text-center" />
              </div>
              <div className="space-y-3 text-left">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] ml-2">당첨 인원 수</label>
                <input type="number" value={winnerCount} onChange={e => setWinnerCount(parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 p-6 rounded-[2rem] focus:border-emerald-500 outline-none font-black text-3xl text-center" />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => setDrawSettings({...drawSettings, subscriberOnly: !drawSettings.subscriberOnly})} className={`px-6 py-3 rounded-full font-bold text-xs flex items-center gap-2 transition-all ${drawSettings.subscriberOnly ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                {drawSettings.subscriberOnly ? <CheckSquare size={14}/> : <Square size={14}/>} 구독자 전용
              </button>
              <button onClick={() => setDrawSettings({...drawSettings, excludePreviousWinners: !drawSettings.excludePreviousWinners})} className={`px-6 py-3 rounded-full font-bold text-xs flex items-center gap-2 transition-all ${drawSettings.excludePreviousWinners ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                {drawSettings.excludePreviousWinners ? <CheckSquare size={14}/> : <Square size={14}/>} 이전 당첨자 제외
              </button>
            </div>

            <button onClick={() => onSend({type:'startDraw', payload:{keyword:drawKeyword, settings:{...drawSettings, winnerCount}}})} className="group px-24 py-8 bg-white text-black font-black text-2xl rounded-[3rem] hover:bg-emerald-500 hover:scale-105 transition-all active:scale-95 shadow-2xl flex items-center gap-4">
              추첨 가동 시작 <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        )}

        {/* [3] SETTINGS */}
        {subTab === 'settings' && (
          <motion.div key="settings" initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3.5rem] space-y-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-500"><Link size={24}/></div>
                <div><h3 className="text-2xl font-black">브라우저 소스 주소</h3><p className="text-gray-500 text-sm">OBS에 아래 URL을 추가하세요.</p></div>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">투표 리얼타임 오버레이</label>
                  <div className="flex gap-3 bg-black/40 p-2 pl-6 rounded-[1.5rem] border border-white/10 group hover:border-emerald-500/30 transition-colors">
                    <span className="flex-1 py-3 text-sm text-gray-500 truncate font-mono">https://.../overlay/vote?token=AUTH_ID</span>
                    <button onClick={() => copyUrl('vote')} className="px-8 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2">복사</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">신청곡 비주얼 플레이어</label>
                  <div className="flex gap-3 bg-black/40 p-2 pl-6 rounded-[1.5rem] border border-white/10 group hover:border-emerald-500/30 transition-colors">
                    <span className="flex-1 py-3 text-sm text-gray-500 truncate font-mono">https://.../overlay/player?token=AUTH_ID</span>
                    <button onClick={() => copyUrl('player')} className="px-8 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2">복사</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-[3.5rem] p-12 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -right-20 -bottom-20 p-12 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Monitor size={400}/></div>
              <ShieldCheck size={64} className="text-emerald-500 mb-8" />
              <h2 className="text-4xl font-black tracking-tighter mb-6 leading-tight">보안 연결 <br />활성화됨</h2>
              <p className="text-gray-500 font-medium text-lg leading-relaxed">모든 오버레이 주소에는 고유 보안 토큰이 포함되어 있어 스트리머 외에는 접근할 수 없습니다.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import { ChevronRight } from 'lucide-react';