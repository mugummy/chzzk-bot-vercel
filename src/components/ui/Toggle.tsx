'use client';

import { motion } from 'framer-motion';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Premium Toggle Switch: gummybot의 시그니처 네온 디자인이 적용된 스위치입니다.
 */
export default function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-14 h-7 rounded-full transition-all duration-500 ease-in-out ${
        disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
      } ${
        checked 
          ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
          : 'bg-white/10 border border-white/5'
      }`}
    >
      <motion.div
        animate={{ x: checked ? 28 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute top-1 w-5 h-5 rounded-full shadow-lg ${
          checked ? 'bg-black' : 'bg-gray-400'
        }`}
      />
    </button>
  );
}
