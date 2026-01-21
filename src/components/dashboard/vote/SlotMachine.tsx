'use client';

import { useRef, useEffect, useCallback } from 'react';

interface Candidate {
  nickname: string;
  role?: string;
}

interface SlotMachineProps {
  candidates: Candidate[];
  isRolling: boolean;
  isOpen?: boolean; // When ChatBox is visible below
  winner: Candidate | null;
  onFinish?: (winner: Candidate) => void;
  width?: number;
  height?: number;
}

export default function SlotMachine({
  candidates,
  isRolling,
  isOpen = false,
  winner,
  onFinish,
  width = 500,
  height = 192
}: SlotMachineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);

  const runSlotAnimation = useCallback((pool: Candidate[]) => {
    const canvas = canvasRef.current;
    if (!canvas || pool.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const itemHeight = 160;
    let offset = 0;
    let velocity = 0;
    let state: 'windup' | 'accelerating' | 'constant' | 'landing' | 'stopped' = 'windup';
    let startTime: number | null = null;
    let startDecelTime = 0;
    let startDecelOffset = 0;
    let targetOffset = 0;

    // Randomly select winner from pool
    const finalWinner = pool[Math.floor(Math.random() * pool.length)];
    const winnerIndex = pool.indexOf(finalWinner);
    const totalHeight = pool.length * itemHeight;

    // Physics constants
    const maxSpeed = 120;
    const windupDistance = 50;
    const windupDuration = 300;
    const constantDuration = 2500;
    const landingDuration = 6000;

    const draw = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Clear & Background
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, width, height);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // State machine
      if (state === 'windup') {
        if (elapsed < windupDuration) {
          const t = elapsed / windupDuration;
          const ease = 1 - Math.pow(1 - t, 3);
          offset = -windupDistance * ease;
        } else {
          state = 'accelerating';
          velocity = 0;
        }
      } else if (state === 'accelerating') {
        velocity += 8;
        offset += velocity;
        if (velocity >= maxSpeed) {
          velocity = maxSpeed;
          state = 'constant';
          startTime = timestamp;
        }
      } else if (state === 'constant') {
        offset += velocity;
        if (timestamp - startTime > constantDuration) {
          state = 'landing';

          const currentAbsOffset = offset;
          const relativeTarget = winnerIndex * itemHeight;
          const currentMod = currentAbsOffset % totalHeight;
          let distToNext = relativeTarget - currentMod;
          if (distToNext < 0) distToNext += totalHeight;

          const distToAdd = (totalHeight * 10) + distToNext;
          startDecelOffset = currentAbsOffset;
          targetOffset = currentAbsOffset + distToAdd;
          startDecelTime = timestamp;
        }
      } else if (state === 'landing') {
        const t = Math.min((timestamp - startDecelTime) / landingDuration, 1);
        const ease = 1 - Math.pow(1 - t, 5); // Strong ease out
        const totalDist = targetOffset - startDecelOffset;
        offset = startDecelOffset + (totalDist * ease);

        if (t >= 1) state = 'stopped';
      }

      // Render items
      const startIndex = Math.floor((offset - height) / itemHeight);
      const endIndex = Math.floor((offset + height * 2) / itemHeight);

      for (let i = startIndex; i <= endIndex; i++) {
        let itemIndex = i % pool.length;
        if (itemIndex < 0) itemIndex += pool.length;
        const item = pool[itemIndex];
        const y = (i * itemHeight) - offset + (height / 2);

        // Fisheye effect
        const distFromCenter = Math.abs(y - height / 2);
        const scale = Math.max(0.6, 1.2 - (distFromCenter / (height * 0.8)));
        const opacity = Math.max(0.1, 1 - (distFromCenter / (height * 0.6)));

        ctx.save();
        ctx.translate(width / 2, y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = opacity;

        if (item === finalWinner && state === 'stopped') {
          ctx.fillStyle = "#00ff80";
          ctx.font = "900 60px 'Pretendard', sans-serif";
          ctx.shadowColor = "#00ff80";
          ctx.shadowBlur = 30;
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = "white";
          ctx.font = "700 48px 'Pretendard', sans-serif";
          ctx.shadowBlur = 0;
        }
        ctx.fillText(item.nickname, 0, 0);
        ctx.restore();
      }

      if (state !== 'stopped') {
        animationIdRef.current = requestAnimationFrame(draw);
      } else {
        onFinish?.(finalWinner);
      }
    };

    animationIdRef.current = requestAnimationFrame(draw);
  }, [width, height, onFinish]);

  useEffect(() => {
    if (isRolling && candidates.length > 0) {
      runSlotAnimation(candidates);
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isRolling, candidates, runSlotAnimation]);

  // Draw initial state when not rolling
  useEffect(() => {
    if (!isRolling && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, width, height);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (winner) {
          ctx.fillStyle = "#00ff80";
          ctx.font = "900 60px 'Pretendard', sans-serif";
          ctx.shadowColor = "#00ff80";
          ctx.shadowBlur = 30;
          ctx.fillText(winner.nickname, width / 2, height / 2);
        } else if (candidates.length > 0) {
          ctx.fillStyle = "#333";
          ctx.font = "700 24px 'Pretendard', sans-serif";
          ctx.fillText(`${candidates.length}명 대기 중`, width / 2, height / 2);
        } else {
          ctx.fillStyle = "#333";
          ctx.font = "700 24px 'Pretendard', sans-serif";
          ctx.fillText('참여자 없음', width / 2, height / 2);
        }
      }
    }
  }, [isRolling, winner, candidates.length, width, height]);

  return (
    <div
      className={`relative w-full bg-[#111] overflow-hidden border border-[#333] shadow-2xl z-20 ${
        isOpen ? 'rounded-t-xl border-b-0' : 'rounded-xl'
      }`}
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)'
      }}
    >
      {/* Top highlight line */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-white shadow-[0_0_15px_white] z-20" />

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full"
        style={{ height: `${height}px` }}
      />

      {/* Bottom highlight line - disappears when open */}
      <div
        className={`absolute bottom-0 left-0 w-full h-1.5 bg-white shadow-[0_0_15px_white] z-20 transition-all duration-700 ${
          isOpen ? 'translate-y-4 opacity-0' : ''
        }`}
      />
    </div>
  );
}
