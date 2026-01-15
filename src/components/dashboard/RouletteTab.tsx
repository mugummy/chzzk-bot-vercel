import { useState, useEffect } from 'react';
import { useBotStore } from '@/lib/store';
import { Disc, Plus, Trash2, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RouletteTab({ onSend }: { onSend: (msg: any) => void }) {
  const { roulette } = useBotStore();
  const [items, setItems] = useState<any[]>(roulette.items.length ? roulette.items : [{ id: '1', label: '꽝', weight: 1, color: '#ef4444' }]);
  const [newItem, setNewItem] = useState('');
  const [newWeight, setNewWeight] = useState(1);
  
  // 회전 상태 (서버 상태가 없으므로 로컬에서 에뮬레이션하되 이벤트 수신으로 동작)
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'];

  useEffect(() => {
      // 스토어 업데이트 시 로컬 상태 동기화
      if (roulette.items.length > 0) setItems(roulette.items);
  }, [roulette.items]);

  useEffect(() => {
      const handleSpinResult = (e: any) => {
          const selectedItem = e.detail.selectedItem;
          // 회전 계산
          const index = items.findIndex(i => i.id === selectedItem.id);
          if (index === -1) return;
          
          setIsSpinning(true);
          setResult(null);

          const segmentAngle = 360 / items.length;
          // 12시 방향 기준 (Pointer)
          const targetAngle = 1800 + (360 - (index * segmentAngle)) - (segmentAngle / 2);
          
          setRotation(targetAngle);
          
          setTimeout(() => {
              setIsSpinning(false);
              setResult(selectedItem);
          }, 5000);
      };

      window.addEventListener('spinRouletteResult', handleSpinResult);
      return () => window.removeEventListener('spinRouletteResult', handleSpinResult);
  }, [items]);

  const addItem = () => {
    if (!newItem.trim()) return;
    const item = {
      id: Date.now().toString(),
      label: newItem,
      weight: newWeight,
      color: colors[items.length % colors.length]
    };
    const next = [...items, item];
    setItems(next);
    setNewItem('');
    onSend({ type: 'updateRoulette', items: next });
  };

  const removeItem = (id: string) => {
    const next = items.filter(i => i.id !== id);
    setItems(next);
    onSend({ type: 'updateRoulette', items: next });
  };

  const spin = () => {
    onSend({ type: 'spinRoulette' });
    onSend({ type: 'toggleOverlay', visible: true, view: 'roulette' });
  };

  const reset = () => {
      if (confirm('룰렛을 초기화하시겠습니까?')) {
          onSend({ type: 'resetRoulette' });
          setRotation(0);
          setResult(null);
      }
  };

  return (
    <div className="grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="col-span-5 bg-white/5 border border-white/5 p-6 rounded-[2rem] h-fit">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black flex items-center gap-2"><Disc className="text-indigo-500" /> 룰렛 설정</h3>
            <button onClick={reset} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><RotateCcw size={18}/></button>
        </div>
        
        <div className="flex gap-2 mb-6">
          <input 
            value={newItem} onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="항목 이름"
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-indigo-500 outline-none"
          />
          <input 
            type="number" value={newWeight} onChange={e => setNewWeight(Number(e.target.value))}
            className="w-20 bg-black/40 border border-white/10 rounded-xl px-2 py-3 text-center text-white font-bold"
          />
          <button onClick={addItem} className="p-3 bg-indigo-500 rounded-xl text-white hover:bg-indigo-400 transition-all">
            <Plus />
          </button>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="flex-1 font-bold">{item.label}</span>
              <span className="text-xs text-gray-500 font-mono bg-white/5 px-2 py-1 rounded">x{item.weight}</span>
              <button onClick={() => removeItem(item.id)} className="text-gray-500 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-7 flex flex-col items-center justify-center bg-white/5 border border-white/5 rounded-[2rem] p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-500/5 blur-3xl" />
        
        {/* 대시보드 룰렛 시각화 */}
        <div className="relative mb-10">
            {/* 화살표 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 z-10 drop-shadow-xl">
                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white" />
            </div>
            
            <motion.div 
                className="w-[450px] h-[450px] rounded-full border-[10px] border-white/10 shadow-2xl bg-black overflow-hidden relative"
                animate={{ rotate: rotation }}
                transition={{ duration: 5, ease: [0.15, 0, 0.15, 1] }}
            >
               <div className="w-full h-full rounded-full relative" style={{ background: `conic-gradient(${items.map((item, i) => {
                   const start = (i / items.length) * 100;
                   const end = ((i + 1) / items.length) * 100;
                   return `${item.color} ${start}% ${end}%`;
               }).join(', ')})` }}>
                   {items.map((item, i) => {
                       const angle = (i * (360 / items.length)) + (360 / items.length / 2);
                       return (
                           <div key={item.id} className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 origin-bottom flex justify-center pt-8" style={{ transform: `rotate(${angle}deg)` }}>
                               <span className="text-xl font-black text-white drop-shadow-md whitespace-nowrap -rotate-90 uppercase tracking-tight">{item.label}</span>
                           </div>
                       );
                   })}
               </div>
            </motion.div>

            {/* 결과 팝업 */}
            <AnimatePresence>
                {result && (
                    <motion.div 
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center z-20"
                    >
                        <div className="bg-black/80 backdrop-blur-md px-10 py-6 rounded-3xl border-2 border-white/20 text-center">
                            <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Result</span>
                            <h2 className="text-5xl font-black text-white">{result.label}</h2>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <button onClick={spin} disabled={isSpinning} className={`px-12 py-6 rounded-2xl font-black text-2xl transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)] flex items-center gap-4 ${isSpinning ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-indigo-500 text-white hover:scale-105'}`}>
          <Play fill="currentColor" /> {isSpinning ? 'Spinning...' : '룰렛 돌리기 (START)'}
        </button>
      </div>
    </div>
  );
}