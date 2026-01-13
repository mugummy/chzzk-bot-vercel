'use client';

import { motion } from 'framer-motion';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Premium Toggle Switch (Fixed Click Handler)
 */
export default function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation(); // 부모 요소 클릭 방지
        if (!disabled) onChange(!checked);
      }}
      className={`relative w-14 h-7 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${
        checked 
          ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
          : 'bg-white/10 border border-white/5 hover:bg-white/20'
      }`}
    >
      <motion.div
        layout
        initial={false}
        animate={{ x: checked ? 28 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute top-1 w-5 h-5 rounded-full shadow-md ${
          checked ? 'bg-black' : 'bg-gray-400'
        }`}
      />
    </button>
  );
}