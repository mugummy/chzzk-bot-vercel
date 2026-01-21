'use client';

import React, { useEffect, useState } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import VoteDisplay from '@/components/dashboard/vote/VoteDisplay';
import DrawDisplay from '@/components/dashboard/vote/DrawDisplay';
import RouletteDisplay from '@/components/dashboard/vote/RouletteDisplay';

export default function VotePage() {
    const store = useVoteStore();
    const [activeTab, setActiveTab] = useState<'vote' | 'draw' | 'roulette'>('vote');
    const [userId, setUserId] = useState<string>(''); // Should get from Auth Context or stored token

    // Auth Simulation: In real app, get from session
    useEffect(() => {
        // Mock User ID or fetch from context?
        // chzzk-bot-server expects userId to identify the bot instance.
        // User connects to dashboard -> Auth -> gets user ID.
        // Let's assume we can get it from localStorage or existing context?
        // `DashboardNav.tsx` receives `user` prop.
        // But this is a page.
        // Let's implement a simple prompt or fetch mechanism if needed.
        // For now, hardcode or use a known test ID, OR better:
        // `useUser()` hook?

        // Temporary: Using 'demouser' or check localStorage
        const id = localStorage.getItem('userId') || 'test-user';
        setUserId(id);

        // Connect to WebSocket using native WS
        // URL from env or default
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
        store.connect(wsUrl, id);

        return () => {
            store.disconnect();
        }
    }, []);

    if (!store.isConnected) {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ff80] mx-auto mb-4"></div>
                    <p>서버 연결 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden">

            {/* Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00ff80] to-[#00bfff]">
                        투표 / 추첨 / 룰렛
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">방송에 재미를 더하는 실시간 상호작용 도구</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-lg">
                    {['vote', 'draw', 'roulette'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2 rounded-md font-bold transition-all ${activeTab === tab ? 'bg-[#333] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab === 'vote' && '실시간 투표'}
                            {tab === 'draw' && '시청자 추첨'}
                            {tab === 'roulette' && '행운의 룰렛'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex gap-6 min-h-0">

                {/* Left: Controls */}
                <div className="w-[400px] flex flex-col gap-4 overflow-y-auto custom-scroll pr-2 shrink-0">
                    {/* VOTE CONTROLS */}
                    {activeTab === 'vote' && (
                        <div className="space-y-4">
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 space-y-4">
                                <h3 className="font-bold text-lg border-b border-white/5 pb-2">투표 설정</h3>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-bold">투표 모드</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => store.send({ type: 'startVote', ...{ mode: 'numeric' } /* Mock partial update? No, needs full params */ })}
                                            className={`py-2 rounded border ${store.voteMode === 'numeric' ? 'border-[#00ff80] text-[#00ff80] bg-[#00ff80]/10' : 'border-[#333] text-gray-400'}`}>
                                            숫자 투표 (!투표 1)
                                        </button>
                                        <button onClick={() => store.send({ type: 'startVote', ...{ mode: 'donation' } })}
                                            className={`py-2 rounded border ${store.voteMode === 'donation' ? 'border-[#00ff80] text-[#00ff80] bg-[#00ff80]/10' : 'border-[#333] text-gray-400'}`}>
                                            후원 투표 (치즈)
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-bold">투표 주제</label>
                                    <input
                                        value={store.voteTitle}
                                        onChange={(e) => store.send({ type: 'updateVoteSettings', title: e.target.value }) /* Need backend support for live update without restart? */}
                                        // If backend doesn't support live update (only startVote), we track local state then send startVote.
                                        // Store `voteTitle` is from Backend Sync.
                                        // So we need local state for "New Vote Setup".
                                        className="w-full bg-[#262626] border border-white/10 rounded p-2 text-white"
                                        placeholder="주제를 입력하세요"
                                    />
                                </div>

                                {/* Start/Stop Buttons */}
                                {store.voteStatus === 'active' ? (
                                    <button onClick={store.endVote} className="w-full py-4 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-white shadow-lg shadow-red-500/20 transition-all">
                                        투표 종료
                                    </button>
                                ) : (
                                    <button onClick={() => store.startVote({
                                        title: '테스트 투표', // Use local state in real imp
                                        mode: 'numeric',
                                        items: ['항목1', '항목2'],
                                        duration: 60,
                                        allowMulti: false,
                                        unit: 1000
                                    })} className="w-full py-4 bg-[#00ff80] hover:bg-[#00e676] rounded-xl font-bold text-black shadow-lg shadow-[#00ff80]/20 transition-all">
                                        투표 시작
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ROULETTE CONTROLS */}
                    {activeTab === 'roulette' && (
                        <div className="space-y-4">
                            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 space-y-4">
                                <h3 className="font-bold text-lg border-b border-white/5 pb-2">룰렛 제어</h3>
                                <button onClick={store.spinRoulette} disabled={store.isSpinning}
                                    className="w-full py-4 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-xl font-bold text-white transition-all">
                                    {store.isSpinning ? '돌아가는 중...' : '룰렛 돌리기'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Center: Preview / Display */}
                <div className="flex-1 bg-[#151515] rounded-2xl border border-white/5 relative flex items-center justify-center p-8 shadow-inner overflow-hidden">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    <div className="relative z-10 w-full max-w-2xl">
                        {activeTab === 'vote' && <VoteDisplay mode="dashboard" />}
                        {activeTab === 'draw' && <DrawDisplay mode="dashboard" />}
                        {activeTab === 'roulette' && (
                            <div className="flex flex-col items-center">
                                <RouletteDisplay
                                    items={store.rouletteItems}
                                    className="transform scale-100" // Normal size in dashboard
                                />
                                {store.rouletteWinner && (
                                    <div className="mt-8 text-4xl font-black text-[#00ff80] animate-bounce">
                                        🎉 {store.rouletteWinner}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
