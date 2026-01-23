'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import { Crown, Sparkles, Users, Play, Square, Trophy, Shuffle } from 'lucide-react';

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

    // RENDER: RECRUITING OR READY
    if (store.drawStatus === 'recruiting' || store.drawStatus === 'ready') {
        return (
            <div className="w-full h-full flex flex-col items-center relative bg-transparent overflow-hidden">
                {/* Header Info */}
                <div className="w-full p-6 border-b border-[#333] bg-black/20 flex justify-between items-center shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <span className={`px-4 py-1 rounded-full text-xs font-bold ${store.drawStatus === 'recruiting' ? 'bg-green-500/10 text-green-400 border border-green-500/50 animate-pulse' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/50'}`}>
                            {store.drawStatus === 'recruiting' ? '● 모집 중' : '● 대기 중 (추첨 준비)'}
                        </span>
                        <div className="text-2xl font-black text-white">
                            <span className="text-gray-500 text-base font-bold mr-2">참여 인원</span>
                            {store.drawCandidates.length}명
                        </div>
                    </div>

                    {isDashboard && (
                        <div className="flex gap-2">
                            {store.drawStatus === 'ready' ? (
                                <>
                                    <button
                                        onClick={() => store.startDrawRecruit({ duration: store.useDrawTimer ? store.drawTimerDuration : undefined })}
                                        className="bg-[#333] hover:bg-[#444] text-white px-6 py-2 rounded-lg font-bold transition-all border border-[#444]"
                                    >
                                        추가 모집하기
                                    </button>
                                    <button
                                        onClick={() => store.pickDrawWinner(1)}
                                        className="bg-[#00ff80] text-black px-8 py-2 rounded-lg font-bold hover:bg-[#00cc66] shadow-[0_0_15px_rgba(0,255,128,0.3)] transition-all"
                                    >
                                        추첨하기
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={store.stopDraw}
                                    className="bg-red-500/10 text-red-500 border border-red-500/50 px-6 py-2 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-all"
                                >
                                    모집 종료
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Participant List (Scrollable) */}
                <div className="flex-1 w-full overflow-y-auto p-4 custom-scroll relative">
                    {store.drawCandidates.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                            <Users size={48} className="opacity-20" />
                            <div className="text-sm font-bold">참여자가 없습니다</div>
                            <div className="text-xs opacity-50">
                                {store.useDrawCommand ? `채팅창에 '${store.drawKeyword}'를 입력하세요` : '채팅창에 메시지를 입력하면 참여됩니다'}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {store.drawCandidates.map((user, idx) => (
                                <div key={idx} className="bg-[#262626] p-3 rounded-lg border border-[#333] flex items-center gap-3 hover:border-[#444] transition-colors">
                                    {/* Role Icon */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs
                                        ${user.role === '스트리머' ? 'bg-[#00ff80] text-black' :
                                            user.role === '매니저' ? 'bg-green-700 text-white' :
                                                user.role === '구독자' ? 'bg-[#333] text-[#00ff80] border border-[#00ff80]' :
                                                    'bg-[#111] text-gray-400 border border-[#333]'}`
                                    }>
                                        {user.role === '스트리머' && <Crown size={14} fill="currentColor" />}
                                        {user.role === '매니저' && <Sparkles size={14} fill="currentColor" />}
                                        {user.role === '구독자' && '구'}
                                        {['팬', '일반', undefined].includes(user.role) && <Users size={14} />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-gray-200 font-bold truncate text-sm">{user.name}</div>
                                        {user.lastMessage && <div className="text-gray-500 text-xs truncate">{user.lastMessage}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Floating Info Overlay for Empty State or Guide */}
                    {store.drawStatus === 'recruiting' && store.drawCandidates.length > 0 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10 text-xs font-bold text-gray-400 pointer-events-none shadow-xl">
                            {store.useDrawCommand ? `${store.drawKeyword} 입력하여 참여` : '채팅 입력하여 참여'}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // RENDER: PICKING (Spinning) & WINNER
    // Revert to "Lines" design per user request

    // Win Timestamp for filtering chat
    const [winTime, setWinTime] = useState<number>(0);

    useEffect(() => {
        if (store.drawWinner) {
            setWinTime(Date.now());
        }
    }, [store.drawWinner]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-transparent">

            {/* Reverted Design: Simple Lines & Center Text */}
            <div className={`relative flex flex-col items-center transition-all duration-700 ${showChatReveal ? '-translate-y-24' : ''}`}>

                {/* Top Line */}
                <div className="w-[300px] md:w-[600px] h-[2px] bg-gradient-to-r from-transparent via-[#00ff80] to-transparent mb-8"></div>

                {/* Name Area - Masked for Spinning Effect */}
                <div className="h-[80px] md:h-[120px] overflow-hidden relative flex items-center justify-center w-full">
                    {store.drawStatus === 'picking' ? (
                        <div className="flex flex-col items-center animate-text-spin blur-sm opacity-80">
                            {/* Repeated list for visual spinning effect */}
                            {Array.from({ length: 20 }).map((_, i) => (
                                <span key={i} className="text-5xl md:text-8xl font-black text-gray-500 py-4 block">
                                    {['WAITING', 'PICKING', 'LUCKY', 'WINNER', 'CHZZK'][i % 5]}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="animate-land">
                            <span className={`text-6xl md:text-8xl font-black tracking-tight px-4 leading-none ${store.drawWinner ? 'text-[#00ff80] drop-shadow-[0_0_30px_rgba(0,255,128,0.6)]' : 'text-gray-600'}`}>
                                {slotName}
                            </span>
                        </div>
                    )}
                </div>

                {/* Bottom Line */}
                <div className="w-[300px] md:w-[600px] h-[2px] bg-gradient-to-r from-transparent via-[#00ff80] to-transparent mt-8"></div>

                {/* Winner Badge */}
                {store.drawWinner && !store.isSpinning && (
                    <div className="absolute -top-20 animate-bounce">
                        <div className="flex flex-col items-center gap-2">
                            <Crown className="text-yellow-400 w-12 h-12 drop-shadow-md" fill="currentColor" />
                            <div className="px-3 py-1 bg-[#222] border border-[#333] rounded-full text-xs text-gray-300 font-bold">{store.drawWinner.role}</div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes text-spin {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                }
                .animate-text-spin {
                    animation: text-spin 0.5s linear infinite;
                }
                 .animate-land {
                    animation: land 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes land {
                    0% { transform: scale(0.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>

            {/* Chat Reveal Section (Only if Winner) */}
            {store.drawWinner && (
                <div className={`absolute bottom-0 w-full max-w-3xl px-6 transition-all duration-700 ease-out flex flex-col items-center ${showChatReveal ? 'h-[40%] opacity-100 mb-8' : 'h-0 opacity-0 mb-0'}`}>
                    <div className="w-full h-[1px] bg-gray-800 mb-4"></div>
                    <div className="flex-1 w-full bg-[#1a1a1a]/90 backdrop-blur-md rounded-xl border border-[#333] overflow-hidden flex flex-col shadow-2xl">
                        <div className="bg-[#222] px-4 py-2 border-b border-[#333] flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400">당첨자 채팅 (당첨 이후)</span>
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll" ref={scrollRef}>
                            {store.chatHistory.filter(msg => msg.timestamp >= winTime).length === 0 ? (
                                <div className="text-center text-gray-600 text-xs py-10">당첨자가 아직 채팅을 입력하지 않았습니다.</div>
                            ) : (
                                store.chatHistory.filter(msg => msg.timestamp >= winTime).map((msg, idx) => (
                                    <div key={idx} className={`text-sm ${msg.nickname === store.drawWinner?.name ? 'bg-[#00ff80]/10 border border-[#00ff80]/30 rounded-lg p-2' : 'opacity-40'}`}>
                                        <span className={`font-bold mr-2 ${msg.nickname === store.drawWinner?.name ? 'text-[#00ff80]' : 'text-gray-500'}`}>{msg.nickname}:</span>
                                        <span className="text-gray-200">{msg.message}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {isDashboard && (
                        <div className="flex gap-2 mt-4 animate-fadeIn">
                            <button onClick={() => store.pickDrawWinner(1)} className="px-6 py-2 bg-[#00ff80] text-black hover:bg-[#00cc66] rounded-lg font-bold text-sm transition-all shadow-lg">다시 추첨하기</button>
                            <button onClick={store.resetDraw} className="px-6 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg font-bold text-sm transition-all border border-[#444]">목록으로</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
