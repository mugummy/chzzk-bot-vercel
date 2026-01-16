import { useState, useEffect } from 'react';
import { useBotStore } from '@/lib/store';
import { Plus, Trash2, Play, Square, Activity, DollarSign, Vote, Users, List, RefreshCw, Eye, EyeOff, Trophy, RotateCcw, ChevronRight, X } from 'lucide-react';
import { Modal } from './Modals';

export default function VoteTab({ onSend }: { onSend: (msg: any) => void }) {
  const { vote } = useBotStore();
  const currentVote = vote.currentVote;
  
  const [activeView, setActiveView] = useState<'current' | 'history'>('current');
  const [ballots, setBallots] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isBallotModalOpen, setIsBallotModalOpen] = useState(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [showNicknames, setShowNicknames] = useState(false);
  
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [mode, setMode] = useState<'normal' | 'donation'>('normal');

  useEffect(() => {
    const handleBallots = (e: any) => { setBallots(e.detail); setIsBallotModalOpen(true); };
    const handleHistory = (e: any) => { setHistory(e.detail); };
    const handleWinner = (e: any) => { setWinners(e.detail); setIsWinnerModalOpen(true); };

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
    // 생성 후 입력 폼은 유지할지 비울지 선택 사항이나, 사용자 경험상 비우는게 깔끔함.
    setTitle(''); setOptions(['', '']);
  };

  const handleShowBallots = (voteId: string) => onSend({ type: 'getBallots', voteId });
  
  const handleReset = () => {
      if (confirm('현재 투표를 초기화하시겠습니까? (기록에는 남습니다)')) {
          onSend({ type: 'resetVote' });
          // 입력 폼 초기화
          setTitle('');
          setOptions(['', '']);
      }
  };

  const handleMoveToHistory = () => {
      onSend({ type: 'resetVote' }); 
      setActiveView('history');      
      setTimeout(() => onSend({ type: 'getVoteHistory' }), 500); // 딜레이 늘림
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex gap-4 border-b border-white/10 pb-4">
          <button onClick={() => setActiveView('current')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeView === 'current' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>진행 중인 투표</button>
          <button onClick={() => setActiveView('history')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeView === 'history' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>투표 기록</button>
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
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${currentVote.status === 'active' ? 'bg-emerald-500 text-black animate-pulse' : 'bg-gray-600 text-white'}`}>
                                          {currentVote.status === 'active' ? 'Live' : 'Ended'}
                                      </span>
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
                                              <div className="text-right">
                                                  <span className="font-black text-xl tabular-nums block">{count}</span>
                                                  <span className="text-[10px] text-gray-500 font-bold">{percent}%</span>
                                              </div>
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
                                      <button onClick={() => { const c = prompt("몇 명을 추첨할까요?", "1"); if(c) onSend({type:'pickVoteWinner', voteId:currentVote.id, count:Number(c), optionId:null}); }} className="px-6 bg-emerald-500/20 text-emerald-500 font-black rounded-2xl hover:bg-emerald-500 hover:text-black transition-all border border-emerald-500/50 flex items-center gap-2"><Trophy size={18} /> 결과 추첨</button>
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
              {history.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 bg-white/5 rounded-[2rem] border border-white/5">
                      <RefreshCw size={48} className="mx-auto mb-4 opacity-50" />
                      <p>투표 기록이 없습니다.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {history.map((v) => (
                          <div key={v.id} className="bg-black/20 p-6 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <h4 className="font-bold text-xl text-white mb-1">{v.title}</h4>
                                      <p className="text-xs text-gray-500">{new Date(v.created_at).toLocaleString()} • {v.mode === 'normal' ? '일반' : '후원'}</p>
                                  </div>
                                  <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-all">
                                      <button onClick={() => { if(confirm('삭제하시겠습니까?')) { onSend({type:'deleteVote', voteId:v.id}); setTimeout(() => onSend({type:'getVoteHistory'}), 500); } }} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg"><Trash2 size={18}/></button>
                                  </div>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden flex mb-4">
                                  <div className="h-full bg-emerald-500 w-full opacity-50" />
                              </div>
                              <div className="flex gap-2 mt-auto">
                                  <button onClick={() => handleShowBallots(v.id)} className="flex-1 py-3 bg-white/5 rounded-xl text-sm font-bold hover:bg-white/10">투표자 목록</button>
                                  <button onClick={() => { const c = prompt("몇 명을 추첨할까요?", "1"); if(c) onSend({type:'pickVoteWinner', voteId:v.id, count:Number(c), optionId:null}); }} className="flex-1 py-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-sm font-bold hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-2"><Trophy size={16}/> 추첨하기</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* 투표자 보기 모달 */}
      <Modal isOpen={isBallotModalOpen} onClose={() => setIsBallotModalOpen(false)} title="투표자 상세 현황">
          <div className="space-y-6">
              <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="font-bold text-white">총 {ballots.length}명 참여</span>
                  <button onClick={() => setShowNicknames(!showNicknames)} className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all">
                      {showNicknames ? <EyeOff size={14} /> : <Eye size={14} />} {showNicknames ? '닉네임 가리기' : '닉네임 보기'}
                  </button>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-6 pr-2">
                  {/* 현재 투표 정보가 있으면 항목별 그룹화 */}
                  {currentVote && currentVote.options ? (
                      currentVote.options.map((opt: any) => {
                          const voters = ballots.filter(b => b.optionId === opt.id);
                          const percent = ballots.length === 0 ? 0 : Math.round((voters.length / ballots.length) * 100);
                          const label = typeof opt === 'string' ? opt : (opt.label || '항목');

                          return (
                              <div key={opt.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                  <div className="flex justify-between items-end mb-2">
                                      <h4 className="font-bold text-lg text-white">{label}</h4>
                                      <span className="text-xs font-bold text-emerald-500">{voters.length}명 ({percent}%)</span>
                                  </div>
                                  
                                  {/* 퍼센트 바 */}
                                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mb-4">
                                      <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
                                  </div>

                                  {/* 투표자 리스트 */}
                                  {voters.length === 0 ? (
                                      <p className="text-xs text-gray-600 italic">투표자가 없습니다.</p>
                                  ) : (
                                      <div className="grid grid-cols-2 gap-2">
                                          {voters.map((b, idx) => (
                                              <div key={idx} className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg">
                                                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-gray-400">{idx+1}</div>
                                                  <span className="text-sm font-medium text-gray-300 truncate">{showNicknames ? b.nickname : `익명(${b.userIdHash.substring(0,4)})`}</span>
                                                  {b.amount > 1 && <span className="text-[10px] text-yellow-500 ml-auto font-mono">+{b.amount}</span>}
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          );
                      })
                  ) : (
                      // 투표 기록에서 열어서 옵션 정보가 없을 때: 전체 리스트 표시
                      <div className="grid grid-cols-2 gap-2">
                          {ballots.map((b, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg">
                                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-gray-400">{idx+1}</div>
                                  <span className="text-sm font-medium text-gray-300 truncate">{showNicknames ? b.nickname : `익명(${b.userIdHash.substring(0,4)})`}</span>
                              </div>
                          ))}
                          {ballots.length === 0 && <p className="col-span-2 text-center text-gray-500">투표자가 없습니다.</p>}
                      </div>
                  )}
              </div>
          </div>
      </Modal>

      <Modal isOpen={isWinnerModalOpen} onClose={() => setIsWinnerModalOpen(false)} title="🏆 당첨자 결과">
          <div className="space-y-4 py-6 text-center">
              <Trophy size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
              {winners.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                      {winners.map((w, i) => (
                          <div key={i} className="bg-gradient-to-r from-emerald-500/20 to-transparent border border-emerald-500/30 p-4 rounded-xl flex items-center gap-4 animate-in zoom-in">
                              <div className="w-10 h-10 bg-emerald-500 text-black rounded-full flex items-center justify-center font-black text-lg shadow-lg">{i+1}</div>
                              <div className="text-xl font-black text-white">{w.nickname}</div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-gray-500">당첨자가 없습니다. (참여자가 없거나 추첨 오류)</p>
              )}
              <button onClick={() => setIsWinnerModalOpen(false)} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all mt-6">닫기</button>
          </div>
      </Modal>
    </div>
  );
}
