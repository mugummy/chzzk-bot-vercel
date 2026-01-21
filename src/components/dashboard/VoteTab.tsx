'use client';

import React, { useEffect, useState } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import VoteDisplay from '@/components/dashboard/vote/VoteDisplay';
import DrawDisplay from '@/components/dashboard/vote/DrawDisplay';
import RouletteDisplay from '@/components/dashboard/vote/RouletteDisplay';

export default function VoteTab() {
    const store = useVoteStore();
    const [activeTab, setActiveTab] = useState<'vote' | 'draw' | 'roulette'>('vote');
    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        // Auth Logic: Reuse existing token logic or store
        const id = localStorage.getItem('userId') || 'test-user';
        setUserId(id);

        // Connect to WS
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
        store.connect(wsUrl, id);

        return () => { store.disconnect(); }
    }, []);

    if (!store.isConnected) {
        return (
            <div className="flex items-center justify-center h-full min-h-[500px] text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ff80] mx-auto mb-4"></div>
                    <p>Voting Server Connecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full text-white overflow-hidden">
            {/* Header Section inside Tab */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-white">상호작용</h2>
                    <p className="text-sm text-gray-500 mt-1">투표, 추첨, 룰렛을 관리합니다.</p>
                </div>

                {/* Internal Tabs */}
                <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-xl border border-white/5">
                    {['vote', 'draw', 'roulette'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === tab ? 'bg-[#333] text-white shadow-lg border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab === 'vote' && '실시간 투표'}
                            {tab === 'draw' && '시청자 추첨'}
                            {tab === 'roulette' && '행운의 룰렛'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">

                {/* Left: Controls */}
                <div className="w-[350px] flex flex-col gap-4 overflow-y-auto custom-scroll pr-2 shrink-0">
                    {/* VOTE CONTROLS */}
                    {activeTab === 'vote' && (
                        <div className="space-y-4">
                            <div className="bg-[#1a1a1a] p-6 rounded-[1.5rem] border border-white/5 space-y-4 shadow-lg">
                                <h3 className="font-bold text-lg border-b border-white/5 pb-2">투표 설정</h3>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">투표 모드</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => store.send({ type: 'startVote', ...{ mode: 'numeric' } })}
                                            className={`py-3 rounded-xl border font-bold text-sm transition-all ${store.voteMode === 'numeric' ? 'border-[#00ff80] text-[#00ff80] bg-[#00ff80]/10' : 'border-[#333] text-gray-500 hover:border-gray-500'}`}>
                                            숫자 투표
                                        </button>
                                        <button onClick={() => store.send({ type: 'startVote', ...{ mode: 'donation' } })}
                                            className={`py-3 rounded-xl border font-bold text-sm transition-all ${store.voteMode === 'donation' ? 'border-[#00ff80] text-[#00ff80] bg-[#00ff80]/10' : 'border-[#333] text-gray-500 hover:border-gray-500'}`}>
                                            후원 투표
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">투표 주제</label>
                                    <input
                                        value={store.voteTitle}
                                        onChange={(e) => store.send({ type: 'updateVoteSettings', title: e.target.value })}
                                        className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 text-white focus:border-[#00ff80] transition-colors outline-none"
                                        placeholder="주제를 입력하세요"
                                    />
                                </div>

                                {/* Start/Stop Buttons */}
                                {store.voteStatus === 'active' ? (
                                    <button onClick={store.endVote} className="w-full py-4 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/50 text-red-500 rounded-xl font-bold transition-all shadow-lg hover:shadow-red-500/20">
                                        투표 종료
                                    </button>
                                ) : (
                                    <button onClick={() => store.startVote({
                                        title: '테스트 투표',
                                        mode: 'numeric',
                                        items: ['찬성', '반대'], // Simple default
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

                    {/* DRAW CONTROLS */}
                    {activeTab === 'draw' && (
                        <div className="space-y-4">
                            <div className="bg-[#1a1a1a] p-6 rounded-[1.5rem] border border-white/5 space-y-4 shadow-lg">
                                <h3 className="font-bold text-lg border-b border-white/5 pb-2">추첨 설정</h3>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">참여 키워드</label>
                                    <input
                                        value={store.drawKeyword}
                                        onChange={(e) => store.send({ type: 'updateDraw', keyword: e.target.value })}
                                        className="w-full bg-[#262626] border border-white/10 rounded-xl p-3 text-white focus:border-[#00ff80] outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={store.drawSubsOnly} onChange={(e) => store.send({ type: 'updateDraw', subsOnly: e.target.checked })} className="w-4 h-4 accent-[#00ff80]" />
                                    <label className="text-sm text-gray-300">구독자 전용</label>
                                </div>

                                {store.drawStatus === 'recruiting' ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => store.pickDrawWinner(1)} className="py-4 bg-[#00ff80] text-black rounded-xl font-bold hover:bg-[#00cc66] shadow-lg">
                                            추첨하기
                                        </button>
                                        <button onClick={() => store.stopDraw()} className="py-4 bg-red-500/10 text-red-500 border border-red-500/50 rounded-xl font-bold hover:bg-red-500 hover:text-white transition">
                                            취소
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => store.startDrawRecruit({ keyword: store.drawKeyword, subsOnly: store.drawSubsOnly, duration: 60 })} className="w-full py-4 bg-[#00bfff] text-black rounded-xl font-bold hover:bg-[#0099cc] shadow-lg shadow-[#00bfff]/20 transition">
                                        참여 모집 시작
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ROULETTE CONTROLS */}
                    {activeTab === 'roulette' && (
                        <div className="space-y-4">
                            <div className="bg-[#1a1a1a] p-6 rounded-[1.5rem] border border-white/5 space-y-4 shadow-lg">
                                <h3 className="font-bold text-lg border-b border-white/5 pb-2">룰렛 제어</h3>
                                <button onClick={store.spinRoulette} disabled={store.isSpinning}
                                    className="w-full py-4 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-xl font-bold text-white transition-all shadow-lg shadow-purple-500/20">
                                    {store.isSpinning ? '돌아가는 중...' : '룰렛 돌리기'}
                                </button>
                                <button onClick={store.resetRoulette} className="w-full py-3 bg-[#333] hover:bg-[#444] rounded-xl font-bold text-gray-300">
                                    초기화
                                </button>

                                {/* Item Edit Mockup */}
                                <div className="text-xs text-gray-500 mt-2 text-center">* 룰렛 항목은 현재 고정입니다 (Database Sync)</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Center: Preview / Display */}
                <div className="flex-1 bg-[#151515] rounded-[2rem] border border-white/5 relative flex items-center justify-center p-8 shadow-inner overflow-hidden">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    <div className="relative z-10 w-full max-w-3xl h-full flex flex-col justify-center">
                        {activeTab === 'vote' && <VoteDisplay mode="dashboard" />}
                        {activeTab === 'draw' && <DrawDisplay mode="dashboard" />}
                        {activeTab === 'roulette' && (
                            <div className="flex flex-col items-center">
                                <RouletteDisplay
                                    items={store.rouletteItems}
                                    className="transform scale-90"
                                />
                                {store.rouletteWinner && (
                                    <div className="mt-8 text-4xl font-black text-[#00ff80] animate-bounce drop-shadow-[0_0_10px_rgba(0,255,128,0.5)]">
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
