'use client';

import React, { useEffect } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import VoteDisplay from '@/components/dashboard/vote/VoteDisplay';
import DrawDisplay from '@/components/dashboard/vote/DrawDisplay';
import RouletteDisplay from '@/components/dashboard/vote/RouletteDisplay';
import { useParams } from 'next/navigation';

export default function OverlayPage() {
    const params = useParams();
    const userId = params.userId as string;
    const store = useVoteStore();

    useEffect(() => {
        if (userId) {
            if (userId) {
                store.connect(userId);
            }
        }
        return () => {
            store.disconnect();
        }
    }, [userId]);

    // Active Overlay Logic
    // Store has showVoteOverlay, showDrawOverlay, showRouletteOverlay
    // We render based on these flags.

    // Header Logic (Step 1301 from Vue):
    // "Floating Pill" for Title.
    // Logic:
    // If Draw -> "시청자 추첨"
    // If Vote -> store.voteTitle || (mode==donation ? '후원 투표' : '실시간 투표')
    // If Roulette -> "행운의 룰렛"

    const getHeaderTitle = () => {
        if (store.showDrawOverlay) return '시청자 추첨';
        if (store.showVoteOverlay) {
            if (store.voteTitle) return store.voteTitle;
            return store.voteMode === 'donation' ? '후원 투표' : '실시간 투표';
        }
        if (store.showRouletteOverlay) return '행운의 룰렛';
        return '';
    };

    const title = getHeaderTitle();
    const hasActiveOverlay = store.showDrawOverlay || store.showVoteOverlay || store.showRouletteOverlay;

    // Transition?
    // Vue had transition="pop-in". 
    // We can use Framer Motion or standard CSS.
    // Let's use simple CSS opacity/transform for now or just conditional rendering.

    if (!hasActiveOverlay) return null;

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-transparent">
            {/* Container Box */}
            <div className="relative mt-20 p-12 rounded-[40px] bg-[#0f0f0f]/90 border-2 border-white/10 shadow-2xl flex flex-col items-center min-w-[600px] min-h-[400px] backdrop-blur-sm transform scale-110">

                {/* Floating Header */}
                {title && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 bg-[#111] px-10 py-3 rounded-full border border-white/20 shadow-lg flex items-center gap-4 whitespace-nowrap">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]"></div>
                        <span className="text-3xl font-black text-[#00ff80] tracking-widest uppercase drop-shadow-md">
                            {title}
                        </span>
                    </div>
                )}

                {/* Timer (Optional) */}
                {/* Logic from Vue: if timer > 0 show it? */}
                {/* We haven't fully implemented timer string logic in store, but we have voteTimer/drawTimer */}

                {/* Content */}
                <div className="w-full flex-1 flex items-center justify-center pt-6">
                    {store.showDrawOverlay && <DrawDisplay mode="overlay" />}
                    {store.showVoteOverlay && <VoteDisplay mode="overlay" />}
                    {store.showRouletteOverlay && (
                        <div className="transform -translate-y-10 scale-[1.3]">
                            <RouletteDisplay items={store.rouletteItems} />
                            {store.rouletteWinner && (
                                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                                    <div className="bg-black/80 px-12 py-8 rounded-3xl border border-[#00ff80]/50 backdrop-blur-lg animate-bounce text-center">
                                        <div className="text-[#00ff80] font-black text-xl mb-2 tracking-widest">WINNER</div>
                                        <div className="text-6xl font-black text-white">{store.rouletteWinner}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
