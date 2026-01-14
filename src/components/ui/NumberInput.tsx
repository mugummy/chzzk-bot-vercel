'use client';

import { Minus, Plus } from 'lucide-react';

interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

export default function NumberInput({ value, onChange, min = 0, max = 99999, step = 1, unit = '', className = '' }: NumberInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = min;
    if (val < min) val = min;
    if (val > max) val = max;
    onChange(val);
  };

  const adjustValue = (delta: number) => {
    const newVal = value + delta;
    if (newVal < min || newVal > max) return;
    onChange(newVal);
  };

  return (
    <div className={`flex items-center gap-3 bg-white/5 p-2 rounded-[1.5rem] border border-white/10 focus-within:border-emerald-500/50 transition-all ${className}`}>
      <button onClick={() => adjustValue(-step)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white shrink-0">
        <Minus size={16} />
      </button>
      <div className="flex items-baseline gap-1 min-w-[4rem] justify-center flex-1">
        <input 
          type="number" 
          value={value} 
          onChange={handleInputChange}
          className="bg-transparent text-2xl font-black text-emerald-500 text-center w-full outline-none p-0 m-0"
        />
        {unit && <span className="text-xs font-bold text-gray-500">{unit}</span>}
      </div>
      <button onClick={() => adjustValue(step)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full hover:bg-emerald-500 hover:text-black active:scale-95 transition-all text-white shrink-0">
        <Plus size={16} />
      </button>
    </div>
  );
}
