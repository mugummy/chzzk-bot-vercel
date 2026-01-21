'use client';

import React, { useState } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import VoteDisplay from '@/components/dashboard/vote/VoteDisplay';
import DrawDisplay from '@/components/dashboard/vote/DrawDisplay';
import RouletteDisplay from '@/components/dashboard/vote/RouletteDisplay';
import {
    Users, BarChart2, Coins, Disc, Settings, Sliders, Zap,
    Clock, Trash2, Shuffle, Check, Play, Volume2, Save,
    Link, Eye, EyeOff, Crown, Copy, ToggleLeft, ToggleRight
} from 'lucide-react';
import WinnerModal from '@/components/dashboard/vote/WinnerModal';

export default function VoteTab() {
    const store = useVoteStore();
    const [activeTab, setActiveTab] = useState<'vote' | 'draw' | 'donate' | 'roulette' | 'settings'>('draw');

    // Toggle Helper
    const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
        <div onClick={onChange} className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${checked ? 'bg-[#00ff80]' : 'bg-gray-600'}`}>
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
    );

    // Helpers for Conflict Check
    const checkConflictAndStart = (actionName: string, startFunction: () => void) => {
        let activeTasks = [];
        if (store.drawStatus === 'recruiting') activeTasks.push('추첨 모집');
        if (store.voteStatus === 'active') activeTasks.push('투표');
        if (store.isSpinning) activeTasks.push('룰렛');

        if (activeTasks.length > 0) {
            if (confirm(`현재 [${activeTasks.join(', ')}] 기능이 진행 중입니다.\n기존 작업을 중단하고 [${actionName}]을(를) 시작하시겠습니까?`)) {
                if (store.drawStatus === 'recruiting') store.stopDraw();
                if (store.voteStatus === 'active') store.stopVote();
                startFunction();
            }
        } else {
            startFunction();
        }
    };

    return (
        <div className="flex flex-col h-full text-white overflow-hidden bg-[#111] p-4 rounded-[2rem]">
            {/* Header / Nav */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00ff80] rounded-lg flex items-center justify-center text-black shadow-[0_0_15px_rgba(0,255,128,0.4)]">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white">CHZZK <span className="text-[#00ff80]">BOT</span></h1>
                        <p className="text-xs text-gray-500 font-medium">Dashboard Controller</p>
                    </div>
                </div>
                <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-[#333]">
                    {[
                        { id: 'draw', name: '시청자 추첨', icon: <Users size={16} /> },
                        { id: 'vote', name: '숫자 투표', icon: <BarChart2 size={16} /> },
                        { id: 'donate', name: '도네 투표', icon: <Coins size={16} /> },
                        { id: 'roulette', name: '룰렛', icon: <Disc size={16} /> },
                        { id: 'settings', name: '설정', icon: <Settings size={16} /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#00ff80] text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                        >
                            {tab.icon}
                            <span className="hidden md:inline">{tab.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Split */}
            <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">

                {/* LEFT PANEL (Controls) */}
                <div className="w-[380px] flex flex-col shrink-0">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 flex-1 flex flex-col shadow-2xl relative overflow-hidden">
                        <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-white relative z-10">
                            <Sliders className="text-[#00ff80]" size={18} /> 설정 및 제어
                        </h2>

                        {/* DRAW CONTROLS */}
                        {activeTab === 'draw' && (
                            <div className="flex flex-col gap-4 h-full relative z-10">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-[#262626] rounded-xl border border-transparent shadow-sm">
                                        <span className={`text-sm font-bold ${store.drawSubsOnly ? 'text-white' : 'text-gray-300'}`}>구독자 전용 추첨</span>
                                        <Toggle checked={store.drawSubsOnly} onChange={() => store.send({ type: 'updateDraw', subsOnly: !store.drawSubsOnly })} />
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-[#262626] rounded-xl border border-transparent shadow-sm">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-300">명령어 추첨 (!참여)</span>
                                            <input
                                                value={store.drawKeyword}
                                                onChange={(e) => store.send({ type: 'updateDraw', keyword: e.target.value })}
                                                className="bg-[#111] text-white p-2 mt-1 rounded-lg border border-[#333] text-sm outline-none focus:border-[#00ff80]"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 flex flex-col gap-2 relative z-10">
                                    <button onClick={store.resetDraw} className="w-full py-3 rounded-xl font-bold text-red-400 bg-[#222] hover:bg-red-500/10 hover:text-red-500 border border-[#444] transition-all flex items-center justify-center gap-2">
                                        <Trash2 size={16} /> 명단 초기화
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (store.drawStatus === 'recruiting') store.stopDraw();
                                            else checkConflictAndStart('추첨 모집', () => store.startDrawRecruit({ keyword: store.drawKeyword, subsOnly: store.drawSubsOnly, duration: 60 }));
                                        }}
                                        className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-lg active:scale-95 ${store.drawStatus === 'recruiting' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#00ff80] text-black hover:bg-[#00cc66]'}`}
                                    >
                                        {store.drawStatus === 'recruiting' ? '모집 종료' : '참여자 모집 시작'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* VOTE & DONATE CONTROLS */}
                        {(activeTab === 'vote' || activeTab === 'donate') && (
                            <div className="flex flex-col gap-3 h-full relative z-10">
                                {activeTab === 'donate' && (
                                    <div className="bg-[#222] p-3 rounded-xl border border-[#333] flex items-start gap-3">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-[#333] flex items-center justify-center text-[#00ff80]"><Zap size={12} /></div>
                                        <div className="text-xs text-gray-400 leading-relaxed">
                                            <p className="font-bold text-white">참여 방법</p>
                                            후원 메시지에 <span className="text-[#00ff80] font-bold">!투표 [번호]</span> 입력
                                        </div>
                                    </div>
                                )}

                                <div className="bg-[#262626] p-4 rounded-xl border border-[#333] space-y-2 shadow-sm shrink-0">
                                    <div className="text-xs text-gray-400 font-bold">투표 주제</div>
                                    <input
                                        value={store.voteTitle}
                                        onChange={(e) => store.send({ type: 'updateVoteSettings', title: e.target.value })}
                                        placeholder="투표 주제를 입력하세요..."
                                        className="w-full bg-transparent text-white font-bold text-lg outline-none border-b border-[#444] focus:border-[#00ff80] transition-colors placeholder-gray-600"
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scroll">
                                    {store.voteItems.map((item, idx) => (
                                        <div key={item.id} className="flex gap-2 items-center">
                                            <div className="w-6 h-6 rounded-full bg-[#333] flex items-center justify-center text-xs text-gray-500 font-mono">{idx + 1}</div>
                                            <input
                                                value={item.name}
                                                readOnly // Items editing not implemented in Simplified Store yet (needs DB sync for updates)
                                                className="flex-1 bg-[#262626] text-white px-3 py-3 rounded-lg outline-none text-sm opacity-70 cursor-not-allowed"
                                            />
                                        </div>
                                    ))}
                                    <div className="text-xs text-center text-gray-500 py-2">항목 수정은 투표 시작 전에 설정해주세요 (현재 읽기 전용)</div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-[#333] space-y-2 relative z-10">
                                    <button onClick={() => checkConflictAndStart('룰렛 연동', store.transferVotesToRoulette)} className="w-full py-3 rounded-xl font-bold bg-[#333] text-gray-300 hover:bg-[#444] hover:text-white transition-all border border-[#444] flex items-center justify-center gap-2">
                                        <Shuffle size={16} /> 투표 결과로 룰렛 만들기
                                    </button>
                                    <button onClick={store.resetVote} className="w-full py-3 rounded-xl font-bold text-red-400 bg-[#222] hover:bg-red-500/10 hover:text-red-500 border border-[#444] transition-all flex items-center justify-center gap-2">
                                        <Trash2 size={16} /> 투표 초기화
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (store.voteStatus === 'active') store.endVote();
                                            else checkConflictAndStart('투표', () => store.startVote({
                                                title: store.voteTitle || '투표',
                                                mode: activeTab === 'vote' ? 'numeric' : 'donation',
                                                items: ['항목1', '항목2'], // TODO: UI to add items locally before start
                                                duration: 60,
                                                allowMulti: store.allowMultiVote,
                                                unit: store.voteUnit
                                            }));
                                        }}
                                        className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-lg active:scale-95 ${store.voteStatus === 'active' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#00ff80] text-black hover:bg-[#00cc66]'}`}
                                    >
                                        {store.voteStatus === 'active' ? '투표 종료' : '투표 시작'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ROULETTE CONTROLS */}
                        {activeTab === 'roulette' && (
                            <div className="flex flex-col gap-3 h-full relative z-10">
                                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scroll">
                                    {store.rouletteItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-center group">
                                            <div className="w-1 h-8 rounded-full" style={{ background: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1'][idx % 6] }}></div>
                                            <div className="flex-1 bg-[#262626] text-white px-3 py-2 rounded-lg text-sm">{item.name}</div>
                                            <div className="w-12 bg-[#262626] text-white px-2 py-2 rounded-lg text-xs text-center">{item.weight}</div>
                                        </div>
                                    ))}
                                    <div className="text-center text-xs text-gray-500 py-4 border border-dashed border-[#444] rounded-lg">아이템 수정은 준비중입니다</div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-[#333] flex flex-col gap-2 relative z-10">
                                    <button onClick={store.resetRoulette} className="w-full py-3 rounded-xl font-bold text-red-400 bg-[#222] hover:bg-red-500/10 hover:text-red-500 border border-[#444] transition-all flex items-center justify-center gap-2">
                                        <Trash2 size={16} /> 룰렛 초기화
                                    </button>
                                    <button
                                        onClick={() => checkConflictAndStart('룰렛 돌리기', store.spinRoulette)}
                                        disabled={store.isSpinning}
                                        className="w-full py-4 rounded-xl font-black bg-white text-black text-lg shadow-lg active:scale-95 disabled:opacity-50 transition-all"
                                    >
                                        돌려! (SPIN)
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SETTINGS (Simplified) */}
                        {activeTab === 'settings' && (
                            <div className="flex flex-col gap-2 h-full justify-center text-center text-gray-500">
                                <Settings className="mx-auto mb-2 opacity-50" size={48} />
                                <p>설정 메뉴는 준비중입니다.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL (Content) */}
                <div className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-2xl relative overflow-hidden flex flex-col shadow-2xl">
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    {/* Header */}
                    <div className="relative z-20 flex justify-between items-center p-8 pb-4 shrink-0">
                        {(activeTab === 'vote' || activeTab === 'donate') && (
                            <div className="flex flex-col">
                                <span className="text-3xl font-black text-white">총 {store.voteItems.reduce((acc, i) => acc + i.count, 0)}표</span>
                                <span className={`text-xs font-bold tracking-wider mt-1 ${store.voteStatus === 'active' ? 'text-red-500' : 'text-gray-500'}`}>
                                    {store.voteStatus === 'active' ? '● LIVE' : '○ STANDBY'}
                                </span>
                            </div>
                        )}
                        <div className="text-5xl font-mono font-black text-white tracking-widest leading-none ml-auto">
                            {/* Timer placeholder if logic requires */}
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-hidden p-6 pt-0 flex items-center justify-center">
                            {activeTab === 'draw' && <DrawDisplay mode="dashboard" />}
                            {(activeTab === 'vote' || activeTab === 'donate') && <VoteDisplay mode="dashboard" />}
                            {activeTab === 'roulette' && (
                                <div className="transform scale-[1.3]">
                                    <RouletteDisplay items={store.rouletteItems} />
                                    {store.rouletteWinner && (
                                        <div className="mt-8 text-4xl font-black text-[#00ff80] animate-bounce text-center drop-shadow-[0_0_10px_rgba(0,255,128,0.5)]">
                                            🎉 {store.rouletteWinner}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
