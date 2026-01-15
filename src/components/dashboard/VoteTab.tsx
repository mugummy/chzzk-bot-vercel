import { useState, useEffect } from 'react';
import { useBotStore } from '@/lib/store';
import { Plus, Trash2, Play, Square, Activity, DollarSign, Vote, Users, List, RefreshCw, Eye, EyeOff, Trophy, RotateCcw } from 'lucide-react';
import { Modal } from './Modals';

export default function VoteTab({ onSend }: { onSend: (msg: any) => void }) {
  const { vote } = useBotStore();
  const currentVote = vote.currentVote;
  
  const [ballots, setBallots] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isBallotModalOpen, setIsBallotModalOpen] = useState(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [showNicknames, setShowNicknames] = useState(false);
  
  // 생성 폼 상태
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

    // 컴포넌트 마운트 시 기록 로드
    onSend({ type: 'getVoteHistory' });

    return () => {
        window.removeEventListener('voteBallotsResponse', handleBallots);
        window.removeEventListener('voteHistoryResponse', handleHistory);
        window.removeEventListener('voteWinnerResult', handleWinner);
    };
  }, []);

  const handleCreate = () => {
    const validOptions = options.filter(o => o.trim());
    if (!title.trim() || validOptions.length < 2) return alert('제목과 최소 2개의 항목이 필요합니다.');
    onSend({ type: 'createVote', title, options: validOptions, mode });
    setTitle(''); setOptions(['', '']);
  };

  const handleShowBallots = (voteId: string) => onSend({ type: 'getBallots', voteId });
  
  const handleReset = () => {
      if (confirm('현재 투표 상태를 초기화하고 오버레이를 끕니다. 계속하시겠습니까?')) {
          onSend({ type: 'resetVote' });
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 상단 2열 레이아웃: 생성폼 | 현재 상태 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* [좌측] 투표 생성 */}
          <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem]">
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Vote className="text-emerald-500" /> 새 투표 만들기</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">투표 제목</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="주제 입력" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setMode('normal')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${mode === 'normal' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'}`}><Users size={24} /><span className="font-bold">일반 투표</span></button>
                  <button onClick={() => setMode('donation')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${mode === 'donation' ? 'bg-pink-500/20 border-pink-500 text-pink-500' : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'}`}><DollarSign size={24} /><span className="font-bold">후원 투표</span></button>
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
                <button onClick={handleCreate} className="w-full py-4 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all">투표 생성</button>
              </div>
          </div>

          {/* [우측] 현재 투표 상태 */}
          <div className="relative">
              {(!currentVote) ? (
                  <div className="h-full bg-white/5 border border-white/5 p-8 rounded-[2rem] flex flex-col items-center justify-center text-gray-500">
                      <Activity size={48} className="mb-4 opacity-30" />
                      <p className="font-bold">진행 중인 투표가 없습니다.</p>
                  </div>
              ) : (
                  <div className="h-full bg-white/5 border border-white/5 p-8 rounded-[2rem] flex flex-col relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6 z-10">
                          <div>
                              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ${currentVote.status === 'active' ? 'bg-emerald-500 text-black animate-pulse' : 'bg-gray-500 text-white'}`}>
                                  {currentVote.status === 'active' ? 'Live' : 'Ended'}
                              </span>
                              <h2 className="text-3xl font-black">{currentVote.title}</h2>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={handleReset} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all" title="초기화"><RotateCcw size={20}/></button>
                              <button onClick={() => onSend({ type: 'toggleOverlay', visible: true, view: 'vote' })} className="px-3 py-2 bg-white/10 rounded-lg text-xs font-bold hover:bg-white/20">오버레이</button>
                          </div>
                      </div>

                      <div className="flex-1 space-y-3 z-10 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
                          {currentVote.options.map((opt: any, i: number) => {
                              const total = currentVote.options.reduce((acc: number, o: any) => acc + o.count, 0);
                              const percent = total === 0 ? 0 : Math.round((opt.count / total) * 100);
                              return (
                                  <div key={opt.id} className="relative h-14 bg-black/40 rounded-xl overflow-hidden border border-white/5">
                                      <div className="absolute top-0 left-0 h-full bg-emerald-500/20 transition-all duration-1000 ease-out" style={{ width: `${percent}%` }} />
                                      <div className="absolute inset-0 flex items-center justify-between px-4">
                                          <span className="font-bold"><span className="text-emerald-500 mr-2">{i + 1}.</span> {opt.label}</span>
                                          <span className="font-black">{opt.count}표 ({percent}%)</span>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>

                      <div className="mt-6 flex gap-3 z-10 pt-4 border-t border-white/10">
                          {currentVote.status === 'ready' && <button onClick={() => onSend({ type: 'startVote' })} className="flex-1 py-3 bg-emerald-500 text-black font-black rounded-xl">시작</button>}
                          {currentVote.status === 'active' && <button onClick={() => onSend({ type: 'endVote' })} className="flex-1 py-3 bg-red-500 text-white font-black rounded-xl">마감</button>}
                          <button onClick={() => handleShowBallots(currentVote.id)} className="px-4 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20">투표자</button>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* [하단] 투표 기록 */}
      <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem]">
          <h3 className="text-xl font-black mb-6 flex items-center gap-3"><List className="text-gray-400" /> 투표 기록</h3>
          <div className="space-y-3">
              {history.length === 0 ? (
                  <p className="text-center text-gray-500 py-10">기록이 없습니다.</p>
              ) : (
                  history.map((v) => (
                      <div key={v.id} className="bg-black/20 p-5 rounded-2xl flex items-center justify-between border border-white/5 hover:border-white/10 transition-all">
                          <div>
                              <h4 className="font-bold text-lg">{v.title}</h4>
                              <p className="text-xs text-gray-500 mt-1">{new Date(v.created_at).toLocaleString()} • {v.mode === 'normal' ? '일반' : '후원'}</p>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => handleShowBallots(v.id)} className="px-4 py-2 bg-white/5 rounded-lg text-sm font-bold hover:bg-white/10">참여자</button>
                              <button onClick={() => { const c = prompt("몇 명을 추첨할까요?", "1"); if(c) onSend({type:'pickVoteWinner', voteId:v.id, count:Number(c), optionId:null}); }} className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-sm font-bold hover:bg-emerald-500 hover:text-black">추첨</button>
                              <button onClick={() => { if(confirm('삭제하시겠습니까?')) { onSend({type:'deleteVote', voteId:v.id}); setTimeout(() => onSend({type:'getVoteHistory'}), 500); } }} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={18}/></button>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* 모달들 (Ballot, Winner) */}
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
                          <span className="font-bold">{showNicknames ? b.nickname : `익명 사용자`}</span>
                          <span className="text-emerald-500 font-mono">{b.amount}표</span>
                      </div>
                  ))}
              </div>
          </div>
      </Modal>

      <Modal isOpen={isWinnerModalOpen} onClose={() => setIsWinnerModalOpen(false)} title="🏆 당첨자 결과">
          <div className="space-y-4 py-4">
              {winners.map((w, i) => (
                  <div key={i} className="bg-emerald-500/10 p-4 rounded-xl flex items-center gap-4 border border-emerald-500/20">
                      <div className="w-8 h-8 bg-emerald-500 text-black rounded-full flex items-center justify-center font-black">{i+1}</div>
                      <span className="text-xl font-bold text-white">{w.nickname}</span>
                  </div>
              ))}
          </div>
      </Modal>
    </div>
  );
}