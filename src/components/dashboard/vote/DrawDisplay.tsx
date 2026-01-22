'use client';

import React from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import { motion, AnimatePresence } from 'framer-motion';
import WinnerModal from './WinnerModal';

interface DrawDisplayProps {
    mode: 'dashboard' | 'overlay';
}

import { Crown, User, Gem, Wrench } from 'lucide-react';

export default function DrawDisplay({ mode }: DrawDisplayProps) {
    const store = useVoteStore();

    // Winner Modal is always rendered to handle 'picking'/'ended' states
    const winnerModal = (
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
    );

    // [OVERLAY MODE]
    if (mode === 'overlay') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 relative">
                {winnerModal}

                {/* Always show recruitment status in overlay, just like legacy */}
                <div className="relative z-10 flex flex-col items-center">
                    <h3 className="text-5xl font-black text-[#00ff80] tracking-[0.5em] mb-4 uppercase drop-shadow-[0_0_15px_rgba(0,255,128,0.5)] animate-pulse">
                        {store.drawStatus === 'recruiting' ? '참여자 모집 중' : '모집 마감'}
                    </h3>
                    <div className="flex items-baseline gap-4">
                        <div className="text-[12rem] md:text-[16rem] leading-none font-black text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 0 30px rgba(255, 255, 255, 0.5)' }}>
                            {store.drawCandidates.length.toLocaleString()}
                        </div>
                        <span className="text-6xl font-bold text-gray-400">명</span>
                    </div>
                </div>
            </div>
        );
    }

    // [DASHBOARD MODE]
    return (
        <div className="flex flex-col h-full w-full relative">
            {winnerModal}

            {store.drawStatus === 'idle' && store.drawCandidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 animate-pulse">
                    <div className="w-32 h-32 bg-gradient-to-br from-[#222] to-[#111] rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-inner">
                        <User size={48} className="text-gray-600" />
                    </div>
                    <h2 className="text-4xl font-black text-white/50 tracking-tighter">WAITING...</h2>
                    <p className="text-gray-500 mt-2 font-medium">왼쪽 패널에서 모집을 시작하세요.</p>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    {/* Header Stats */}
                    <div className="text-center mb-8 relative z-10 shrink-0">
                        <div className="relative inline-block mb-4">
                            <div className="text-[6rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-xl">
                                {store.drawCandidates.length.toLocaleString()}
                            </div>
                            <span className="absolute -right-10 bottom-6 text-2xl font-bold text-gray-500">명</span>
                        </div>
                        <br />
                        <div className="inline-block px-6 py-2 rounded-full border border-[#00ff80]/30 bg-[#00ff80]/10 backdrop-blur-md shadow-[0_0_15px_rgba(0,255,128,0.2)]">
                            <h3 className={`text-xl font-bold tracking-widest uppercase flex items-center gap-2 ${store.drawStatus === 'recruiting' ? 'text-[#00ff80]' : 'text-gray-400'}`}>
                                {store.drawStatus === 'recruiting' && <div className="w-3 h-3 bg-[#00ff80] rounded-full animate-ping"></div>}
                                {store.drawStatus === 'recruiting' ? 'LIVE RECRUITING' : 'RECRUITMENT CLOSED'}
                            </h3>
                        </div>
                    </div>

                    {/* Participant List (Flex Wrap) */}
                    <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden relative shadow-2xl flex flex-col">
                        <div className="flex-1 overflow-y-auto custom-scroll relative z-10 pr-2">
                            <div className="flex flex-wrap content-start gap-3">
                                <AnimatePresence>
                                    {store.drawCandidates.map((p, i) => (
                                        <motion.div
                                            key={p.name}
                                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            className="group relative pl-3 pr-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#00ff80]/50 rounded-xl transition-all duration-300 flex items-center gap-2 cursor-default select-none"
                                        >
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-black/50 shadow-inner">
                                                {p.role === '계정주' && <Crown size={12} className="text-yellow-400" />}
                                                {p.role === '매니저' && <Wrench size={12} className="text-blue-400" />}
                                                {p.role === '구독자' && <Gem size={12} className="text-purple-400" />}
                                                {(!p.role || p.role === '팬') && <User size={12} className="text-gray-600" />}
                                            </div>
                                            <span className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors truncate max-w-[120px]">{p.name}</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
