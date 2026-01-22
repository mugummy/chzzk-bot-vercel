'use client';

import React from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import { motion, AnimatePresence } from 'framer-motion';
import WinnerModal from './WinnerModal';

interface DrawDisplayProps {
    mode: 'dashboard' | 'overlay';
}

export default function DrawDisplay({ mode }: DrawDisplayProps) {
    const store = useVoteStore();

    if (store.drawStatus === 'idle' && mode === 'overlay') return null;

    return (
        <div className="flex flex-col items-center justify-center w-full h-full p-4 relative">
            {/* Winner / Slot Modal */}
            <WinnerModal
                visible={store.drawStatus === 'picking' || (store.drawStatus === 'ended' && !!store.drawWinner)}
                mode="draw"
                candidates={store.drawCandidates}
                isRunning={store.drawStatus === 'picking'}
                target={store.drawWinner}
                winner={store.drawStatus === 'ended' ? store.drawWinner : null}
                onClose={() => store.stopDraw()}
                onRepick={() => store.pickDrawWinner(1)}
            />

            {/* Title / Keyword */}
            {mode === 'dashboard' && (
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white">시청자 추첨 시스템</h2>
                    <p className="text-gray-400">참여 키워드: <span className="text-[#00ff80] font-mono">{store.drawKeyword}</span></p>
                </div>
            )}

            {/* Candidate List (Grid) */}
            <div className="w-full max-w-4xl bg-[#1a1a1a] rounded-xl p-4 min-h-[300px] border border-white/10 relative overflow-hidden">

                {/* Participants Count */}
                <div className="absolute top-4 right-4 bg-[#333] px-3 py-1 rounded-full text-xs text-white z-10">
                    참여자: {store.drawCandidates.length}명
                </div>

                {store.drawCandidates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-pulse">
                        <div className="w-24 h-24 bg-[#222] rounded-full flex items-center justify-center mb-4 border border-[#333] shadow-inner relative">
                            <div className="absolute inset-0 bg-[#00ff80] blur-xl opacity-20 rounded-full"></div>
                            {/* Icon Placeholder, need to check if Users is imported */}
                            <span className="text-4xl text-[#00ff80]">👥</span>
                        </div>
                        <h2 className="text-3xl font-black text-[#555] tracking-widest mb-2 font-mono">WAITING...</h2>
                        <p className="text-sm">채팅창에 <span className="text-[#00ff80] font-bold">"{store.drawKeyword}"</span>를 입력하세요!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-[400px] overflow-y-auto custom-scroll">
                        <AnimatePresence>
                            {store.drawCandidates.map((p, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={`
                                        p-2 rounded bg-[#262626] border border-[#333] flex flex-col items-center justify-center truncate
                                        ${p.role === '구독자' ? 'border-purple-500/50' : ''}
                                        ${p.role === '계정주' ? 'border-yellow-500/50' : ''}
                                    `}
                                >
                                    <span className="text-xs text-gray-400">{p.role === '팬' ? '' : p.role}</span>
                                    <span className="text-sm font-bold text-white truncate w-full text-center">{p.name}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
