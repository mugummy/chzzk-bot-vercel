'use client';

import React from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import { motion, AnimatePresence } from 'framer-motion';
import WinnerModal from './WinnerModal';
import { Crown, Wrench, Gem, User } from 'lucide-react';

interface DrawDisplayProps {
    mode: 'dashboard' | 'overlay';
    showControls?: boolean;
}

export default function DrawDisplay({ mode, showControls = true }: DrawDisplayProps) {
    const store = useVoteStore();

    // Replicate Winner Overlay Logic for Dashboard
    const winnerModal = (
        <WinnerModal
            visible={!!(store.drawStatus === 'picking' || store.drawWinner)}
            mode="draw"
            candidates={store.drawCandidates}
            isRunning={store.drawStatus === 'picking'}
            target={store.drawWinner}
            winner={store.drawWinner}
            onClose={() => store.resetDraw()} // Close/Reset
            onRepick={() => store.pickDrawWinner(1)}
        />
    );

    // [Overly Mode] Matches DrawDisplay.vue Overlay Section
    if (mode === 'overlay') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="relative z-10 flex flex-col items-center">
                    <h3 className="text-5xl font-black text-[#00ff80] tracking-[0.5em] mb-4 uppercase drop-shadow-[0_0_15px_rgba(0,255,128,0.5)]">
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

    // [Dashboard Mode] Matches DrawDisplay.vue Dashboard Section
    return (
        <div className="flex flex-col h-full w-full relative">
            {winnerModal}

            {store.drawStatus === 'idle' && store.drawCandidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 animate-float">
                    <div className="w-32 h-32 bg-gradient-to-br from-[#222] to-[#111] rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-inner">
                        <UsersIcon className="text-5xl text-gray-600" />
                    </div>
                    <h2 className="text-4xl font-black text-white/50 tracking-tighter">WAITING...</h2>
                    <p className="text-gray-500 mt-2 font-medium">왼쪽 패널에서 모집을 시작하세요.</p>
                </div>
            ) : (
                <div className="flex flex-col h-full">
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

                    <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden relative shadow-2xl flex flex-col">
                        <div className="flex-1 overflow-y-auto custom-scroll relative z-10 pr-2">
                            <div className="flex flex-wrap content-start gap-3">
                                <AnimatePresence>
                                    {store.drawCandidates.map((user) => (
                                        <motion.div
                                            key={user.name}
                                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            className="group relative pl-3 pr-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#00ff80]/50 rounded-xl transition-all duration-300 flex items-center gap-2 cursor-default select-none"
                                        >
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-black/50 shadow-inner">
                                                {user.role === '계정주' && <Crown size={12} className="text-yellow-400" />}
                                                {user.role === '매니저' && <Wrench size={12} className="text-blue-400" />}
                                                {user.role === '구독자' && <Gem size={12} className="text-purple-400" />}
                                                {(!user.role || user.role === '팬') && <User size={12} className="text-gray-600" />}
                                            </div>
                                            <span className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors truncate max-w-[120px]">{user.name}</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {showControls && (
                        <div className="mt-6 flex justify-center">
                            <button onClick={() => store.pickDrawWinner(1)} className="bg-[#00ff80] hover:bg-[#00cc66] text-black font-black text-xl px-12 py-4 rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-2">
                                <GiftIcon /> 지금 추첨하기
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Simple Icon Wrappers to match FontAwesome usage feel if needed, utilizing Lucide
const UsersIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const GiftIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>;
