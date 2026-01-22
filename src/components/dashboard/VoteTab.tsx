'use client';

import React, { useState, useEffect } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import VoteDisplay from '@/components/dashboard/vote/VoteDisplay';
import DrawDisplay from '@/components/dashboard/vote/DrawDisplay';
import RouletteDisplay from '@/components/dashboard/vote/RouletteDisplay';
import {
    Users, BarChart2, Coins, Disc, Settings, Zap,
    Clock, Trash2, Shuffle, Save, RotateCcw, Link, Copy, Eye, EyeOff, Crown,
    SlidersHorizontal, Check, Play, Square, X, Plus
} from 'lucide-react';
import Toggle from '@/components/ui/Toggle';

export default function VoteTab() {
    const store = useVoteStore();
    const [activeTab, setActiveTab] = useState<'vote' | 'draw' | 'donate' | 'roulette' | 'settings'>('draw');

    // Local State
    const [localVoteItems, setLocalVoteItems] = useState<string[]>([]);
    const [newVoteItem, setNewVoteItem] = useState('');
    const [localRouletteItems, setLocalRouletteItems] = useState<{ name: string; weight: number }[]>([]);

    const [localDrawKeyword, setLocalDrawKeyword] = useState('!참여');
    const [localVoteTitle, setLocalVoteTitle] = useState('');
    const [channelInput, setChannelInput] = useState('');

    // Sync Store -> Local
    useEffect(() => {
        if (store.drawKeyword) setLocalDrawKeyword(store.drawKeyword);
    }, [store.drawKeyword]);

    useEffect(() => {
        if (store.voteTitle) setLocalVoteTitle(store.voteTitle);
    }, [store.voteTitle]);

    // Vote Detail Modal
    const [showVoteDetailModal, setShowVoteDetailModal] = useState(false);
    const [selectedVoteItem, setSelectedVoteItem] = useState<any>(null);
    const [showRealNames, setShowRealNames] = useState(false);

    // Settings State
    const [settingCategory, setSettingCategory] = useState<'tts' | 'overlay'>('tts');

    // Mocks for Settings (Logic moved to store or simplified)
    const [localSettings, setLocalSettings] = useState({
        ttsVolume: 1.0,
        ttsRate: 1.0,
        ttsVoice: '',
        useTTS: true,
        overlayUrl: typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/overlay/${store.channelId || 'demo'}` : ''
    });

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
                            volume: localSettings.ttsVolume,
                            rate: localSettings.ttsRate,
                            voice: ko.name,
                            enabled: localSettings.useTTS
                        });
                    }
                }
                setLocalSettings(prev => ({
                    ...prev,
                    ttsVoice: store.ttsVoice || (v.find(voice => voice.lang.includes('ko'))?.name || v[0].name)
                }));
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);


    // Sync Roulette Items (if empty, fill from store)
    useEffect(() => {
        if (store.rouletteItems.length > 0 && localRouletteItems.length === 0) {
            setLocalRouletteItems(store.rouletteItems);
        }
    }, [store.rouletteItems, localRouletteItems.length]);


    // Helper Actions
    const addVoteItem = () => {
        if (newVoteItem.trim()) {
            setLocalVoteItems([...localVoteItems, newVoteItem.trim()]);
            setNewVoteItem('');
        }
    };
    const removeVoteItem = (idx: number) => {
        setLocalVoteItems(localVoteItems.filter((_, i) => i !== idx));
    };

    const checkConflictAndStart = (actionName: string, startFunction: () => void) => {
        let activeTasks = [];
        if (store.drawStatus === 'recruiting') activeTasks.push('추첨 모집');
        if (store.voteStatus === 'active') activeTasks.push('투표');
        if (store.isSpinning) activeTasks.push('룰렛');

        if (activeTasks.length > 0) {
            if (confirm(`현재 [${activeTasks.join(', ')}] 기능이 진행 중입니다.\n기존 작업을 중단하고 [${actionName}]을(를) 시작하시겠습니까?`)) {
                // Stop existing
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
        <div className="h-screen w-full flex flex-col p-4 md:p-6 max-w-screen-2xl mx-auto relative text-white bg-neutral-900 overflow-hidden">

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

            {/* Header */}
            <header className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00ff80] rounded-lg flex items-center justify-center text-black shadow-[0_0_15px_rgba(0,255,128,0.4)]">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">CHZZK <span className="text-[#00ff80]">BOT</span></h1>
                        <p className="text-xs text-gray-500 font-medium">Dashboard Controller</p>
                    </div>
                </div>
                <nav className="flex bg-[#1a1a1a] p-1 rounded-xl border border-[#333]">
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
                            className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#00ff80] text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}
                        >
                            {tab.icon}
                            <span className="hidden md:inline">{tab.name}</span>
                        </button>
                    ))}
                </nav>
            </header>

            <main className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 relative z-0">
                {/* LEFT PANEL: CONTROLS */}
                <section className="w-full md:w-[380px] flex flex-col shrink-0 h-full max-h-full">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 flex-1 flex flex-col shadow-2xl relative overflow-hidden">
                        <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-white relative z-10 shrink-0">
                            <SlidersHorizontal size={18} className="text-[#00ff80]" /> 설정 및 제어
                        </h2>

                        {/* DRAW CONTROL */}
                        {activeTab === 'draw' && (
                            <div className="flex flex-col gap-4 h-full relative z-10 overflow-hidden">
                                <div className="space-y-3 overflow-y-auto custom-scroll pr-1 pb-2">
                                    {/* Toggles */}
                                    <div className="flex justify-between items-center p-3 bg-[#262626] rounded-xl hover:bg-[#2f2f2f] border border-transparent transition shadow-sm">
                                        <span className={`text-sm font-bold ${store.drawSubsOnly ? 'text-white' : 'text-gray-300'}`}>구독자 전용 추첨</span>
                                        <Toggle checked={store.drawSubsOnly} onChange={() => store.send({ type: 'updateDraw', subsOnly: !store.drawSubsOnly })} />
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-[#262626] rounded-xl hover:bg-[#2f2f2f] border border-transparent transition shadow-sm">
                                        <span className={`text-sm font-bold ${store.excludeWinners ? 'text-white' : 'text-gray-300'}`}>이미 뽑힌 사람 제외</span>
                                        <Toggle checked={store.excludeWinners} onChange={() => store.send({ type: 'updateDraw', excludeWinners: !store.excludeWinners })} />
                                    </div>

                                    {/* Command Toggle + Input */}
                                    <div className="bg-[#262626] rounded-xl overflow-hidden border border-transparent hover:border-[#444] transition shadow-sm">
                                        <div className="flex justify-between items-center p-3">
                                            <span className={`text-sm font-bold ${store.useDrawCommand ? 'text-white' : 'text-gray-300'}`}>명령어 추첨 켜기</span>
                                            <Toggle checked={store.useDrawCommand} onChange={() => store.send({ type: 'updateDraw', useCommand: !store.useDrawCommand })} />
                                        </div>
                                        {store.useDrawCommand && (
                                            <div className="px-3 pb-3 animate-fadeIn">
                                                <input
                                                    value={localDrawKeyword}
                                                    onChange={(e) => setLocalDrawKeyword(e.target.value)}
                                                    onBlur={() => store.send({ type: 'updateDraw', keyword: localDrawKeyword })}
                                                    className="w-full bg-[#111] text-white p-2 rounded-lg border border-[#333] text-sm outline-none focus:border-[#00ff80] transition-colors"
                                                    placeholder="예: !참여"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Timer Toggle + Input */}
                                    <div className="bg-[#262626] rounded-xl overflow-hidden border border-transparent hover:border-[#444] transition shadow-sm">
                                        <div className="flex justify-between items-center p-3">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className={store.useDrawTimer ? 'text-[#00ff80]' : 'text-gray-500'} />
                                                <span className={`text-sm font-bold ${store.useDrawTimer ? 'text-white' : 'text-gray-400'}`}>타이머 사용</span>
                                            </div>
                                            <Toggle checked={store.useDrawTimer} onChange={() => store.startDrawRecruit({ ...store, duration: store.drawTimerDuration } as any)} />
                                        </div>
                                        {store.useDrawTimer && (
                                            <div className="px-3 pb-3 flex items-center gap-2 animate-fadeIn">
                                                <input
                                                    type="number"
                                                    value={store.drawTimerDuration}
                                                    onChange={(e) => store.startDrawRecruit({ ...store, duration: Number(e.target.value) } as any)}
                                                    className="flex-1 bg-[#111] text-center text-[#00ff80] font-bold py-1 rounded outline-none border border-[#333] focus:border-[#00ff80] transition-colors"
                                                />
                                                <span className="text-gray-400 text-sm">초</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto pt-2 flex flex-col gap-2 relative z-10 shrink-0">
                                    <button onClick={store.undoLastWinner} className="w-full py-3 rounded-xl font-bold text-orange-400 bg-[#222] hover:bg-orange-500/10 hover:text-orange-500 border border-[#444] transition-all flex items-center justify-center gap-2"><RotateCcw size={16} /> 당첨 취소</button>
                                    <button onClick={store.resetDraw} className="w-full py-3 rounded-xl font-bold text-red-400 bg-[#222] hover:bg-red-500/10 hover:text-red-500 border border-[#444] transition-all"><Trash2 size={16} className="inline mr-2" /> 명단 초기화</button>
                                    <button onClick={() => {
                                        if (store.drawStatus === 'recruiting') store.stopDraw();
                                        else checkConflictAndStart('추첨 모집', () => store.startDrawRecruit({ keyword: localDrawKeyword, subsOnly: store.drawSubsOnly, duration: store.drawTimerDuration }));
                                    }} className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${store.drawStatus === 'recruiting' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#00ff80] text-black hover:bg-[#00cc66]'}`}>
                                        {store.drawStatus === 'recruiting' ? <Square fill="currentColor" size={16} /> : <Play fill="currentColor" size={16} />}
                                        {store.drawStatus === 'recruiting' ? '모집 종료' : '참여자 모집 시작'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* VOTE & DONATE CONTROL */}
                        {['vote', 'donate'].includes(activeTab) && (
                            <div className="flex flex-col gap-3 h-full relative z-10 overflow-hidden">
                                {/* Vote Title */}
                                <div className="bg-[#262626] p-4 rounded-xl border border-[#333] space-y-2 shadow-sm shrink-0">
                                    <div className="text-xs text-gray-400 font-bold">투표 주제</div>
                                    <input
                                        value={localVoteTitle}
                                        onChange={(e) => setLocalVoteTitle(e.target.value)}
                                        onBlur={() => store.send({ type: 'updateVoteSettings', title: localVoteTitle })}
                                        placeholder="투표 주제를 입력하세요..."
                                        className="w-full bg-transparent text-white font-bold text-lg outline-none border-b border-[#444] focus:border-[#00ff80] transition-colors placeholder-gray-600"
                                    />
                                </div>

                                {/* Items List */}
                                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scroll min-h-0 bg-[#161616] p-2 rounded-xl border border-[#222]">
                                    {store.voteStatus === 'idle' ? (
                                        <>
                                            {localVoteItems.map((item, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <div className="w-6 h-6 rounded-full bg-[#333] flex items-center justify-center text-xs text-gray-500 font-mono">{idx + 1}</div>
                                                    <input value={item} readOnly className="flex-1 bg-[#262626] text-white px-3 py-3 rounded-lg outline-none text-sm border border-transparent focus:border-[#00ff80] transition-all" />
                                                    <button onClick={() => removeVoteItem(idx)} className="w-8 h-8 text-gray-600 hover:text-red-500 transition-colors"><X size={16} /></button>
                                                </div>
                                            ))}
                                            <div className="flex gap-2 mt-2">
                                                <input value={newVoteItem} onChange={(e) => setNewVoteItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addVoteItem()} placeholder="새 항목 추가 (Enter)" className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[#00ff80] outline-none" />
                                                <button onClick={addVoteItem} className="w-10 bg-[#333] text-white rounded-lg font-bold hover:bg-[#444] flex items-center justify-center"><Plus size={16} /></button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                            <p className="text-sm">투표가 진행 중입니다.</p>
                                            <p className="text-xs opacity-50">오른쪽 패널에서 현황을 확인하세요.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Settings & Start */}
                                <div className="mt-auto pt-2 space-y-2 relative z-10 shrink-0">
                                    <div className="bg-[#262626] rounded-xl overflow-hidden border border-transparent hover:border-[#444] transition shadow-sm">
                                        <div className="flex justify-between items-center p-3">
                                            <span className={`text-sm font-bold ${store.isAutoSort ? 'text-white' : 'text-gray-400'}`}>내림차순 정렬</span>
                                            <Toggle checked={store.isAutoSort} onChange={() => store.send({ type: 'updateVoteSettings', autoSort: !store.isAutoSort })} />
                                        </div>
                                    </div>
                                    <div className="bg-[#262626] rounded-xl overflow-hidden border border-transparent hover:border-[#444] transition shadow-sm">
                                        <div className="flex justify-between items-center p-3">
                                            <span className={`text-sm font-bold ${store.includeZeroVotes ? 'text-white' : 'text-gray-400'}`}>0표(0%) 항목 포함</span>
                                            <Toggle checked={store.includeZeroVotes} onChange={() => store.send({ type: 'updateVoteSettings', includeZeroVotes: !store.includeZeroVotes })} />
                                        </div>
                                    </div>

                                    {/* DONATE SETTINGS */}
                                    {activeTab === 'donate' && (
                                        <div className="bg-[#262626] rounded-xl overflow-hidden border border-transparent hover:border-[#444] transition shadow-sm">
                                            <div className="flex justify-between items-center p-3">
                                                <span className={`text-sm font-bold ${store.allowMultiVote ? 'text-white' : 'text-gray-400'}`}>복수 투표 허용</span>
                                                <Toggle checked={store.allowMultiVote} onChange={() => store.send({ type: 'updateVoteSettings', allowMulti: !store.allowMultiVote })} />
                                            </div>
                                            <div className="px-3 pb-3 flex items-center gap-2 animate-fadeIn border-t border-[#333] pt-3">
                                                <span className="text-gray-400 text-xs font-bold w-16">투표 단위</span>
                                                <input
                                                    type="number"
                                                    value={store.voteUnit}
                                                    onChange={(e) => store.send({ type: 'updateVoteSettings', unit: Number(e.target.value) })}
                                                    className="flex-1 bg-[#111] text-right text-white font-bold py-1 px-2 rounded outline-none border border-[#333] focus:border-[#00ff80] transition-colors"
                                                />
                                                <span className="text-white text-sm font-bold">원</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-[#262626] rounded-xl overflow-hidden border border-transparent hover:border-[#444] transition shadow-sm">
                                        <div className="flex justify-between items-center p-3">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className={store.useVoteTimer ? 'text-[#00ff80]' : 'text-gray-500'} />
                                                <span className={`text-sm font-bold ${store.useVoteTimer ? 'text-white' : 'text-gray-400'}`}>타이머 사용</span>
                                            </div>
                                            <Toggle checked={store.useVoteTimer} onChange={() => store.startVote({ ...store, duration: store.voteTimerDuration } as any)} />
                                        </div>
                                        {store.useVoteTimer && (
                                            <div className="px-3 pb-3 flex items-center gap-2 animate-fadeIn">
                                                <input
                                                    type="number"
                                                    value={store.voteTimerDuration}
                                                    onChange={(e) => store.startVote({ ...store, duration: Number(e.target.value) } as any)}
                                                    className="flex-1 bg-[#111] text-center text-[#00ff80] font-bold py-1 rounded outline-none border border-[#333] focus:border-[#00ff80] transition-colors"
                                                />
                                                <span className="text-gray-400 text-sm">초</span>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => checkConflictAndStart('룰렛 연동', store.transferVotesToRoulette)} className="w-full py-3 rounded-xl font-bold bg-[#333] text-gray-300 hover:bg-[#444] hover:text-white transition-all border border-[#444]">
                                        <Shuffle size={16} className="inline mr-2" /> 투표 결과로 룰렛 만들기
                                    </button>
                                    <button onClick={() => {
                                        if (store.voteStatus === 'active') store.endVote();
                                        else checkConflictAndStart('투표', () => {
                                            if (localVoteItems.length < 2) return alert('최소 2개의 항목이 필요합니다.');
                                            store.startVote({
                                                title: localVoteTitle || '투표',
                                                mode: activeTab === 'vote' ? 'numeric' : 'donation',
                                                items: localVoteItems,
                                                duration: store.voteTimerDuration,
                                                allowMulti: store.allowMultiVote,
                                                unit: store.voteUnit
                                            });
                                        });
                                    }} className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${store.voteStatus === 'active' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#00ff80] text-black hover:bg-[#00cc66]'}`}>
                                        {store.voteStatus === 'active' ? <Square fill="currentColor" size={16} /> : <Play fill="currentColor" size={16} />}
                                        {store.voteStatus === 'active' ? '투표 종료' : '투표 시작'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ROULETTE & SETTINGS */}
                        {activeTab === 'roulette' && (
                            <div className="flex flex-col gap-3 h-full relative z-10 overflow-hidden">
                                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scroll min-h-0">
                                    {localRouletteItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-center group">
                                            <div className="w-1 h-8 rounded-full" style={{ background: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1'][idx % 6] }}></div>
                                            <input value={item.name} onChange={(e) => { const n = [...localRouletteItems]; n[idx].name = e.target.value; setLocalRouletteItems(n); }} className="flex-1 bg-[#262626] text-white px-3 py-2 rounded-lg outline-none text-sm focus:ring-1 focus:ring-[#00ff80] transition-all" />
                                            <input type="number" value={item.weight} onChange={(e) => { const n = [...localRouletteItems]; n[idx].weight = Number(e.target.value); setLocalRouletteItems(n); }} className="w-12 bg-[#262626] text-white px-2 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#00ff80] text-center" />
                                            <button onClick={() => setLocalRouletteItems(localRouletteItems.filter((_, i) => i !== idx))} className="w-6 h-6 text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => setLocalRouletteItems([...localRouletteItems, { name: '', weight: 10 }])} className="w-full py-2 border border-dashed border-[#444] text-gray-500 text-xs hover:border-[#00ff80] hover:text-[#00ff80] transition-all">+ 항목 추가</button>
                                </div>
                                <div className="mt-4 pt-4 border-t border-[#333] flex flex-col gap-2 relative z-10 shrink-0">
                                    <button onClick={() => store.updateRouletteItems(localRouletteItems)} className="w-full py-3 rounded-xl font-bold bg-[#333] hover:bg-[#444] transition-all">룰렛 업데이트</button>
                                    <button onClick={store.resetRoulette} className="w-full py-3 rounded-xl font-bold text-red-400 bg-[#222] hover:bg-red-500/10 hover:text-red-500 border border-[#444] transition-all"><Trash2 size={16} className="inline mr-2" /> 룰렛 초기화</button>
                                    <button onClick={() => {
                                        checkConflictAndStart('룰렛 돌리기', store.spinRoulette);
                                    }} disabled={!store.rouletteItems.length || store.isSpinning} className="w-full py-4 rounded-xl font-black bg-white text-black text-lg shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                                        돌려! (SPIN)
                                    </button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'settings' && (
                            <div className="flex flex-col gap-2 h-full relative z-10">
                                <div className="flex gap-2">
                                    <button onClick={() => setSettingCategory('tts')} className={`flex-1 text-center px-4 py-3 font-bold rounded-xl border transition-all shadow-sm ${settingCategory === 'tts' ? 'bg-[#262626] text-[#00ff80] border-[#00ff80]' : 'text-gray-400 border-transparent hover:bg-[#222]'}`}>TTS 설정</button>
                                    <button onClick={() => setSettingCategory('overlay')} className={`flex-1 text-center px-4 py-3 font-bold rounded-xl border transition-all shadow-sm ${settingCategory === 'overlay' ? 'bg-[#262626] text-[#00ff80] border-[#00ff80]' : 'text-gray-400 border-transparent hover:bg-[#222]'}`}>OBS 오버레이</button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scroll space-y-4 pr-1 mt-2">
                                    {settingCategory === 'tts' && (
                                        <div className="bg-[#262626] p-4 rounded-xl border border-[#333]">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="font-bold text-white">TTS 사용</span>
                                                <Toggle checked={store.useTTS} onChange={() => store.updateTTSSettings({ volume: store.ttsVolume, rate: store.ttsRate, voice: store.ttsVoice, enabled: !store.useTTS })} />
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex justify-between mb-1 text-xs text-gray-400"><span>볼륨</span><span>{Math.round(store.ttsVolume * 100)}%</span></div>
                                                    <input type="range" min="0" max="1" step="0.1" value={store.ttsVolume} onChange={(e) => store.updateTTSSettings({ ...store, enabled: store.useTTS, volume: Number(e.target.value) } as any)} className="w-full h-2 bg-[#111] rounded-lg appearance-none cursor-pointer accent-[#00ff80]" />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between mb-1 text-xs text-gray-400"><span>속도</span><span>x{store.ttsRate}</span></div>
                                                    <input type="range" min="0.5" max="2" step="0.1" value={store.ttsRate} onChange={(e) => store.updateTTSSettings({ ...store, enabled: store.useTTS, rate: Number(e.target.value) } as any)} className="w-full h-2 bg-[#111] rounded-lg appearance-none cursor-pointer accent-[#00ff80]" />
                                                </div>
                                                <div>
                                                    <div className="mb-1 text-xs text-gray-400">보이스</div>
                                                    <select value={store.ttsVoice} onChange={(e) => store.updateTTSSettings({ ...store, enabled: store.useTTS, voice: e.target.value } as any)} className="w-full bg-[#111] text-white p-2 rounded-lg border border-[#333] text-sm outline-none focus:border-[#00ff80]">
                                                        {voices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {settingCategory === 'overlay' && (
                                        <div className="bg-[#262626] p-4 rounded-xl border border-[#333] space-y-4">
                                            <div>
                                                <div className="text-xs text-gray-400 font-bold mb-2">오버레이 URL (OBS용)</div>
                                                <div className="flex gap-2">
                                                    <input readOnly value={currentOverlayUrl} className="flex-1 bg-[#111] text-gray-300 p-2 rounded-lg text-xs font-mono border border-[#333]" />
                                                    <button onClick={() => { navigator.clipboard.writeText(currentOverlayUrl); alert('URL 복사됨'); }} className="bg-[#333] hover:bg-[#444] text-white px-3 rounded-lg"><Copy size={16} /></button>
                                                </div>
                                                <p className="text-[10px] text-gray-500 mt-2">* 이 주소를 OBS 브라우저 소스에 추가하세요.</p>
                                            </div>
                                            {/* Visibility Toggles */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center bg-[#222] p-2 rounded-lg">
                                                    <span className="text-xs text-gray-300">추첨 오버레이 켜기</span>
                                                    <Toggle checked={store.showDrawOverlay} onChange={() => store.send({ type: 'updateOverlay', showDrawOverlay: !store.showDrawOverlay })} />
                                                </div>
                                                <div className="flex justify-between items-center bg-[#222] p-2 rounded-lg">
                                                    <span className="text-xs text-gray-300">투표 오버레이 켜기</span>
                                                    <Toggle checked={store.showVoteOverlay} onChange={() => store.send({ type: 'updateOverlay', showVoteOverlay: !store.showVoteOverlay })} />
                                                </div>
                                                <div className="flex justify-between items-center bg-[#222] p-2 rounded-lg">
                                                    <span className="text-xs text-gray-300">룰렛 오버레이 켜기</span>
                                                    <Toggle checked={store.showRouletteOverlay} onChange={() => store.send({ type: 'updateOverlay', showRouletteOverlay: !store.showRouletteOverlay })} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* RIGHT PANEL: DISPLAY */}
                <section className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-2xl relative overflow-hidden flex flex-col shadow-2xl h-full max-h-full">
                    {/* Header: Timer */}
                    <div className="relative z-20 flex justify-between items-center p-8 pb-4 shrink-0">
                        {['vote', 'donate'].includes(activeTab) && (
                            <div className="flex flex-col">
                                <span className="text-3xl font-black text-white">총 {store.voteItems.reduce((a, b) => a + b.count, 0)}표</span>
                                <span className={`text-xs font-bold tracking-wider mt-1 ${store.voteStatus === 'active' ? 'text-red-500' : 'text-gray-500'}`}>
                                    {store.voteStatus === 'active' ? '● LIVE' : '○ STANDBY'}
                                </span>
                            </div>
                        )}
                        {/* 
                         <div className="text-5xl font-mono font-black text-white tracking-widest leading-none ml-auto">
                            {activeTimerString()}
                        </div>
                        */}
                        <div className="text-5xl font-mono font-black text-white tracking-widest leading-none ml-auto">
                            {activeTimerString()}
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-hidden p-6 pt-0">
                            {activeTab === 'draw' && <DrawDisplay mode="dashboard" />}
                            {['vote', 'donate'].includes(activeTab) && <VoteDisplay mode="dashboard" />}
                            {activeTab === 'roulette' && <RouletteDisplay mode="dashboard" />}
                            {activeTab === 'settings' && (
                                <div className="h-full flex flex-col justify-center items-center text-gray-500">
                                    <Settings size={64} className="mb-4 text-gray-700" />
                                    <p className="text-lg font-bold">오버레이 설정 가이드</p>
                                    <ul className="text-sm mt-4 space-y-2 text-gray-400 list-disc list-inside">
                                        <li>OBS 브라우저 소스를 추가하고 왼쪽 URL을 붙여넣으세요.</li>
                                        <li>너비: 1920, 높이: 1080으로 설정하세요.</li>
                                        <li>필요한 오버레이(투표, 추첨 등)를 켜면 화면에 나타납니다.</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* VOTE DETAIL MODAL */}
            {showVoteDetailModal && selectedVoteItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowVoteDetailModal(false)}>
                    <div className="bg-[#1a1a1a] rounded-2xl border border-[#333] shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden relative animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#333] flex justify-between items-center bg-[#222]">
                            <div><span className="text-[#00ff80] font-bold text-sm tracking-widest mb-1 block">VOTE DETAIL</span><h2 className="text-2xl font-black text-white">{selectedVoteItem.name}</h2></div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setShowRealNames(!showRealNames)} className="flex items-center gap-2 cursor-pointer bg-[#333] px-3 py-1.5 rounded-lg hover:bg-[#444] transition select-none text-xs font-bold text-gray-300">
                                    {showRealNames ? <Eye size={14} className="text-[#00ff80]" /> : <EyeOff size={14} />} 닉네임 보기
                                </button>
                                <button onClick={() => setShowVoteDetailModal(false)} className="w-10 h-10 rounded-full bg-[#333] hover:bg-[#444] text-gray-400 hover:text-white transition flex items-center justify-center"><X size={18} /></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scroll bg-[#111]">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {selectedVoteItem.voters.map((voter: any, idx: number) => (
                                    <div key={idx} className="bg-[#222] p-3 rounded-lg border border-[#333] flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${voter.role === '구독자' ? 'bg-[#00ff80] text-black' : 'bg-[#333] text-gray-400 border border-[#444]'}`}>{voter.role === '구독자' ? '구' : '팬'}</div>
                                        <div className="truncate text-sm font-bold text-gray-300">{showRealNames ? voter.name : voter.name.substring(0, 2) + '***'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#333] bg-[#222]">
                            <button onClick={() => { store.pickVoteWinner(selectedVoteItem.id); setShowVoteDetailModal(false); }} disabled={store.voteStatus === 'active'} className="w-full py-4 rounded-xl font-black text-black bg-[#00ff80] hover:bg-[#00cc66] shadow-[0_0_20px_rgba(0,255,128,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xl">
                                <Crown size={20} /> 이 항목에서 추첨하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
