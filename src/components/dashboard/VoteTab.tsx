'use client';

import React, { useState, useEffect } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import VoteDisplay from '@/components/dashboard/vote/VoteDisplay';
import DrawDisplay from '@/components/dashboard/vote/DrawDisplay';
import RouletteDisplay from '@/components/dashboard/vote/RouletteDisplay';
import TTSSettings from '@/components/dashboard/settings/TTSSettings';
import {
    Users, BarChart2, Coins, Disc, Settings, Zap,
    Clock, Trash2, Shuffle, RotateCcw, SlidersHorizontal
} from 'lucide-react';
import Toggle from '@/components/ui/Toggle';

export default function VoteTab() {
    const store = useVoteStore();
    // activeTab 'menu' is the Home Grid
    const [activeTab, setActiveTab] = useState<'menu' | 'draw' | 'vote' | 'donate' | 'roulette' | 'settings'>('menu');

    // Local State for Draw/Roulette Control inputs (Preserved for persistence when switching tabs)
    const [localRouletteItems, setLocalRouletteItems] = useState<{ name: string; weight: number }[]>([]);
    const [localDrawKeyword, setLocalDrawKeyword] = useState('!참여');
    const [channelInput, setChannelInput] = useState('');

    // Sync Store -> Local
    useEffect(() => {
        if (store.drawKeyword) setLocalDrawKeyword(store.drawKeyword);
    }, [store.drawKeyword]);

    // Settings State
    const [settingCategory, setSettingCategory] = useState<'tts' | 'overlay'>('tts');

    // Voice Loading Logic (Client Side)
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    useEffect(() => {
        const loadVoices = () => {
            const v = window.speechSynthesis.getVoices();
            if (v.length > 0) {
                setVoices(v);
                if (!store.ttsVoice) {
                    const ko = v.find(voice => voice.lang.includes('ko'));
                    if (ko) {
                        store.updateTTSSettings({
                            volume: store.ttsVolume,
                            rate: store.ttsRate,
                            voice: ko.name,
                            enabled: store.useTTS
                        });
                    }
                }
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);


    // Sync Roulette Items
    useEffect(() => {
        if (store.rouletteItems.length > 0 && localRouletteItems.length === 0) {
            setLocalRouletteItems(store.rouletteItems);
        }
    }, [store.rouletteItems, localRouletteItems.length]);


    const checkConflictAndStart = (actionName: string, startFunction: () => void) => {
        let activeTasks = [];
        if (store.drawStatus === 'recruiting') activeTasks.push('추첨 모집');
        if (store.voteStatus === 'active') activeTasks.push('투표');
        if (store.isSpinning) activeTasks.push('룰렛');

        if (activeTasks.length > 0) {
            if (confirm(`현재 [${activeTasks.join(', ')}] 기능이 진행 중입니다.\n기존 작업을 중단하고 [${actionName}]을(를) 시작하시겠습니까?`)) {
                if (store.drawStatus === 'recruiting') store.stopDraw();
                if (store.voteStatus === 'active') store.endVote();
                startFunction();
            }
        } else {
            startFunction();
        }
    };

    const activeTimerString = () => {
        if (activeTab === 'draw' && store.drawStatus === 'recruiting' && store.useDrawTimer) return `${store.drawTimer}s`;
        if (['vote', 'donate'].includes(activeTab) && store.voteStatus === 'active' && store.useVoteTimer) {
            const m = Math.floor(store.voteTimer / 60).toString().padStart(2, '0');
            const s = (store.voteTimer % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        }
        return '';
    };

    const currentOverlayUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/overlay/${store.channelId || 'demo'}` : '';

    return (
        <div className="h-full w-full flex flex-col max-w-screen-2xl mx-auto relative text-white bg-transparent overflow-hidden">

            {/* Connection Modal */}
            {!store.isConnected && !store.isTestMode && (
                <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center animate-fadeIn backdrop-blur-sm">
                    <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#333] shadow-2xl w-full max-w-md text-center transform scale-100 transition-all">
                        <h2 className="text-2xl font-bold mb-4 text-[#00ff80]">치지직 채널 연결</h2>
                        <input
                            value={channelInput}
                            onChange={(e) => setChannelInput(e.target.value)}
                            placeholder="채널 ID 입력"
                            className="w-full bg-[#111] border border-[#444] rounded-lg p-4 text-white mb-4 focus:border-[#00ff80] outline-none text-center font-bold tracking-widest shadow-inner transition-colors"
                        />
                        <button
                            onClick={() => {
                                if (!channelInput.trim()) return alert('채널 ID를 입력하세요');
                                store.connect(channelInput.substring(0, 32));
                            }}
                            className="w-full bg-[#00ff80] text-black font-black py-4 rounded-xl hover:bg-[#00cc66] transition shadow-lg text-lg mb-4"
                        >
                            연결하기
                        </button>
                        <button
                            onClick={() => useVoteStore.setState({ isTestMode: true })}
                            className="text-gray-500 text-sm hover:text-white underline transition"
                        >
                            <span>테스트 모드로 시작</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Navigation Bar (Minimal) */}
            <div className="flex justify-end mb-4 shrink-0 z-20 px-4 pt-4">
                {activeTab === 'menu' ? (
                    <button
                        onClick={() => setActiveTab('settings')}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#333] transition-all flex items-center gap-2"
                    >
                        <Settings size={20} />
                    </button>
                ) : (
                    <button
                        onClick={() => setActiveTab('menu')}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-[#222] text-gray-300 hover:text-white hover:bg-[#333] border border-[#444] transition-all flex items-center gap-2"
                    >
                        <RotateCcw size={16} className="rotate-90" /> 메뉴로
                    </button>
                )}
            </div>

            <main className="flex-1 flex flex-col min-h-0 relative z-0">

                {/* 1. HOME MENU GRID */}
                {activeTab === 'menu' && (
                    <div className="flex-1 flex justify-center pt-4 px-4 pb-20 animate-fadeIn overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl h-min p-4">
                            {/* Card: Draw */}
                            <button onClick={() => setActiveTab('draw')} className="group bg-[#161616] border border-[#333] hover:border-[#00ff80] p-6 py-10 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all hover:bg-[#1a1a1a] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,255,128,0.1)]">
                                <Users size={48} className="text-gray-400 group-hover:text-[#00ff80] transition-colors" />
                                <span className="text-xl font-black text-white group-hover:text-[#00ff80] transition-colors tracking-wide">시청자 추첨</span>
                            </button>

                            {/* Card: Numeric Vote */}
                            <button onClick={() => setActiveTab('vote')} className="group bg-[#161616] border border-[#333] hover:border-[#00ff80] p-6 py-10 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all hover:bg-[#1a1a1a] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,255,128,0.1)]">
                                <BarChart2 size={48} className="text-gray-400 group-hover:text-[#00ff80] transition-colors" />
                                <span className="text-xl font-black text-white group-hover:text-[#00ff80] transition-colors tracking-wide">숫자 투표</span>
                            </button>

                            {/* Card: Donation Vote */}
                            <button onClick={() => setActiveTab('donate')} className="group bg-[#161616] border border-[#333] hover:border-[#00ff80] p-6 py-10 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all hover:bg-[#1a1a1a] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,255,128,0.1)]">
                                <Coins size={48} className="text-gray-400 group-hover:text-[#00ff80] transition-colors" />
                                <span className="text-xl font-black text-white group-hover:text-[#00ff80] transition-colors tracking-wide">도네 투표</span>
                            </button>

                            {/* Card: Roulette */}
                            <button onClick={() => setActiveTab('roulette')} className="group bg-[#161616] border border-[#333] hover:border-[#00ff80] p-6 py-10 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all hover:bg-[#1a1a1a] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,255,128,0.1)]">
                                <Disc size={48} className="text-gray-400 group-hover:text-[#00ff80] transition-colors" />
                                <span className="text-xl font-black text-white group-hover:text-[#00ff80] transition-colors tracking-wide">룰렛</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. FEATURE VIEWS */}
                {/* Full Width Wrapper for Logic Views */}
                {activeTab !== 'menu' && (
                    <section className="w-full h-full flex flex-col bg-transparent relative animate-slideUp">

                        {activeTab === 'draw' ? (
                            <div className="flex flex-col md:flex-row h-full">
                                {/* DRAW CONTROLS (Moved from Sidebar to Inline Panel) */}
                                <div className="w-full md:w-[350px] bg-black/20 border-r border-[#333] flex flex-col p-4 shrink-0 overflow-hidden">
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                                        <SlidersHorizontal size={18} className="text-[#00ff80]" /> 추첨 설정
                                    </h2>
                                    <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto custom-scroll pr-2">
                                        {/* Toggles */}
                                        <div className="bg-[#262626] rounded-xl p-4 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className={`text-sm font-bold ${store.drawSubsOnly ? 'text-white' : 'text-gray-300'}`}>구독자 전용</span>
                                                <Toggle checked={store.drawSubsOnly} onChange={() => store.send({ type: 'updateDraw', subsOnly: !store.drawSubsOnly })} />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-sm font-bold ${store.excludeWinners ? 'text-white' : 'text-gray-300'}`}>중복 당첨 제외</span>
                                                <Toggle checked={store.excludeWinners} onChange={() => store.send({ type: 'updateDraw', excludeWinners: !store.excludeWinners })} />
                                            </div>
                                        </div>

                                        {/* Command */}
                                        <div className="bg-[#262626] rounded-xl p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-300">명령어</span>
                                                <Toggle checked={store.useDrawCommand} onChange={() => store.send({ type: 'updateDraw', useCommand: !store.useDrawCommand })} />
                                            </div>
                                            {store.useDrawCommand && (
                                                <input
                                                    value={localDrawKeyword}
                                                    onChange={(e) => setLocalDrawKeyword(e.target.value)}
                                                    onBlur={() => store.send({ type: 'updateDraw', keyword: localDrawKeyword })}
                                                    className="w-full bg-[#111] text-white p-2 rounded-lg border border-[#333] text-sm focus:border-[#00ff80] outline-none"
                                                    placeholder="예: !참여"
                                                />
                                            )}
                                        </div>

                                        {/* Timer */}
                                        <div className="bg-[#262626] rounded-xl p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-300">타이머</span>
                                                <Toggle checked={store.useDrawTimer} onChange={() => store.send({ type: 'updateDraw', useTimer: !store.useDrawTimer })} />
                                            </div>
                                            {store.useDrawTimer && (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={store.drawTimerDuration}
                                                        onChange={(e) => store.startDrawRecruit({ ...store, duration: Number(e.target.value) } as any)}
                                                        className="flex-1 bg-[#111] text-center text-[#00ff80] font-bold py-1 rounded outline-none border border-[#333] focus:border-[#00ff80]"
                                                    />
                                                    <span className="text-xs text-gray-400">초</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-auto pt-4 space-y-2">
                                            <button onClick={store.undoLastWinner} className="w-full py-3 rounded-xl font-bold text-orange-400 bg-[#222] hover:bg-orange-500/10 border border-[#444] flex items-center justify-center gap-2"><RotateCcw size={16} /> 당첨 취소</button>
                                            <button onClick={store.resetDraw} className="w-full py-3 rounded-xl font-bold text-red-400 bg-[#222] hover:bg-red-500/10 border border-[#444] flex items-center justify-center gap-2"><Trash2 size={16} /> 명단 초기화</button>
                                        </div>
                                    </div>
                                </div>
                                {/* Draw Display */}
                                <div className="flex-1 min-h-0 relative bg-transparent flex flex-col">
                                    <div className="absolute top-4 right-4 z-20">
                                        <span className="text-5xl font-mono font-black text-white">{activeTimerString()}</span>
                                    </div>
                                    <div className="p-6 h-full">
                                        <DrawDisplay mode="dashboard" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Wrapper for Full-Screen Components (Vote, Donate, Roulette, Settings)
                            <div className="w-full h-full relative flex flex-col">
                                {/* Timer Header for Vote/Roulette */}
                                {['vote', 'donate', 'roulette'].includes(activeTab) && (
                                    <div className="absolute top-0 right-0 p-8 z-30 pointer-events-none">
                                        <span className="text-5xl font-mono font-black text-white drop-shadow-md">{activeTimerString()}</span>
                                    </div>
                                )}

                                {['vote', 'donate'].includes(activeTab) && <VoteDisplay mode="dashboard" activeTab={activeTab as 'vote' | 'donate'} />}
                                {activeTab === 'roulette' && <RouletteDisplay mode="dashboard" />}
                                {activeTab === 'settings' && (
                                    <div className="flex-1 flex flex-col md:flex-row h-full">
                                        <div className="w-full md:w-60 border-r border-[#333] bg-[#222] flex flex-col p-2">
                                            <button onClick={() => setSettingCategory('tts')} className={`w-full text-left px-4 py-3 font-bold rounded-lg mb-1 ${settingCategory === 'tts' ? 'bg-[#00ff80] text-black' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`}>TTS 설정</button>
                                            <button onClick={() => setSettingCategory('overlay')} className={`w-full text-left px-4 py-3 font-bold rounded-lg mb-1 ${settingCategory === 'overlay' ? 'bg-[#00ff80] text-black' : 'text-gray-400 hover:text-white hover:bg-[#333]'}`}>OBS 설정</button>
                                        </div>
                                        <div className="flex-1 bg-transparent relative h-full">
                                            {settingCategory === 'tts' && <TTSSettings />}
                                            {settingCategory === 'overlay' && (
                                                <div className="p-8">
                                                    <h2 className="text-3xl font-black text-white mb-6">OBS <span className="text-[#00ff80]">OVERLAY</span></h2>
                                                    <div className="bg-[#262626] p-6 rounded-2xl border border-[#333] mb-6">
                                                        <div className="text-sm text-gray-400 font-bold mb-3">오버레이 URL</div>
                                                        <div className="flex gap-3">
                                                            <input readOnly value={currentOverlayUrl} className="flex-1 bg-[#111] text-gray-300 p-3 rounded-xl text-sm font-mono border border-[#333] select-all" />
                                                            <button onClick={() => { navigator.clipboard.writeText(currentOverlayUrl); alert('URL 복사됨'); }} className="bg-[#333] hover:bg-[#444] text-white px-5 rounded-xl font-bold transition-all border border-[#444] hover:border-[#00ff80]">복사</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div >
    );
}
