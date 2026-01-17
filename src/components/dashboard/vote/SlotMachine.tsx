'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface SlotMachineProps {
  participants: string[];
  winner: string;
  onComplete: () => void;
}

export default function SlotMachine({ participants, winner, onComplete }: SlotMachineProps) {
  const [isSpinning, setIsSpinning] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [showWinner, setShowWinner] = useState(false);
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);

  const spinDuration = 3000; // 3초 동안 스핀
  const initialSpeed = 50; // 초기 속도 (ms)
  const finalSpeed = 300; // 최종 속도 (ms)

  const startSpin = useCallback(() => {
    if (participants.length === 0) return;

    setIsSpinning(true);
    setShowWinner(false);

    const startTime = Date.now();

    const spin = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // 이징 함수로 속도 감소
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentSpeed = initialSpeed + (finalSpeed - initialSpeed) * easeOut;

      // 랜덤 인덱스 선택 (마지막에는 winner로 수렴)
      if (progress < 0.9) {
        currentIndexRef.current = Math.floor(Math.random() * participants.length);
      } else {
        // 마지막 10%에서는 winner로 수렴
        const winnerIndex = participants.indexOf(winner);
        if (winnerIndex !== -1) {
          currentIndexRef.current = winnerIndex;
        }
      }

      setDisplayName(participants[currentIndexRef.current]);

      if (progress < 1) {
        spinIntervalRef.current = setTimeout(spin, currentSpeed);
      } else {
        // 스핀 완료
        setDisplayName(winner);
        setIsSpinning(false);
        setShowWinner(true);

        // 약간의 딜레이 후 완료 콜백
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    };

    spin();
  }, [participants, winner, onComplete]);

  useEffect(() => {
    startSpin();

    return () => {
      if (spinIntervalRef.current) {
        clearTimeout(spinIntervalRef.current);
      }
    };
  }, [startSpin]);

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* 배경 글로우 효과 */}
      <div
        className="absolute inset-0 rounded-3xl opacity-30 blur-3xl"
        style={{
          background: showWinner
            ? 'radial-gradient(circle, #00ff80 0%, transparent 70%)'
            : 'radial-gradient(circle, #4ecdc4 0%, transparent 70%)'
        }}
      />

      {/* 슬롯 머신 디스플레이 */}
      <div className="relative">
        {/* 프레임 */}
        <div
          className="relative px-12 py-8 rounded-2xl border-2 overflow-hidden"
          style={{
            backgroundColor: '#0a0a0a',
            borderColor: showWinner ? '#00ff80' : '#333',
            boxShadow: showWinner
              ? '0 0 40px rgba(0, 255, 128, 0.3), inset 0 0 30px rgba(0, 255, 128, 0.1)'
              : '0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* 스캔라인 효과 */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 128, 0.03) 2px, rgba(0, 255, 128, 0.03) 4px)'
            }}
          />

          {/* 이름 표시 영역 */}
          <div className="relative min-w-[280px] text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={displayName}
                initial={{ y: isSpinning ? -20 : 0, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: isSpinning ? 20 : 0, opacity: 0, scale: 0.8 }}
                transition={{ duration: isSpinning ? 0.05 : 0.3 }}
                className="text-3xl font-bold tracking-wide"
                style={{
                  color: showWinner ? '#00ff80' : '#ffffff',
                  textShadow: showWinner
                    ? '0 0 20px rgba(0, 255, 128, 0.8), 0 0 40px rgba(0, 255, 128, 0.4)'
                    : '0 0 10px rgba(255, 255, 255, 0.3)'
                }}
              >
                {displayName || '...'}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 당첨 표시 */}
          {showWinner && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-3 -right-3"
            >
              <div
                className="p-2 rounded-full"
                style={{
                  backgroundColor: '#00ff80',
                  boxShadow: '0 0 20px rgba(0, 255, 128, 0.6)'
                }}
              >
                <Sparkles size={20} color="#000" />
              </div>
            </motion.div>
          )}
        </div>

        {/* 스피닝 인디케이터 */}
        {isSpinning && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#00ff80' }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 당첨 파티클 효과 */}
      {showWinner && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#00ff80', '#4ecdc4', '#ffe66d', '#ff6b6b'][i % 4],
                left: `${Math.random() * 100}%`,
                top: '50%'
              }}
              initial={{ y: 0, opacity: 1, scale: 1 }}
              animate={{
                y: [0, -100 - Math.random() * 100],
                x: [0, (Math.random() - 0.5) * 200],
                opacity: [1, 0],
                scale: [1, 0]
              }}
              transition={{
                duration: 1 + Math.random() * 0.5,
                ease: 'easeOut',
                delay: Math.random() * 0.3
              }}
            />
          ))}
        </div>
      )}

      {/* 상태 텍스트 */}
      <motion.p
        className="mt-8 text-sm font-medium"
        style={{ color: '#6b7280' }}
        animate={isSpinning ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
        transition={isSpinning ? { duration: 1, repeat: Infinity } : {}}
      >
        {isSpinning ? '추첨 중...' : '당첨자가 선정되었습니다!'}
      </motion.p>
    </div>
  );
}
