'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import { Crown, Sparkles, Users, Play, Square, Trophy } from 'lucide-react';

interface DrawDisplayProps {
    mode?: 'dashboard' | 'overlay';
}

export default function DrawDisplay({ mode = 'dashboard' }: DrawDisplayProps) {
    const store = useVoteStore();
    const [slotName, setSlotName] = useState('???');
    const [showChatReveal, setShowChatReveal] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const isOverlay = mode === 'overlay';
    const isDashboard = mode === 'dashboard';

    // Slot Machine Animation Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (store.drawStatus === 'picking') {
            setShowChatReveal(false);
            interval = setInterval(() => {
                const candidates = store.drawCandidates.length > 0 ? store.drawCandidates : [{ name: '참여자 없음' }];
                const randomName = candidates[Math.floor(Math.random() * candidates.length)].name;
                setSlotName(randomName);
            }, 50); // Fast cycle
        } else if (store.drawWinner) {
            setSlotName(store.drawWinner.name);
            // Delay reveal of chat
            setTimeout(() => setShowChatReveal(true), 1000);
        }
        return () => clearInterval(interval);
    }, [store.drawStatus, store.drawWinner, store.drawCandidates]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (showChatReveal && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [store.chatHistory, showChatReveal]);


    // RENDER: IDLE (Start Button)
    if (store.drawStatus === 'idle' && !store.drawWinner) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center animate-fadeIn relative p-8">
                <div className="text-center space-y-8">
                    {isDashboard && (
                        <button
                            onClick={() => store.startDrawRecruit({ duration: store.useDrawTimer ? store.drawTimerDuration : undefined })}
                            className="bg-[#00ff80] text-black font-black text-2xl md:text-3xl px-12 py-6 rounded-2xl shadow-[0_0_30px_rgba(0,255,128,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <Play fill="currentColor" size={32} />
                            참여자 모집 시작
                        </button>
                    )}

                    <div className="flex flex-col gap-2 text-gray-500 text-sm font-bold mt-8">
                        {store.drawSubsOnly && <span className="flex items-center justify-center gap-2"><div className="w-2 h-2 bg-[#00ff80] rounded-full"></div> 구독자만 추첨하기</span>}
                        {store.excludeWinners && <span className="flex items-center justify-center gap-2"><div className="w-2 h-2 bg-[#00ff80] rounded-full"></div> 이미 뽑힌 참여자 제외하기</span>}
                        {store.useDrawTimer && <span className="flex items-center justify-center gap-2"><div className="w-2 h-2 bg-[#00ff80] rounded-full"></div> 타이머 사용하기 ({store.drawTimerDuration}초)</span>}
                    </div>
                </div>
            </div>
        );
    }

    // RENDER: RECRUITING
    if (store.drawStatus === 'recruiting') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center relative p-8 animate-fadeIn">
                {/* Top Controls */}
                {isDashboard && (
                    <div className="absolute top-8 flex gap-4 z-20">
                        <button
                            onClick={() => store.pickDrawWinner(1)} // Direct pick (Stop & Pick)
                            className="bg-transparent border-2 border-[#00ff80] text-[#00ff80] px-8 py-3 rounded-xl font-bold hover:bg-[#00ff80] hover:text-black transition-all"
                        >
                            추첨하기
                        </button>
                        <button
                            onClick={store.stopDraw}
                            className="bg-[#00ff80] text-black px-8 py-3 rounded-xl font-bold hover:bg-[#00cc66] transition-all"
                        >
                            참여자 모집 종료
                        </button>
                    </div>
                )}

                {/* Center Info */}
                <div className="flex flex-col items-center justify-center mt-12">
                    <span className={`px-4 py-1 rounded-full text-xs font-bold mb-4 ${store.drawStatus === 'recruiting' ? 'bg-green-500/10 text-green-400 border border-green-500/50' : ''}`}>
                        {store.drawStatus === 'recruiting' ? '● 모집 중' : '대기 중'}
                    </span>

                    {store.useDrawCommand ? (
                        <div className="text-gray-400 text-sm mb-2 font-bold tracking-widest">KEYWORD: <span className="text-white text-xl ml-2">{store.drawKeyword}</span></div>
                    ) : (
                        <div className="text-gray-400 text-sm mb-2 font-bold tracking-widest">자동 수집 모드</div>
                    )}

                    <div className="text-[6rem] font-black text-white tabular-nums leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        {store.drawCandidates.length}
                    </div>
                    <span className="text-gray-500 font-bold mt-2">참여 인원</span>
                </div>

                {/* Chat Preview (Bottom) */}
                <div className="absolute bottom-8 text-center w-full px-8">
                    <div className="text-gray-600 text-xs font-bold mb-2">
                        {store.useDrawCommand ? '채팅창에 키워드를 입력하세요!' : '채팅창에 아무 말이나 입력하시면 참여됩니다!'}
                    </div>
                </div>
            </div>
        );
    }

    // RENDER: PICKING (Spinning) & WINNER
    // Combined structure for smooth transition
    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-[#111]">

            {/* Slot Machine Container */}
            <div className={`relative flex flex-col items-center transition-all duration-700 ${showChatReveal ? '-translate-y-24' : ''}`}>
                {/* Top Line */}
                <div className="w-[400px] h-[2px] bg-gradient-to-r from-transparent via-[#00ff80] to-transparent mb-8"></div>

                {/* Name Slot */}
                <div className="min-h-[80px] flex items-center justify-center overflow-hidden">
                    <span className={`text-4xl md:text-6xl font-black text-white tracking-tight ${store.drawStatus === 'picking' ? 'animate-pulse' : 'text-[#00ff80] drop-shadow-[0_0_15px_rgba(0,255,128,0.5)]'}`}>
                        {slotName}
                    </span>
                </div>

                {/* Bottom Line */}
                <div className="w-[400px] h-[2px] bg-gradient-to-r from-transparent via-[#00ff80] to-transparent mt-8"></div>

                {/* Winner Label */}
                {store.drawWinner && !store.isSpinning && (
                    <div className="absolute -top-16 animate-bounce">
                        <Crown className="text-yellow-400 w-10 h-10 drop-shadow-md" fill="currentColor" />
                    </div>
                )}
            </div>

            {/* Chat Reveal Section */}
            <div className={`absolute bottom-0 w-full max-w-2xl px-6 transition-all duration-700 ease-out flex flex-col items-center ${showChatReveal ? 'h-[40%] opacity-100 mb-8' : 'h-0 opacity-0 mb-0'}`}>
                <div className="w-full h-[1px] bg-gray-800 mb-4"></div>
                <div className="flex-1 w-full bg-[#1a1a1a]/80 backdrop-blur-md rounded-xl border border-[#333] overflow-hidden flex flex-col shadow-2xl">
                    <div className="bg-[#222] px-4 py-2 border-b border-[#333] flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400">최근 채팅</span>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll" ref={scrollRef}>
                        {store.chatHistory.length === 0 ? (
                            <div className="text-center text-gray-600 text-xs py-10">채팅 기록이 없습니다.</div>
                        ) : (
                            store.chatHistory.map((msg, idx) => (
                                <div key={idx} className={`text-sm ${msg.nickname === store.drawWinner?.name ? 'bg-[#00ff80]/10 border border-[#00ff80]/30 rounded-lg p-2' : ''}`}>
                                    <span className={`font-bold mr-2 ${msg.nickname === store.drawWinner?.name ? 'text-[#00ff80]' : 'text-gray-400'}`}>{msg.nickname}:</span>
                                    <span className="text-gray-200">{msg.message}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                {isDashboard && (
                    <div className="flex gap-2 mt-4 animate-fadeIn">
                        <button onClick={store.resetDraw} className="px-6 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg font-bold text-sm transition-all">다시 추첨하기</button>
                    </div>
                )}
            </div>

            {/* Confetti if winner */}
            {store.drawWinner && showChatReveal && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(30)].map((_, i) => (
                        <div key={i} className="absolute w-2 h-2 bg-[#00ff80] rounded-sm animate-pulse" style={{
                            left: `${Math.random() * 100}%`,
                            top: '-10%',
                            animation: `fall ${2 + Math.random() * 3}s linear infinite`,
                            animationDelay: `${Math.random() * 5}s`,
                            opacity: Math.random()
                        }}></div>
                    ))}
                    <style jsx>{`
                         @keyframes fall {
                             to { transform: translateY(110vh) rotate(360deg); }
                         }
                     `}</style>
                </div>
            )}
        </div>
    );
}
