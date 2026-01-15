import { useState } from 'react';
import { useBotStore } from '@/lib/store';
import { Gift, Users, Trophy, Play, CheckCircle2 } from 'lucide-react';

export default function DrawTab({ onSend }: { onSend: (msg: any) => void }) {
  const { draw } = useBotStore();
  
  const [target, setTarget] = useState<'all' | 'chat' | 'subscriber' | 'donation'>('chat');
  const [winnerCount, setWinnerCount] = useState(1);
  const [command, setCommand] = useState('!참여');
  const [minAmount, setMinAmount] = useState(1000);
  const [allowDuplicate, setAllowDuplicate] = useState(false);

  const startDraw = () => {
    onSend({
      type: 'startDraw',
      settings: { target, winnerCount, command, minAmount, allowDuplicate }
    });
  };

  const pickWinners = () => {
    onSend({ type: 'pickWinners' });
  };

  return (
    <div className="grid grid-cols-12 gap-8 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 왼쪽: 설정 패널 */}
      <div className="col-span-4 bg-white/5 border border-white/5 p-6 rounded-[2rem] h-fit">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Gift className="text-pink-500" /> 추첨 설정</h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 ml-1">추첨 대상</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'chat', label: '채팅 참여자' },
                { id: 'all', label: '전체 시청자' },
                { id: 'subscriber', label: '구독자 전용' },
                { id: 'donation', label: '후원자 전용' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTarget(t.id as any)}
                  className={`py-3 rounded-xl text-sm font-bold transition-all border ${target === t.id ? 'bg-pink-500 text-white border-pink-500' : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {target === 'chat' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 ml-1">참여 명령어</label>
              <input value={command} onChange={e => setCommand(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold" />
            </div>
          )}

          {target === 'donation' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 ml-1">최소 후원 금액</label>
              <input type="number" value={minAmount} onChange={e => setMinAmount(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold" />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 ml-1">당첨 인원 ({winnerCount}명)</label>
            <input 
              type="range" min="1" max="10" value={winnerCount} onChange={e => setWinnerCount(Number(e.target.value))} 
              className="w-full accent-pink-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-bold">
              <span>1명</span>
              <span>10명</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl">
            <input type="checkbox" checked={allowDuplicate} onChange={e => setAllowDuplicate(e.target.checked)} className="w-5 h-5 accent-pink-500 rounded" />
            <span className="text-sm font-bold text-gray-300">중복 당첨 허용</span>
          </div>

          <button 
            onClick={startDraw}
            disabled={draw.isCollecting}
            className={`w-full py-4 rounded-xl font-black text-lg shadow-xl transition-all ${draw.isCollecting ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-[1.02] text-white'}`}
          >
            {draw.isCollecting ? '참여자 모집 중...' : '추첨 시작 (모집)'}
          </button>
        </div>
      </div>

      {/* 오른쪽: 진행 상황 및 결과 */}
      <div className="col-span-8 space-y-6">
        {/* 상태 카드 */}
        <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] flex items-center justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           
           <div>
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
             <h2 className="text-4xl font-black text-white">
               {draw.status === 'idle' ? (draw.isCollecting ? 'Waiting for Participants...' : 'Ready') : (draw.status === 'rolling' ? 'Rolling...' : 'Completed')}
             </h2>
           </div>
           
           <div className="text-right z-10">
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Participants</p>
             <p className="text-5xl font-black tabular-nums text-pink-500">{draw.participantCount}</p>
           </div>
        </div>

        {/* 액션 버튼 */}
        {draw.isCollecting && (
          <div className="flex gap-4">
             <button onClick={pickWinners} className="flex-1 py-6 bg-emerald-500 text-black font-black text-2xl rounded-2xl hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3">
               <Trophy size={32} /> 당첨자 뽑기
             </button>
             <button onClick={() => onSend({ type: 'toggleOverlay', visible: true, view: 'draw' })} className="px-8 bg-white/10 rounded-2xl font-bold hover:bg-white/20">
               오버레이 띄우기
             </button>
          </div>
        )}

        {/* 결과 리스트 */}
        {draw.winners.length > 0 && (
          <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem]">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Trophy className="text-yellow-400" /> 당첨자 목록</h3>
            <div className="grid grid-cols-2 gap-4">
              {draw.winners.map((w: any, i: number) => (
                <div key={i} className="bg-black/40 border border-white/10 p-4 rounded-xl flex items-center gap-4 animate-in zoom-in duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-black font-black">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{w.nickname || w.nick}</p>
                    {w.amount && <p className="text-xs text-gray-400 font-mono">₩{w.amount.toLocaleString()}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
