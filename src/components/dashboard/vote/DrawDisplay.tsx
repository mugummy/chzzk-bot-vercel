'use client';

import React, { useEffect, useState } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import { Crown, Sparkles, Users } from 'lucide-react';

interface DrawDisplayProps {
    mode?: 'dashboard' | 'overlay';
}

export default function DrawDisplay({ mode = 'dashboard' }: DrawDisplayProps) {
    const store = useVoteStore();
    const [animateCandidates, setAnimateCandidates] = useState(false);

    // Candidates count animation
    useEffect(() => {
        if (store.drawCandidates.length > 0) {
            setAnimateCandidates(true);
            const timer = setTimeout(() => setAnimateCandidates(false), 300);
            return () => clearTimeout(timer);
        }
    }, [store.drawCandidates.length]);

    // Derived state for display
    const isOverlay = mode === 'overlay';
    const containerClasses = isOverlay
        ? 'w-full h-full flex flex-col justify-center items-center p-8'
        : 'w-full h-full flex flex-col relative';

    // RENDER: Winner
    if (store.drawWinner) {
        return (
            <div className={`${containerClasses} animate-fadeIn`}>
                <div className="relative text-center z-10">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,165,0,0.6)] animate-bounce relative">
                        <Crown className="w-16 h-16 text-black drop-shadow-sm" fill="currentColor" />
                        <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
                    </div>

                    <h2 className="text-2xl font-bold text-yellow-400 mb-2 tracking-widest uppercase drop-shadow-md">WINNER</h2>
                    <div className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tight">
                        {store.drawWinner}
                    </div>
                    <p className="text-gray-400 text-lg font-medium">축하합니다!</p>
                </div>

                {/* Confetti Background (CSS based simple ones or just particles) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            opacity: Math.random()
                        }}></div>
                    ))}
                </div>
            </div>
        );
    }

    // RENDER: Recruiting
    return (
        <div className={containerClasses}>
            {/* Header / Timer Centered */}
            <div className={`flex flex-col items-center justify-center ${isOverlay ? 'flex-1' : 'h-full'}`}>

                {/* Status Indicator */}
                <div className={`mb-8 flex items-center gap-3 px-6 py-2 rounded-full border ${store.drawStatus === 'recruiting' ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                    <span className={`w-3 h-3 rounded-full ${store.drawStatus === 'recruiting' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                    <span className="font-bold tracking-widest text-sm">
                        {store.drawStatus === 'recruiting' ? '참여자 모집 중' : '추첨 대기 중'}
                    </span>
                </div>

                {/* Main Content */}
                <div className="text-center space-y-6 relative z-10">
                    <div className="flex items-center justify-center gap-4 text-gray-400 mb-2">
                        <span className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold bg-[#333] px-3 py-1 rounded text-gray-300">
                            <Sparkles size={14} className="text-[#00ff80]" /> Keyword
                        </span>
                        <span className="text-3xl font-black text-white">{store.drawKeyword}</span>
                    </div>

                    {/* Counter */}
                    <div className={`transition-transform duration-300 ${animateCandidates ? 'scale-110' : 'scale-100'}`}>
                        <div className="text-[8rem] leading-none font-black text-white drop-shadow-[0_0_30px_rgba(0,255,128,0.3)] tabular-nums">
                            {store.drawCandidates.length}
                        </div>
                        <div className="text-xl text-gray-500 font-medium mt-2 flex items-center justify-center gap-2">
                            <Users size={20} /> Total Participants
                        </div>
                    </div>
                </div>

                {/* Candidate List Preview (Dashboard Only) */}
                {!isOverlay && store.drawCandidates.length > 0 && (
                    <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#111] to-transparent p-6 flex items-end justify-center pointer-events-none">
                        <div className="flex gap-2 opacity-50 overflow-hidden px-10 max-w-full justify-center flex-wrap h-8">
                            {store.drawCandidates.slice(-5).map((name, i) => (
                                <span key={i} className="text-xs font-bold text-gray-500 bg-[#222] px-2 py-1 rounded animate-fadeIn">{name}</span>
                            ))}
                            {store.drawCandidates.length > 5 && <span className="text-xs text-gray-600">...</span>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
