import { useState, useEffect } from 'react';
import { useBotStore } from '@/lib/store';
import { Plus, Trash2, Disc, Play, RotateCcw } from 'lucide-react';

export default function RouletteTab({ onSend }: { onSend: (msg: any) => void }) {
  const { roulette } = useBotStore();
  const [items, setItems] = useState<any[]>([]);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
      if (roulette.items) setItems(roulette.items);
  }, [roulette.items]);

  const addItem = () => {
      if (!newItemLabel.trim()) return;
      const newItem = { id: Date.now().toString(), label: newItemLabel, color: getRandomColor() };
      const newItems = [...items, newItem];
      setItems(newItems);
      setNewItemLabel('');
      onSend({ type: 'updateRoulette', items: newItems });
  };

  const removeItem = (id: string) => {
      const newItems = items.filter(i => i.id !== id);
      setItems(newItems);
      onSend({ type: 'updateRoulette', items: newItems });
  };

  const spin = () => {
      if (items.length < 2) return alert('최소 2개의 항목이 필요합니다.');
      setIsSpinning(true);
      const winner = items[Math.floor(Math.random() * items.length)];
      onSend({ type: 'spinRoulette', selectedItem: winner });
      
      // 오버레이 띄우기
      onSend({ type: 'toggleOverlay', visible: true, view: 'roulette' });

      setTimeout(() => setIsSpinning(false), 5000);
  };

  const getRandomColor = () => {
      const colors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
      return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="grid grid-cols-12 gap-8 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="col-span-4 bg-white/5 border border-white/5 p-6 rounded-[2rem] h-fit">
          <h3 className="text-xl font-black mb-6 flex items-center gap-3"><Disc className="text-blue-500" /> 룰렛 설정</h3>
          <div className="flex gap-2 mb-4">
              <input 
                value={newItemLabel} 
                onChange={(e) => setNewItemLabel(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                placeholder="항목 이름 입력" 
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" 
              />
              <button onClick={addItem} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl"><Plus /></button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {items.map((item, i) => (
                  <div key={item.id} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border-l-4" style={{ borderLeftColor: item.color }}>
                      <span className="font-bold text-white">{item.label}</span>
                      <button onClick={() => removeItem(item.id)} className="text-gray-500 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
              ))}
              {items.length === 0 && <p className="text-gray-500 text-center py-4">항목을 추가해주세요.</p>}
          </div>
          <button onClick={spin} disabled={isSpinning || items.length < 2} className={`w-full mt-6 py-4 rounded-xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${isSpinning ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
              {isSpinning ? '돌아가는 중...' : <><Play fill="currentColor" /> 룰렛 돌리기</>}
          </button>
      </div>

      <div className="col-span-8 flex items-center justify-center bg-white/5 border border-white/5 rounded-[2rem] relative overflow-hidden">
          {/* 대시보드 내 간이 룰렛 표시 (CSS conic gradient) */}
          <div className={`w-96 h-96 rounded-full border-8 border-white/10 relative transition-all duration-[5000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isSpinning ? 'rotate-[1800deg]' : ''}`}
               style={{ background: `conic-gradient(${items.length > 0 ? items.map((item, i) => `${item.color} 0 ${100/items.length}%`).join(', ') : '#333 0 100%'})` }}>
               {/* 텍스트는 복잡해서 생략하거나 간단히 표시 */}
          </div>
          <div className="absolute top-8 right-8 text-right">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Preview</p>
              <p className="text-xs text-gray-600">실제 동작은 오버레이에서 확인하세요.</p>
          </div>
      </div>
    </div>
  );
}
