'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SlotMachineProps {
    candidates: { name: string;[key: string]: any }[];
    isRunning: boolean;
    target?: { name: string } | null;
    showResult: boolean;
    winnerName: string;
    className?: string;
    chatLog?: { text: string; time?: number }[];
}

export default function SlotMachine({ candidates, isRunning, target, showResult, winnerName, className, chatLog = [] }: SlotMachineProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationIdRef = useRef<number | null>(null);
    const [winner, setWinner] = useState<any>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Auto Scroll Chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatLog]);

    // Canvas Logic
    const runSlot = (pool: any[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const itemHeight = 120;
        let offset = 0;
        let velocity = 0;
        let state = 'windup';
        let startTime: number | null = null;
        let startDecelTime: number | null = null;
        let startDecelOffset = 0;
        let targetOffset = 0;

        let finalWinner = target;
        if (!finalWinner) finalWinner = pool[Math.floor(Math.random() * pool.length)];
        let winnerIndex = pool.indexOf(finalWinner);
        if (winnerIndex === -1 && pool.length > 0) {
            winnerIndex = 0; finalWinner = pool[0];
        }

        const totalHeight = pool.length * itemHeight;
        const maxSpeed = 150;
        const constantDuration = 1500;
        const landingDuration = 2500;

        const draw = (timestamp: number) => {
            if (!startTime) startTime = timestamp;

            ctx.clearRect(0, 0, width, height);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            if (state === 'windup') {
                const duration = 500;
                if (timestamp - startTime > duration) {
                    state = 'accelerating'; velocity = 0; startTime = timestamp;
                    offset = 0;
                } else {
                    const t = (timestamp - startTime) / duration;
                    const pull = 80 * (1 - Math.pow(1 - t, 3));
                    offset = -pull;
                }
            } else if (state === 'accelerating') {
                velocity += 3; offset += velocity;
                if (velocity >= maxSpeed) { velocity = maxSpeed; state = 'constant'; startTime = timestamp; }
            } else if (state === 'constant') {
                offset += velocity;
                if (timestamp - startTime > constantDuration) {
                    state = 'landing';
                    const currentAbsOffset = offset;
                    const currentMod = currentAbsOffset % totalHeight;
                    const targetMod = winnerIndex * itemHeight;

                    let distToNext = targetMod - currentMod;
                    if (distToNext < 0) distToNext += totalHeight;

                    const distToAdd = (totalHeight * 5) + distToNext;

                    startDecelOffset = currentAbsOffset;
                    targetOffset = currentAbsOffset + distToAdd;
                    startDecelTime = timestamp;
                }
            } else if (state === 'landing' && startDecelTime !== null) {
                const t = Math.min((timestamp - startDecelTime) / landingDuration, 1);
                const ease = 1 - Math.pow(1 - t, 3);

                velocity = maxSpeed * (1 - ease);
                if (velocity < 0) velocity = 0;

                const totalDist = targetOffset - startDecelOffset;
                offset = startDecelOffset + (totalDist * ease);

                if (t >= 1) { state = 'stopped'; velocity = 0; }
            }

            // Draw Items
            const startIndex = Math.floor((offset - height) / itemHeight);
            const endIndex = Math.floor((offset + height * 2) / itemHeight);

            for (let i = startIndex; i <= endIndex; i++) {
                let itemIndex = i % pool.length;
                if (itemIndex < 0) itemIndex += pool.length;
                const item = pool[itemIndex];
                const y = (i * itemHeight) - offset + (height / 2);

                const distFromCenter = Math.abs(y - height / 2);
                if (distFromCenter < height * 1.5) {
                    ctx.save();
                    ctx.translate(width / 2, y);
                    ctx.scale(0.9, 1.2);

                    if (item === finalWinner && state === 'stopped') {
                        ctx.fillStyle = "#00ff80";
                        ctx.font = "900 65px Pretendard, sans-serif";
                        ctx.shadowColor = "#00ff80"; ctx.shadowBlur = 20;
                    } else {
                        ctx.fillStyle = "white";
                        ctx.font = "700 55px Pretendard, sans-serif";
                        ctx.shadowBlur = 0;
                    }
                    ctx.fillText(item.name || '???', 0, 0);
                    ctx.restore();
                }
            }

            if (state !== 'stopped') {
                animationIdRef.current = requestAnimationFrame(draw);
            } else {
                setWinner(finalWinner);
            }
        };

        animationIdRef.current = requestAnimationFrame(draw);
    };

    useEffect(() => {
        if (isRunning && candidates.length > 0) {
            if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
            runSlot(candidates);
        }
        return () => {
            if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
        };
    }, [isRunning, candidates]); // target dependency? Assuming target is set when isRunning starts or slightly after.

    return (
        <div className={`relative w-full flex flex-col items-center justify-center transition-all duration-700 ${className} ${showResult ? 'gap-4' : 'gap-0'}`}>
            {/* Slot Frame */}
            <div className="relative w-full h-40 flex items-center justify-center shrink-0">
                <div className="absolute w-[90%] h-[2px] bg-white/50 top-0 z-30 transition-all duration-700"></div>

                <div className="relative w-full h-full overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        width={800} height={192}
                        className={`w-full h-full ${showResult ? 'hidden' : 'block'}`}
                        style={{ maskImage: 'linear-gradient(to bottom, transparent 10%, black 20%, black 80%, transparent 90%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 10%, black 20%, black 80%, transparent 90%)' }}
                    />

                    {showResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <h2 className="text-6xl font-black text-[#00ff80] drop-shadow-[0_0_15px_rgba(0,255,128,0.5)]">
                                {winnerName}
                            </h2>
                        </motion.div>
                    )}
                </div>

                <div className="absolute w-[90%] h-[2px] bg-white/50 bottom-0 z-30 transition-all duration-700"></div>
            </div>

            {/* Chat Log (Like Legacy) */}
            <div
                className={`w-[80%] relative overflow-hidden transition-all duration-700 ease-in-out flex flex-col ${showResult ? 'h-64 opacity-100' : 'h-0 opacity-0'}`}
            >
                <div className="flex-1 overflow-y-auto custom-scroll w-full pb-2" ref={chatContainerRef}>
                    <AnimatePresence mode='popLayout'>
                        {chatLog.map((chat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="text-white text-lg py-1 border-b border-white/5 last:border-0 flex items-start gap-2"
                            >
                                <span className="text-gray-500 text-xs mt-1 shrink-0">
                                    {new Date(chat.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="break-words font-medium">{chat.text}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                {/* Bottom Line */}
                <div className="w-full h-[2px] bg-white/50 mt-1 shrink-0"></div>
            </div>
        </div>
    );
}
