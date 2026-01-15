import { useState } from 'react';
import { useBotStore } from '@/lib/store';
import { Disc, Plus, Trash2, Play } from 'lucide-react';

export default function RouletteTab({ onSend }: { onSend: (msg: any) => void }) {
  const { roulette } = useBotStore();
  const [items, setItems] = useState<any[]>(roulette.items.length ? roulette.items : [{ id: '1', label: '꽝', weight: 1, color: '#ef4444' }]);
  const [newItem, setNewItem] = useState('');
  const [newWeight, setNewWeight] = useState(1);

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'];

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

  return (
    <div className="grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="col-span-5 bg-white/5 border border-white/5 p-6 rounded-[2rem] h-fit">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Disc className="text-indigo-500" /> 룰렛 아이템</h3>
        
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
        
        {/* 대시보드에서도 룰렛 시각화 (간소화) */}
        <div className="w-64 h-64 rounded-full border-8 border-white/10 flex items-center justify-center mb-10 relative shadow-2xl bg-black overflow-hidden">
           <div className="w-full h-full bg-[conic-gradient(var(--tw-gradient-stops))]" style={{ backgroundImage: `conic-gradient(${items.map((i, idx) => `${i.color} 0 ${100/items.length}%`).join(',')})` }} />
           {/* 화살표 */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white" />
        </div>

        <button onClick={spin} className="px-12 py-6 bg-indigo-500 text-white font-black text-2xl rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)] flex items-center gap-4">
          <Play fill="currentColor" /> 룰렛 돌리기 (오버레이)
        </button>
      </div>
    </div>
  );
}