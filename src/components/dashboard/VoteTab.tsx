import { useState, useEffect } from 'react';
import { useBotStore } from '@/lib/store';
import { Plus, Trash2, Play, Square, Activity, DollarSign, Vote, Users, List, RefreshCw, Eye, EyeOff, Trophy, RotateCcw, ChevronRight, X, CheckCircle } from 'lucide-react';
import { Modal } from './Modals';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoteTab({ onSend }: { onSend: (msg: any) => void }) {
  const { vote } = useBotStore();
  const currentVote = vote.currentVote;
  
  const [activeView, setActiveView] = useState<'current' | 'history'>('current');
  const [ballots, setBallots] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  const [isBallotModalOpen, setIsBallotModalOpen] = useState(false);
  const [isPickModalOpen, setIsPickModalOpen] = useState(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  
  const [targetVoteId, setTargetVoteId] = useState<string | null>(null);
  const [pickCount, setPickCount] = useState(1);
  const [pickFilter, setPickFilter] = useState<'all' | 'win' | 'lose'>('all');

  const [winners, setWinners] = useState<any[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  
  const [showNicknames, setShowNicknames] = useState(false);
  
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [mode, setMode] = useState<'normal' | 'donation'>('normal');

  useEffect(() => {
    const handleBallots = (e: any) => { setBallots(e.detail); setIsBallotModalOpen(true); };
    const handleHistory = (e: any) => { setHistory(e.detail); };
    
    const handleWinner = (e: any) => { 
        setWinners(e.detail); 
        setIsPickModalOpen(false); 
        setIsWinnerModalOpen(true); 
        setIsRolling(true);
        setTimeout(() => setIsRolling(false), 4000); // 4초 롤링
    };

    window.addEventListener('voteBallotsResponse', handleBallots);
    window.addEventListener('voteHistoryResponse', handleHistory);
    window.addEventListener('voteWinnerResult', handleWinner);

    if (activeView === 'history') onSend({ type: 'getVoteHistory' });

    return () => {
        window.removeEventListener('voteBallotsResponse', handleBallots);
        window.removeEventListener('voteHistoryResponse', handleHistory);
        window.removeEventListener('voteWinnerResult', handleWinner);
    };
  }, [activeView]);

  const handleCreate = () => {
    const validOptions = options.filter(o => o.trim());
    if (!title.trim() || validOptions.length < 2) return alert('제목과 최소 2개의 항목이 필요합니다.');
    onSend({ type: 'createVote', title, options: validOptions, mode });
    setTitle(''); setOptions(['', '']);
  };

  const handleShowBallots = (voteId: string) => onSend({ type: 'getBallots', voteId });
  
  const handleReset = () => {
      if (confirm('현재 투표를 초기화하시겠습니까? (기록에는 남습니다)')) {
          onSend({ type: 'resetVote' });
          setTitle(''); setOptions(['', '']);
      }
  };

  const handleMoveToHistory = () => {
      onSend({ type: 'resetVote' }); 
      setActiveView('history');      
      setTimeout(() => onSend({ type: 'getVoteHistory' }), 1000); 
  };

  const openPickModal = (voteId: string) => {
      setTargetVoteId(voteId);
      setPickCount(1);
      setPickFilter('all');
      setIsPickModalOpen(true);
  };

  const executePick = () => {
      if (!targetVoteId) return;
      onSend({ type: 'pickVoteWinner', voteId: targetVoteId, count: pickCount, filter: pickFilter, optionId: null });
  };

  const sliderStyle = {
      background: `linear-gradient(to right, #10b981 0%, #10b981 ${(pickCount - 1) * (100 / 9)}%, #374151 ${(pickCount - 1) * (100 / 9)}%, #374151 100%)`
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex gap-4 border-b border-white/10 pb-4">
          <button onClick={() => setActiveView('current')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeView === 'current' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>진행 중인 투표</button>
          <button onClick={() => { setActiveView('history'); onSend({ type: 'getVoteHistory' }); }} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeView === 'history' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>투표 기록</button>
      </div>

      {activeView === 'current' && (
          <div className="grid grid-cols-12 gap-8">
              <div className="col-span-4 bg-white/5 border border-white/5 p-8 rounded-[2rem] h-fit">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-3"><Vote className="text-emerald-500" /> 새 투표</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">주제</label>
                      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="투표 제목 입력" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setMode('normal')} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${mode === 'normal' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'}`}><Users size={20} /><span className="text-xs font-bold">일반 (1인1표)</span></button>
                      <button onClick={() => setMode('donation')} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${mode === 'donation' ? 'bg-pink-500/20 border-pink-500 text-pink-500' : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'}`}><DollarSign size={20} /><span className="text-xs font-bold">후원 (금액비례)</span></button>
                    </div>
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-400 ml-1">항목</label>
                      {options.map((opt, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <span className="text-xs text-gray-500 w-4 font-bold">{i+1}</span>
                          <input value={opt} onChange={e => {const n=[...options]; n[i]=e.target.value; setOptions(n);}} placeholder={`항목 ${i + 1}`} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" />
                          {options.length > 2 && <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-500"><X size={16} /></button>}
                        </div>
                      ))}
                      <div className="flex justify-end">
                          <button onClick={() => setOptions([...options, ''])} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold flex items-center gap-2 transition-all"><Plus size={14} /> 항목 추가</button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCreate} className="flex-[3] py-4 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">투표 시작하기</button>
                        <button onClick={handleReset} className="flex-1 py-4 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20" title="초기화"><RotateCcw size={20} className="mx-auto" /></button>
                    </div>
                  </div>
              </div>

              <div className="col-span-8 relative">
                  {(!currentVote) ? (
                      <div className="h-full bg-white/5 border border-white/5 p-8 rounded-[2rem] flex flex-col items-center justify-center text-gray-500">
                          <Activity size={48} className="mb-4 opacity-30" />
                          <p className="font-bold">진행 중인 투표가 없습니다.</p>
                          <p className="text-sm mt-2">좌측에서 투표를 생성해주세요.</p>
                      </div>
                  ) : (
                      <div className="h-full bg-white/5 border border-white/5 p-8 rounded-[2rem] flex flex-col relative overflow-hidden">
                          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                          <div className="flex justify-between items-start mb-8 z-10">
                              <div>
                                  <div className="flex items-center gap-3 mb-2">
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${currentVote.status === 'active' ? 'bg-emerald-500 text-black animate-pulse' : 'bg-gray-600 text-white'}`}>{currentVote.status === 'active' ? 'Live' : 'Ended'}</span>
                                      <span className="text-xs font-bold text-gray-400">{currentVote.mode === 'normal' ? '1인 1표' : '후원 금액 비례'}</span>
                                  </div>
                                  <h2 className="text-4xl font-black tracking-tight">{currentVote.title}</h2>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={handleReset} className="p-2 bg-white/5 rounded-lg hover:bg-red-500 hover:text-white text-gray-500 transition-all" title="초기화"><RotateCcw size={18}/></button>
                                  <button onClick={() => onSend({ type: 'toggleOverlay', visible: true, view: 'vote' })} className="px-3 py-2 bg-white/10 rounded-lg text-xs font-bold hover:bg-white/20">오버레이 띄우기</button>
                              </div>
                          </div>
                          <div className="flex-1 space-y-4 z-10 overflow-y-auto custom-scrollbar pr-2 max-h-[500px]">
                              {currentVote.options && currentVote.options.map((opt: any, i: number) => {
                                  const total = currentVote.totalParticipants || 1; 
                                  const count = opt.count || 0;
                                  const percent = total === 0 ? 0 : Math.round((count / total) * 100);
                                  const label = typeof opt === 'string' ? opt : (opt.label || `항목 ${i+1}`);
                                  return (
                                      <div key={opt.id || i} className="group relative h-16 bg-black/40 rounded-2xl overflow-hidden border border-white/5 hover:border-emerald-500/30 transition-all">
                                          <div className="absolute top-0 left-0 h-full bg-emerald-500/20 transition-all duration-1000 ease-out" style={{ width: `${percent}%` }} />
                                          <div className="absolute inset-0 flex items-center justify-between px-6">
                                              <span className="font-bold text-lg flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-emerald-500 font-black">{i + 1}</span> {label}</span>
                                              <div className="text-right"><span className="font-black text-xl tabular-nums block">{count}</span><span className="text-[10px] text-gray-500 font-bold">{percent}%</span></div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                          <div className="mt-8 flex gap-3 z-10 pt-6 border-t border-white/10">
                              {currentVote.status === 'ready' && <button onClick={() => onSend({ type: 'startVote' })} className="flex-1 py-4 bg-emerald-500 text-black font-black rounded-2xl hover:scale-[1.02] transition-all">투표 시작</button>}
                              {currentVote.status === 'active' && <button onClick={() => onSend({ type: 'endVote' })} className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all">투표 마감</button>}
                              {currentVote.status === 'ended' && (
                                  <>
                                      <button onClick={handleMoveToHistory} className="flex-1 py-4 bg-gray-700 text-white font-bold rounded-2xl hover:bg-gray-600 transition-all flex items-center justify-center gap-2">기록으로 이동 <ChevronRight size={18} /></button>
                                      <button onClick={() => openPickModal(currentVote.id)} className="px-6 bg-emerald-500/20 text-emerald-500 font-black rounded-2xl hover:bg-emerald-500 hover:text-black transition-all border border-emerald-500/50 flex items-center gap-2"><Trophy size={18} /> 결과 추첨</button>
                                  </>
                              )}
                              <button onClick={() => handleShowBallots(currentVote.id)} className="px-5 bg-white/5 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/5" title="투표자 보기"><List size={20}/></button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {activeView === 'history' && (
          <div className="space-y-4">
              {history.length === 0 ? <div className="text-center py-20 text-gray-500 bg-white/5 rounded-[2rem] border border-white/5"><RefreshCw size={48} className="mx-auto mb-4 opacity-50" /><p>투표 기록이 없습니다.</p></div> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {history.map((v) => (
                          <div key={v.id} className="bg-black/20 p-6 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                              <div className="flex justify-between items-start mb-4">
                                  <div><h4 className="font-bold text-xl text-white mb-1">{v.title}</h4><p className="text-xs text-gray-500">{new Date(v.created_at).toLocaleString()} • {v.mode === 'normal' ? '일반' : '후원'}</p></div>
                                  <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-all"><button onClick={() => { if(confirm('삭제하시겠습니까?')) { onSend({type:'deleteVote', voteId:v.id}); setTimeout(() => onSend({type:'getVoteHistory'}), 500); } }} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg"><Trash2 size={18}/></button></div>
                              </div>
                              <div className="flex gap-2 mt-auto">
                                  <button onClick={() => handleShowBallots(v.id)} className="flex-1 py-3 bg-white/5 rounded-xl text-sm font-bold hover:bg-white/10">투표자 목록</button>
                                  <button onClick={() => openPickModal(v.id)} className="flex-1 py-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-sm font-bold hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-2"><Trophy size={16}/> 추첨하기</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      <Modal isOpen={isBallotModalOpen} onClose={() => setIsBallotModalOpen(false)} title="투표자 상세 현황">
          <div className="space-y-6">
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="font-bold text-white">총 {ballots.length}명 참여</span>
                  <button onClick={() => setShowNicknames(!showNicknames)} className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all">{showNicknames ? <EyeOff size={14} /> : <Eye size={14} />} {showNicknames ? '닉네임 가리기' : '닉네임 보기'}</button>
              </div>
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-6 pr-2">
                  {currentVote && currentVote.options ? currentVote.options.map((opt: any) => {
                      const voters = ballots.filter(b => b.optionId === opt.id);
                      const percent = ballots.length === 0 ? 0 : Math.round((voters.length / ballots.length) * 100);
                      return (
                          <div key={opt.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <div className="flex justify-between items-end mb-2"><h4 className="font-bold text-lg text-white">{opt.label || '항목'}</h4><span className="text-xs font-bold text-emerald-500">{voters.length}명 ({percent}%)</span></div>
                              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mb-4"><div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} /></div>
                              <div className="grid grid-cols-2 gap-2">{voters.map((b, idx) => (<div key={idx} className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg"><div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-gray-400">{idx+1}</div><span className="text-sm font-medium text-gray-300 truncate">{showNicknames ? b.nickname : `익명(${b.userIdHash.substring(0,4)})`}</span></div>))}</div>
                          </div>
                      );
                  }) : (
                      <div className="grid grid-cols-2 gap-2">{ballots.map((b, idx) => (<div key={idx} className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg"><span className="text-sm font-medium text-gray-300 truncate">{showNicknames ? b.nickname : `익명(${b.userIdHash.substring(0,4)})`}</span></div>))}</div>
                  )}
              </div>
          </div>
      </Modal>

      <Modal isOpen={isPickModalOpen} onClose={() => setIsPickModalOpen(false)} title="당첨자 추첨 설정">
          <div className="space-y-8 py-4">
              <div>
                  <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">추첨 인원 ({pickCount}명)</label>
                  <input type="range" min="1" max="10" value={pickCount} onChange={e => setPickCount(Number(e.target.value))} className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-gray-700" style={sliderStyle} />
                  <div className="flex justify-between text-[10px] text-gray-500 font-bold mt-2"><span>1명</span><span>10명</span></div>
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">추첨 대상 (Filter)</label>
                  <div className="grid grid-cols-3 gap-3">
                      {[ { id: 'all', label: '전체 참여자' }, { id: 'win', label: '이긴 항목 (승)' }, { id: 'lose', label: '진 항목 (패)' } ].map((f) => (
                          <button key={f.id} onClick={() => setPickFilter(f.id as any)} className={`py-4 rounded-xl text-sm font-black border transition-all ${pickFilter === f.id ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg' : 'bg-black/20 border-white/10 text-gray-400 hover:text-white'}`}>{f.label}</button>
                      ))}
                  </div>
              </div>
              <button onClick={executePick} className="w-full py-5 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 text-lg flex items-center justify-center gap-2"><Trophy size={24}/> 추첨 시작</button>
          </div>
      </Modal>

      <AnimatePresence>
          {isWinnerModalOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl">
                  <div className="relative w-full max-w-5xl p-10 flex flex-col items-center">
                      <button onClick={() => setIsWinnerModalOpen(false)} className="absolute top-0 right-0 p-4 text-gray-500 hover:text-white"><X size={32} /></button>
                      {isRolling ? (
                          <div className="flex flex-col items-center gap-12 w-full">
                              <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter drop-shadow-2xl">Drawing...</h2>
                              <div className="relative w-full max-w-3xl h-64 border-y-4 border-emerald-500/50 bg-black/50 overflow-hidden flex items-center justify-center">
                                  <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10 pointer-events-none" />
                                  <motion.div animate={{ y: [-1000, 0] }} transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }} className="flex flex-col gap-16 py-10 items-center opacity-50 blur-sm">
                                      {Array.from({length: 20}).map((_, k) => <div key={k} className="text-5xl font-black text-gray-400">???</div>)}
                                  </motion.div>
                              </div>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center gap-10 w-full animate-in zoom-in duration-500">
                              <div className="flex items-center gap-4"><Trophy size={80} className="text-yellow-400 animate-bounce" /><h2 className="text-7xl font-black text-white italic uppercase tracking-tighter drop-shadow-2xl">Winners!</h2></div>
                              <div className={`grid gap-8 w-full ${winners.length > 3 ? 'grid-cols-4' : 'grid-cols-' + winners.length} justify-center`}>
                                  {winners.map((w, i) => (
                                      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.2 }} key={i} className="bg-gradient-to-br from-emerald-500/20 to-black border border-emerald-500/50 p-10 rounded-[3rem] flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform">
                                          <div className="w-20 h-20 bg-emerald-500 text-black rounded-full flex items-center justify-center font-black text-3xl shadow-xl">{i+1}</div>
                                          <div className="text-4xl font-black text-white text-center break-all leading-tight">{w.nickname}</div>
                                      </motion.div>
                                  ))}
                              </div>
                              <button onClick={() => setIsWinnerModalOpen(false)} className="px-12 py-4 bg-white/10 rounded-full font-bold hover:bg-white/20 transition-all mt-10">닫기</button>
                          </div>
                      )}
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}