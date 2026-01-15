import { useState, useEffect } from 'react';
import { useBotStore } from '@/lib/store';
import { Disc, Plus, Trash2, Play, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RouletteTab({ onSend }: { onSend: (msg: any) => void }) {
  const { roulette } = useBotStore();
  const [items, setItems] = useState<any[]>(roulette.items.length ? roulette.items : [{ id: '1', label: '꽝', weight: 1, color: '#ef4444' }]);
  const [newItem, setNewItem] = useState('');
  const [newWeight, setNewWeight] = useState(1);
  const [rotation, setRotation] = useState(0);

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'];

  // 대시보드 룰렛 애니메이션 동기화 (간단 버전)
  useEffect(() => {
      // 실제로는 오버레이와 정확히 각도를 맞추려면 서버에서 타겟 아이템 정보를 받아야 함.
      // 여기선 spinRoulette 이벤트 리스너를 추가하거나, store의 roulette 상태 변화를 감지해서 돌림.
      // (단, store엔 결과 selectedItem 정보가 없으므로 간단히 회전만 시킴)
      if (items.length > 0) {
          // 그냥 시각적 효과로 계속 천천히 돌거나, 스핀 시 빠르게 돌게 할 수 있음.
      }
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
    // 대시보드에서도 돌아가는 척 (랜덤 회전 추가)
    setRotation(rotation + 1800 + Math.random() * 360);
  };

  const reset = () => {
      if (confirm('룰렛을 초기화하시겠습니까?')) {
          onSend({ type: 'resetRoulette' });
      }
  };

  return (
    <div className="grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="col-span-5 bg-white/5 border border-white/5 p-6 rounded-[2rem] h-fit">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black flex items-center gap-2"><Disc className="text-indigo-500" /> 룰렛 아이템</h3>
            <button onClick={reset} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><RotateCcw size={18}/></button>
        </div>
        
        <div className="flex gap-2 mb-6">
          <input 
            value={newItem} onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="항목 이름"
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold"
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
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white" />
            </div>
            
            <motion.div 
                className="w-80 h-80 rounded-full border-8 border-white/10 shadow-2xl bg-black overflow-hidden relative"
                animate={{ rotate: rotation }}
                transition={{ duration: 5, ease: [0.2, 0.8, 0.2, 1] }}
            >
               <div className="w-full h-full bg-[conic-gradient(var(--tw-gradient-stops))]" style={{ backgroundImage: `conic-gradient(${items.map((i, idx) => `${i.color} 0 ${100/items.length}%`).join(',')})` }}>
                   {/* 대시보드에서는 텍스트 생략하고 색상만 (복잡도 줄임) */}
               </div>
            </motion.div>
        </div>

        <button onClick={spin} className="px-12 py-6 bg-indigo-500 text-white font-black text-2xl rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)] flex items-center gap-4">
          <Play fill="currentColor" /> 룰렛 돌리기
        </button>
      </div>
    </div>
  );
}
