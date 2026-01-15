import { useState, useEffect } from 'react';
import { useBotStore } from '@/lib/store';
import { Plus, Trash2, Play, Square, Activity, DollarSign, Vote, Users, List, RefreshCw, Eye, EyeOff, Trophy, ChevronRight } from 'lucide-react';
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
  
  // 생성 폼
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
    setTitle(''); setOptions(['', '']);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-4 border-b border-white/10 pb-4">
          <button onClick={() => setActiveView('current')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeView === 'current' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>진행 중인 투표</button>
          <button onClick={() => setActiveView('history')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeView === 'history' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>투표 기록</button>
      </div>

      {activeView === 'current' && (
          <>
            {(!currentVote || currentVote.status === 'ended') ? (
                <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem]">
                  <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Vote className="text-emerald-500" /> 새 투표 만들기</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">투표 제목</label>
                      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 오늘 저녁 메뉴는?" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setMode('normal')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${mode === 'normal' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'}`}><Users size={24} /><span className="font-bold">일반 투표 (1인 1표)</span></button>
                      <button onClick={() => setMode('donation')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${mode === 'donation' ? 'bg-pink-500/20 border-pink-500 text-pink-500' : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'}`}><DollarSign size={24} /><span className="font-bold">후원 투표 (금액 비례)</span></button>
                    </div>
                    <div className="space-y-3">
                      {options.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <input value={opt} onChange={e => {const n=[...options]; n[i]=e.target.value; setOptions(n);}} placeholder={`항목 ${i + 1}`} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" />
                          {options.length > 2 && <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="w-12 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white"><Trash2 size={20} /></button>}
                        </div>
                      ))}
                      <button onClick={() => setOptions([...options, ''])} className="w-full py-3 rounded-xl border border-dashed border-white/20 text-gray-400 hover:text-white"><Plus size={18} /> 항목 추가</button>
                    </div>
                    <button onClick={handleCreate} className="w-full py-4 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all">투표 생성하기</button>
                  </div>
                </div>
            ) : (
                <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] relative overflow-hidden">
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 bg-emerald-500 text-black animate-pulse">Live</span>
                            <h2 className="text-4xl font-black">{currentVote.title}</h2>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => onSend({ type: 'getBallots', voteId: currentVote.id })} className="px-4 py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/20">투표자 보기</button>
                            <button onClick={() => onSend({ type: 'toggleOverlay', visible: true, view: 'vote' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/20">오버레이</button>
                        </div>
                    </div>
                    <div className="space-y-4 mb-8 relative z-10">
                        {currentVote.options.map((opt: any, i: number) => {
                            const total = currentVote.options.reduce((acc: number, o: any) => acc + o.count, 0);
                            const percent = total === 0 ? 0 : Math.round((opt.count / total) * 100);
                            return (
                                <div key={opt.id} className="relative h-16 bg-black/40 rounded-2xl overflow-hidden border border-white/5">
                                    <div className="absolute top-0 left-0 h-full bg-emerald-500/20 transition-all duration-1000 ease-out" style={{ width: `${percent}%` }} />
                                    <div className="absolute inset-0 flex items-center justify-between px-6">
                                        <span className="font-bold text-lg"><span className="text-emerald-500 mr-3">{i + 1}.</span> {opt.label}</span>
                                        <span className="font-black text-xl">{opt.count}표 ({percent}%)</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex gap-4 relative z-10">
                        {currentVote.status === 'ready' && <button onClick={() => onSend({ type: 'startVote' })} className="flex-1 py-4 bg-emerald-500 text-black font-black rounded-xl">시작</button>}
                        {currentVote.status === 'active' && <button onClick={() => onSend({ type: 'endVote' })} className="flex-1 py-4 bg-red-500 text-white font-black rounded-xl">마감</button>}
                        {currentVote.status === 'ended' && <button onClick={() => setActiveView('history')} className="flex-1 py-4 bg-gray-600 text-white font-black rounded-xl flex items-center justify-center gap-2">기록으로 이동 <ChevronRight /></button>}
                    </div>
                </div>
            )}
          </>
      )}

      {activeView === 'history' && (
          <div className="space-y-4">
              {history.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 bg-white/5 rounded-[2rem] border border-white/5">
                      <RefreshCw size={48} className="mx-auto mb-4 opacity-50" />
                      <p>투표 기록이 없습니다.</p>
                  </div>
              ) : (
                  history.map((v) => (
                      <div key={v.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-white/10 transition-all">
                          <div>
                              <h4 className="text-xl font-black mb-1">{v.title}</h4>
                              <p className="text-xs text-gray-500">{new Date(v.created_at).toLocaleString()} • {v.mode === 'normal' ? '일반' : '후원'} 투표</p>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => onSend({ type: 'getBallots', voteId: v.id })} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white"><List size={20}/></button>
                              <button onClick={() => { const c = prompt("추첨 인원?", "1"); if(c) onSend({type:'pickVoteWinner', voteId:v.id, count:Number(c), optionId:null}); }} className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all"><Trophy size={20}/></button>
                              <button onClick={() => { if(confirm('삭제하시겠습니까?')) onSend({type:'deleteVote', voteId:v.id}); }} className="p-3 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white"><Trash2 size={20}/></button>
                          </div>
                      </div>
                  ))
              )}
          </div>
      )}

      {/* 투표자 보기 모달 */}
      <Modal isOpen={isBallotModalOpen} onClose={() => setIsBallotModalOpen(false)} title="투표자 명단">
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <span className="font-bold text-white">총 {ballots.length}명</span>
                  <button onClick={() => setShowNicknames(!showNicknames)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                      {showNicknames ? <EyeOff size={16} /> : <Eye size={16} />} {showNicknames ? '닉네임 가리기' : '닉네임 보기'}
                  </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
                  {ballots.map((b, i) => (
                      <div key={i} className="flex justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                          <span className="font-bold">{showNicknames ? b.nickname : `사용자_${b.userIdHash.substring(0,4)}`}</span>
                          <span className="text-emerald-500 font-mono">{b.amount}표</span>
                      </div>
                  ))}
              </div>
          </div>
      </Modal>

      {/* 추첨 결과 모달 */}
      <Modal isOpen={isWinnerModalOpen} onClose={() => setIsWinnerModalOpen(false)} title="🏆 투표 참여자 추첨 결과">
          <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 gap-4">
                  {winners.map((w, i) => (
                      <div key={i} className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex items-center gap-6 animate-in zoom-in">
                          <div className="w-12 h-12 bg-emerald-500 text-black rounded-full flex items-center justify-center font-black text-xl">{i+1}</div>
                          <div className="text-2xl font-black text-white">{w.nickname}</div>
                      </div>
                  ))}
              </div>
              <button onClick={() => setIsWinnerModalOpen(false)} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all">닫기</button>
          </div>
      </Modal>
    </div>
  );
}
