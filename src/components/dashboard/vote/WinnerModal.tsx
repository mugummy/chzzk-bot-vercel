'use client';

import React from 'react';
import SlotMachine from './SlotMachine';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoteStore } from '@/stores/useVoteStore';

interface WinnerModalProps {
    visible: boolean;
    mode: 'draw' | 'vote'; // 'vote' mode uses this? Usually draw. Vote uses bar chart.
    candidates: any[];
    isRunning: boolean;
    target: any; // Winner object if predetermined
    winner: any; // Winner object when finished
    onClose: () => void;
    onRepick?: () => void;
}

export default function WinnerModal({ visible, mode, candidates, isRunning, target, winner, onClose, onRepick }: WinnerModalProps) {
    const winnerChatLog = winner?.lastMessage;
    if (!visible) return null;

    // Display Candidates (Shuffle if running for visual noise, or passed list)
    // SlotMachine handles the visual shuffling via canvas scrolling.
    // We just pass the pool.

    // If list is empty, mock it to prevent crash
    const pool = candidates && candidates.length > 0 ? candidates : Array(10).fill({ name: '???' });

    // Show controls only if winner exists
    const showControls = !!winner;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
                <div className="w-full max-w-4xl flex flex-col items-center relative p-8">
                    {/* Title */}
                    {isRunning && (
                        <div className="text-2xl font-black text-[#00ff80] mb-8 animate-pulse uppercase tracking-widest bg-[#1a1a1a]/80 px-6 py-2 rounded-full border border-[#00ff80]/50 shadow-lg">
                            {mode === 'draw' ? '추첨 중...' : '집계 중...'}
                        </div>
                    )}

                    {/* Slot Machine */}
                    <SlotMachine
                        candidates={pool}
                        isRunning={isRunning}
                        target={target}
                        showResult={!!winner}
                        winnerName={winner?.name || winner?.nickname || ''}
                        className="mb-8"
                        chatLog={winnerChatLog}
                    />



                    {/* Controls */}
                    {showControls && (
                        <div className="flex gap-4 mt-8">
                            {onRepick && (
                                <button onClick={onRepick} className="px-8 py-3 bg-[#333] hover:bg-[#444] rounded-xl font-bold text-white transition border border-white/10">
                                    다시 뽑기
                                </button>
                            )}
                            <button onClick={onClose} className="px-8 py-3 bg-[#00ff80] text-black hover:bg-[#00cc66] rounded-xl font-bold transition shadow-lg shadow-[#00ff80]/20">
                                확인
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
