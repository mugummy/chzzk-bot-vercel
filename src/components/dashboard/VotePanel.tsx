'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, Play, StopCircle, Plus, Trash2, 
  RotateCw, ExternalLink, Settings2, Trophy, Users, 
  Coins, Copy, Eye, EyeOff, Dices, UserCheck, ShieldCheck, Palette, Save
} from 'lucide-react';
import { useBotStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import Toggle from '@/components/ui/Toggle';
import NumberInput from '@/components/ui/NumberInput';

export default function VotePanel({ onSend }: { onSend: (msg: any) => void }) {
  const { votes, roulette, draw, settings } = useBotStore();
  const [activeSubTab, setActiveSubTab] = useState<'vote' | 'roulette' | 'viewerDraw' | 'donationDraw' | 'settings'>('vote');

  // 투표 입력 상태
  const [voteQuestion, setVoteQuestion] = useState('');
  const [voteOptions, setVoteOptions] = useState([{ id: '1', text: '' }, { id: '2', text: '' }]);
  const [showVoters, setShowVoters] = useState(false);
  const [revealNicknames, setRevealNicknames] = useState(false);

  // 룰렛 입력 상태
  const [rouletteItems, setRouletteItems] = useState([{ id: '1', text: '', weight: 1, color: '#10b981' }]);

  // 추첨 설정
  const [chatType, setChatType] = useState<'any' | 'command'>('command');
  const [chatCommand, setChatCommand] = useState('!참가');
  const [donationType, setDonationType] = useState<'all' | 'specific'>('all');
  const [donationAmount, setDonationAmount] = useState(1000);
  const [drawCount, setDrawCount] = useState(1);

  // 오버레이 설정 (로컬 상태)
  const [showUrl, setShowUrl] = useState(false);
  const [overlayConfig, setOverlayConfig] = useState(settings?.overlay || {
    backgroundColor: '#000000',
    textColor: '#ffffff',
    accentColor: '#10b981',
    opacity: 0.9,
    scale: 1.0
  });

  useEffect(() => {
    if (settings?.overlay) setOverlayConfig(settings.overlay);
  }, [settings?.overlay]);

  const currentVote = votes?.[0];
  const overlayUrl = typeof window !== 'undefined' ? `${window.location.origin}/overlay/vote?token=${localStorage.getItem('chzzk_session_token')}` : '';

  const notify = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (typeof window !== 'undefined' && (window as any).ui?.notify) (window as any).ui.notify(msg, type);
  };

  const handleCreateVote = () => {
    if (!voteQuestion || voteOptions.some(o => !o.text)) return notify('질문과 모든 항목을 채워주세요.', 'error');
    onSend({ type: 'createVote', data: { question: voteQuestion, options: voteOptions } });
    notify('투표 세션이 생성되었습니다.');
  };

  const handleCreateRoulette = () => {
    if (rouletteItems.some(i => !i.text)) return notify('항목 내용을 입력해주세요.', 'info');
    onSend({ type: 'createRoulette', payload: { items: rouletteItems } });
    notify('룰렛판이 준비되었습니다.');
  };

  const handleSaveOverlay = () => {
    onSend({ type: 'updateSettings', data: { overlay: overlayConfig } });
    notify('오버레이 설정이 저장되었습니다.');
  };

  const maskName = (name: string) => revealNicknames ? name : (name[0] || '') + '***';

  return (
    <div className="space-y-8">
      <header className="flex gap-3 p-2 bg-white/5 rounded-[2.5rem] border border-white/5 w-fit overflow-x-auto custom-scrollbar">
        {[
          { id: 'vote', icon: <BarChart3 size={18}/>, label: '실시간 투표' },
          { id: 'roulette', icon: <PieChart size={18}/>, label: '행운의 룰렛' },
          { id: 'viewerDraw', icon: <Users size={18}/>, label: '시청자 추첨' },
          { id: 'donationDraw', icon: <Coins size={18}/>, label: '후원 추첨' },
          { id: 'settings', icon: <Settings2 size={18}/>, label: '오버레이 설정' }
        ].map(tab => (
          <button 
            key={tab.id} onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-6 py-3.5 rounded-[1.8rem] font-black text-sm flex items-center gap-3 transition-all whitespace-nowrap ${activeSubTab === tab.id ? 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </header>

      {/* 1. 실시간 투표 */}
      {activeSubTab === 'vote' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl space-y-8">
            <h3 className="text-2xl font-black text-white">투표 만들기</h3>
            <div className="space-y-4">
              <input value={voteQuestion} onChange={e => setVoteQuestion(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-bold text-lg text-white" placeholder="투표 질문 입력" />
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {voteOptions.map((opt, i) => (
                  <div key={opt.id} className="flex gap-3">
                    <input value={opt.text} onChange={e => { const n = [...voteOptions]; n[i].text = e.target.value; setVoteOptions(n); }} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-white font-medium" placeholder={`옵션 ${i + 1}`} />
                    <button onClick={() => { if(voteOptions.length > 2) setVoteOptions(voteOptions.filter((_, idx) => idx !== i)); }} className="p-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 transition-all"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>
              <button onClick={() => setVoteOptions([...voteOptions, { id: Date.now().toString(), text: '' }])} className="w-full py-4 border border-dashed border-white/20 text-gray-500 hover:text-emerald-500 rounded-xl font-bold flex justify-center gap-2"><Plus size={18}/> 항목 추가</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handleCreateVote} className="bg-white text-black py-5 rounded-2xl font-black hover:bg-emerald-500 transition-all shadow-xl">투표 생성</button>
              <button onClick={() => onSend({ type: 'resetVote' })} className="bg-white/5 text-gray-400 py-5 rounded-2xl font-black hover:bg-white/10 transition-all">초기화</button>
            </div>
          </div>
          <div className="xl:col-span-7 space-y-8">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl flex flex-col items-center justify-center text-center min-h-[450px] relative overflow-hidden">
              {currentVote ? (
                <div className="w-full space-y-8">
                  <h2 className="text-4xl font-black text-white">{currentVote.question}</h2>
                  <div className="space-y-4">
                    {currentVote.options.map((opt, i) => {
                      const percent = Math.round((currentVote.results[opt.id] / (currentVote.totalVotes || 1)) * 100);
                      return (
                        <div key={opt.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex justify-between relative overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="absolute left-0 top-0 bottom-0 bg-emerald-500/10" />
                          <span className="relative z-10 font-bold text-lg">{i+1}. {opt.text}</span>
                          <span className="relative z-10 font-black text-2xl text-emerald-500">{currentVote.results[opt.id]}표</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center gap-4 mt-8">
                    <button onClick={() => onSend({ type: 'startVote' })} disabled={currentVote.isActive} className="px-10 py-4 bg-emerald-500 text-black rounded-2xl font-black hover:scale-105 disabled:opacity-30 flex items-center gap-2"><Play size={20}/> 시작</button>
                    <button onClick={() => onSend({ type: 'endVote' })} disabled={!currentVote.isActive} className="px-10 py-4 bg-red-500 text-white rounded-2xl font-black hover:scale-105 disabled:opacity-30 flex items-center gap-2"><StopCircle size={20}/> 종료</button>
                    <button onClick={() => onSend({ type: 'executeDraw', payload: { count: 1, fromVote: true } })} className="px-10 py-4 bg-amber-500 text-black rounded-2xl font-black hover:scale-105 flex items-center gap-2 shadow-xl"><Trophy size={20}/> 투표자 추첨</button>
                  </div>
                </div>
              ) : <div className="flex flex-col items-center gap-6 opacity-20"><BarChart3 size={80} /><p className="text-2xl font-black italic">투표를 먼저 생성해주세요.</p></div>}
            </div>
            {currentVote && (
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-xl">
                <header className="flex justify-between items-center mb-8">
                  <h4 className="text-xl font-black text-white">투표 참여자 명단</h4>
                  <div className="flex items-center gap-4">
                    <Toggle checked={revealNicknames} onChange={setRevealNicknames} />
                    <button onClick={() => setShowVoters(!showVoters)} className="text-gray-500 hover:text-white transition-colors">{showVoters ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                  </div>
                </header>
                <AnimatePresence>
                  {showVoters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {currentVote.voters?.map((v: any, i: number) => (
                        <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5"><span className="font-bold text-white text-sm">{maskName(v.nickname)}</span></div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. 룰렛 탭 */}
      {activeSubTab === 'roulette' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl space-y-8">
            <h3 className="text-2xl font-black text-white flex items-center gap-3"><PieChart className="text-pink-500"/> 룰렛 설정</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {rouletteItems.map((item, i) => (
                <div key={item.id} className="flex gap-3">
                  <input value={item.text} onChange={e => { const n = [...rouletteItems]; n[i].text = e.target.value; setRouletteItems(n); }} className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-white font-medium" placeholder={`항목 ${i + 1}`} />
                  <button onClick={() => { if(rouletteItems.length > 1) setRouletteItems(rouletteItems.filter((_, idx) => idx !== i)); }} className="p-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 transition-all"><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
            <button onClick={() => setRouletteItems([...rouletteItems, { id: Date.now().toString(), text: '', weight: 1, color: '#10b981' }])} className="w-full py-4 border border-dashed border-white/20 text-gray-500 hover:text-pink-500 rounded-xl font-bold flex justify-center gap-2"><Plus size={18}/> 항목 추가</button>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handleCreateRoulette} className="bg-white text-black py-5 rounded-2xl font-black hover:bg-pink-500 transition-all shadow-xl">룰렛 생성</button>
              <button onClick={() => onSend({ type: 'resetRoulette' })} className="bg-white/5 text-gray-400 py-5 rounded-2xl font-black hover:bg-white/10 transition-all">초기화</button>
            </div>
            <button onClick={() => onSend({ type: 'spinRoulette' })} disabled={roulette.isSpinning} className="w-full bg-emerald-500 text-black py-5 rounded-2xl font-black hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3">
              <RotateCw size={20} className={roulette.isSpinning ? 'animate-spin' : ''} /> <span>돌리기</span>
            </button>
          </div>
          <div className="xl:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl flex flex-col items-center justify-center min-h-[450px]">
            {roulette?.items?.length > 0 ? (
              <div className="text-center space-y-10">
                <motion.div animate={{ rotate: roulette.isSpinning ? 3600 : 0 }} transition={{ duration: 3, ease: "circOut" }} className="w-64 h-64 rounded-full border-[12px] border-white/5 flex items-center justify-center relative shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                  <PieChart size={120} className="text-emerald-500" />
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white z-20" />
                </motion.div>
                {roulette.winner && <div className="bg-emerald-500/20 text-emerald-400 px-10 py-5 rounded-3xl font-black text-3xl border border-emerald-500/30 shadow-2xl">🎉 {roulette.winner.text}</div>}
              </div>
            ) : <div className="flex flex-col items-center gap-6 opacity-20"><PieChart size={80} /><p className="text-2xl font-black italic">룰렛 항목을 생성해주세요.</p></div>}
          </div>
        </div>
      )}

      {/* 3. 시청자 추첨 */}
      {activeSubTab === 'viewerDraw' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl space-y-8">
            <h3 className="text-2xl font-black text-white flex items-center gap-3"><Users className="text-cyan-500"/> 시청자 추첨</h3>
            <div className="space-y-6">
              <div className="flex gap-2 bg-white/5 p-2 rounded-2xl">
                <button onClick={() => setChatType('any')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${chatType === 'any' ? 'bg-cyan-500 text-black' : 'text-gray-500'}`}>아무 채팅</button>
                <button onClick={() => setChatType('command')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${chatType === 'command' ? 'bg-cyan-500 text-black' : 'text-gray-500'}`}>명령어 응모</button>
              </div>
              {chatType === 'command' && <input value={chatCommand} onChange={e => setChatCommand(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-bold text-white focus:border-cyan-500/50" placeholder="!참가" />}
              <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">당첨 인원</label><NumberInput value={drawCount} onChange={setDrawCount} min={1} max={10} className="bg-white/5" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => onSend({ type: 'startDraw', payload: { settings: { mode: 'chat', chatType, chatCommand } } })} className="bg-white text-black py-5 rounded-2xl font-black hover:bg-cyan-500 transition-all shadow-xl">모집 시작</button>
              <button onClick={() => onSend({ type: 'executeDraw', payload: { count: drawCount } })} disabled={draw.isRolling} className="bg-cyan-500 text-black py-5 rounded-2xl font-black hover:scale-105 shadow-xl flex items-center justify-center gap-2"><Trophy size={20}/> 추첨하기</button>
            </div>
            <button onClick={() => onSend({ type: 'resetDraw' })} className="w-full py-4 bg-white/5 text-gray-500 rounded-2xl font-bold text-xs hover:bg-white/10 transition-all">초기화</button>
          </div>
          <div className="xl:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl flex flex-col items-center justify-center min-h-[450px]">
            {draw.isRolling ? <div className="text-center space-y-6"><div className="text-6xl font-black text-white/10 animate-bounce blur-sm italic uppercase tracking-tighter">Rolling...</div><p className="text-cyan-500 font-black animate-pulse">참가자 {draw.candidatesCount}명 중 선정 중</p></div> : draw.winners.length > 0 ? (
              <div className="w-full space-y-4">{draw.winners.map((w, i) => <motion.div initial={{x:20,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:i*0.1}} key={i} className="bg-cyan-500 text-black p-6 rounded-3xl font-black text-3xl flex justify-between items-center shadow-xl"><span>{w.nickname}</span><Trophy size={28} /></motion.div>)}</div>
            ) : <div className="flex flex-col items-center gap-6 opacity-20"><Dices size={80} /><p className="text-2xl font-black italic">모집 시작 후 추첨을 진행하세요.</p></div>}
          </div>
        </div>
      )}

      {/* 4. 후원 추첨 */}
      {activeSubTab === 'donationDraw' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl space-y-8">
            <h3 className="text-2xl font-black text-white flex items-center gap-3"><Coins className="text-amber-500"/> 후원자 추첨</h3>
            <div className="space-y-6">
              <div className="flex gap-2 bg-white/5 p-2 rounded-2xl">
                <button onClick={() => setDonationType('all')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${donationType === 'all' ? 'bg-amber-500 text-black' : 'text-gray-500'}`}>모든 후원</button>
                <button onClick={() => setDonationType('specific')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${donationType === 'specific' ? 'bg-amber-500 text-black' : 'text-gray-500'}`}>특정 금액</button>
              </div>
              {donationType === 'specific' && <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">설정 금액 (치즈)</label><NumberInput value={donationAmount} onChange={setDonationAmount} step={100} min={100} unit="치즈" /></div>}
              <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">당첨 인원</label><NumberInput value={drawCount} onChange={setDrawCount} min={1} max={10} className="bg-white/5" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => onSend({ type: 'startDraw', payload: { settings: { mode: 'donation', donationType, donationAmount } } })} className="bg-white text-black py-5 rounded-2xl font-black hover:bg-amber-500 transition-all shadow-xl">모집 시작</button>
              <button onClick={() => handleExecuteDraw(false)} disabled={draw.isRolling} className="bg-amber-500 text-black py-5 rounded-2xl font-black hover:scale-105 shadow-xl flex items-center justify-center gap-2"><Trophy size={20}/> 추첨하기</button>
            </div>
            <button onClick={() => onSend({ type: 'resetDraw' })} className="w-full py-4 bg-white/5 text-gray-500 rounded-2xl font-bold text-xs hover:bg-white/10 transition-all">초기화</button>
          </div>
          <div className="xl:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl flex flex-col items-center justify-center min-h-[450px]">
            {draw.isRolling ? <div className="text-center space-y-6"><div className="text-6xl font-black text-white/10 animate-bounce blur-sm italic uppercase tracking-tighter">Rolling...</div><p className="text-amber-500 font-black animate-pulse">후원자 {draw.candidatesCount}명 중 선정 중</p></div> : draw.winners.length > 0 ? (
              <div className="w-full space-y-4">{draw.winners.map((w, i) => <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:i*0.1}} key={i} className="bg-amber-500 text-black p-6 rounded-3xl font-black text-3xl flex justify-between items-center shadow-xl"><span>{w.nickname}</span><Coins size={28} /></motion.div>)}</div>
            ) : <div className="flex flex-col items-center gap-6 opacity-20"><Coins size={80} /><p className="text-2xl font-black italic">모집 시작 후 추첨을 진행하세요.</p></div>}
          </div>
        </div>
      )}

      {/* 5. 오버레이 설정 */}
      {activeSubTab === 'settings' && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-12 shadow-2xl space-y-10">
          <div className="flex items-center gap-6"><div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 shadow-2xl"><Settings2 size={40} /></div><div><h3 className="text-3xl font-black text-white tracking-tighter">Overlay Settings</h3><p className="text-gray-500 font-bold mt-1">오버레이 디자인을 커스터마이징하세요.</p></div></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/[0.02] p-8 rounded-[3rem] border border-white/5 space-y-6">
              <h4 className="text-xl font-black text-white flex items-center gap-3"><ExternalLink className="text-emerald-500" /> 주소 복사</h4>
              <div className="flex gap-3">
                <div className="flex-1 relative group"><input type={showUrl ? "text" : "password"} value={overlayUrl} readOnly className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-emerald-400 font-mono text-xs outline-none" /><button onClick={() => setShowUrl(!showUrl)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white transition-colors">{showUrl ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
                <button onClick={() => { navigator.clipboard.writeText(overlayUrl); notify('복사되었습니다.'); }} className="bg-emerald-500 text-black px-8 rounded-2xl font-black hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg"><Copy size={18}/> 복사</button>
              </div>
            </div>

            <div className="bg-white/[0.02] p-8 rounded-[3rem] border border-white/5 space-y-6">
              <h4 className="text-xl font-black text-white flex items-center gap-3"><Palette className="text-emerald-500" /> 디자인 설정</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                  <span className="text-sm font-bold text-gray-400">포인트 컬러</span>
                  <input type="color" value={overlayConfig.accentColor} onChange={e => setOverlayConfig({...overlayConfig, accentColor: e.target.value})} className="bg-transparent border-none w-8 h-8 cursor-pointer" />
                </div>
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                  <span className="text-sm font-bold text-gray-400">배경 투명도</span>
                  <input type="range" min="0" max="1" step="0.1" value={overlayConfig.opacity} onChange={e => setOverlayConfig({...overlayConfig, opacity: parseFloat(e.target.value)})} className="accent-emerald-500" />
                </div>
                <button onClick={handleSaveOverlay} className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black hover:scale-105 transition-all flex items-center justify-center gap-2"><Save size={18}/> 설정 저장</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}