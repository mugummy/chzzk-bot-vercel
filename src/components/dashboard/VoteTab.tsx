'use client';

import React, { useState, useEffect } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import VoteDisplay from '@/components/dashboard/vote/VoteDisplay';
import DrawDisplay from '@/components/dashboard/vote/DrawDisplay';
import RouletteDisplay from '@/components/dashboard/vote/RouletteDisplay';
import {
    Users, BarChart2, Coins, Disc, Settings, Sliders, Zap,
    Clock, Trash2, Shuffle, Save, RotateCcw, Link, Copy, Eye, EyeOff, Crown
} from 'lucide-react';
import Toggle from '@/components/ui/Toggle';

export default function VoteTab() {
    const store = useVoteStore();
    const [activeTab, setActiveTab] = useState<'vote' | 'draw' | 'donate' | 'roulette' | 'settings'>('draw');

    // Local State for Items Editor
    const [localVoteItems, setLocalVoteItems] = useState<string[]>([]);
    const [newVoteItem, setNewVoteItem] = useState('');

    const [localRouletteItems, setLocalRouletteItems] = useState<{ name: string; weight: number }[]>([]);
    const [newRouletteName, setNewRouletteName] = useState('');
    const [newRouletteWeight, setNewRouletteWeight] = useState(10);

    // Local State for Inputs
    const [localDrawKeyword, setLocalDrawKeyword] = useState('!참여');
    const [localVoteTitle, setLocalVoteTitle] = useState('');

    // Sync Store -> Local
    useEffect(() => { if (store.drawKeyword) setLocalDrawKeyword(store.drawKeyword); }, [store.drawKeyword]);
    useEffect(() => { if (store.voteTitle) setLocalVoteTitle(store.voteTitle); }, [store.voteTitle]);

    // Modal State
    const [showVoteDetailModal, setShowVoteDetailModal] = useState(false);
    const [selectedVoteItem, setSelectedVoteItem] = useState<any>(null);
    const [showRealNames, setShowRealNames] = useState(false);

    // Settings State (Local)
    const [settingCategory, setSettingCategory] = useState<'tts' | 'overlay'>('tts');
    const [localSettings, setLocalSettings] = useState({
        ttsVolume: 1.0, ttsRate: 1.0, ttsVoice: '', useTTS: true,
        overlayChroma: 'transparent', overlayTTS: false, overlayTimer: true,
        overlayOpacity: 0.9, overlayTheme: 'basic', overlayAccent: '#10b981', overlayScale: 1.0,
        overlayUrl: typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/overlay/${store.channelId || 'demo'}` : ''
    });

    // TTS Voices
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    useEffect(() => {
        const loadVoices = () => {
            const v = window.speechSynthesis.getVoices();
            if (v.length > 0) {
                setVoices(v);
                if (!store.ttsVoice) { // store voice not set
                    const ko = v.find(voice => voice.lang.includes('ko'));
                    if (ko) store.updateTTSSettings({
                        volume: localSettings.ttsVolume,
                        rate: localSettings.ttsRate,
                        voice: ko.name,
                        enabled: localSettings.useTTS
                    });
                }
                setLocalSettings(prev => ({ ...prev, ttsVoice: store.ttsVoice || (v.find(voice => voice.lang.includes('ko'))?.name || v[0].name) }));
            }
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // Sync Roulette Items
    useEffect(() => {
        if (store.rouletteItems.length > 0 && localRouletteItems.length === 0) {
            setLocalRouletteItems(store.rouletteItems);
        }
    }, [store.rouletteItems, localRouletteItems.length]);

    // Handlers
    const addVoteItem = () => {
        if (newVoteItem.trim()) {
            setLocalVoteItems([...localVoteItems, newVoteItem.trim()]);
            setNewVoteItem('');
        }
    };
    const removeVoteItem = (idx: number) => setLocalVoteItems(localVoteItems.filter((_, i) => i !== idx));

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

    // Tabs
    const tabs = [
        { id: 'draw', name: '시청자 추첨', icon: <Users size={16} /> },
        { id: 'vote', name: '숫자 투표', icon: <BarChart2 size={16} /> },
        { id: 'donate', name: '도네 투표', icon: <Coins size={16} /> },
        { id: 'roulette', name: '룰렛', icon: <Disc size={16} /> },
        { id: 'settings', name: '설정', icon: <Settings size={16} /> },
    ];

    const activeTimerString = () => {
        if (activeTab === 'draw' && store.drawStatus === 'recruiting' && store.useDrawTimer) return `${store.drawTimer}s`;
        if ((activeTab === 'vote' || activeTab === 'donate') && store.voteStatus === 'active' && store.useVoteTimer) {
            const m = Math.floor(store.voteTimer / 60).toString().padStart(2, '0');
            const s = (store.voteTimer % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        }
        return '';
    };

    return (
        <div className="h-screen w-full flex flex-col p-4 md:p-6 max-w-[1920px] mx-auto relative text-white bg-[#111]">
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
                    {tabs.map(tab => (
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
                {/* LEFT PANEL (CONTROLS) */}
                <section className="w-full md:w-[380px] flex flex-col shrink-0">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 flex-1 flex flex-col shadow-2xl relative overflow-hidden">
                        <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-white relative z-10">
                            <Sliders size={18} className="text-[#00ff80]" /> 설정 및 제어
                        </h2>

                        {/* DRAW CONTROL */}
                        {activeTab === 'draw' && (
                            <div className="flex flex-col gap-4 h-full relative z-10">
                                <div className="space-y-3">
                                    <div onClick={() => store.send({ type: 'updateDraw', subsOnly: !store.drawSubsOnly })} className="flex justify-between items-center p-3 bg-[#262626] rounded-xl cursor-pointer hover:bg-[#2f2f2f] border border-transparent transition shadow-sm">
                                        <span className={`text-sm font-bold ${store.drawSubsOnly ? 'text-white' : 'text-gray-300'}`}>구독자 전용 추첨</span>
                                        <Toggle checked={store.drawSubsOnly} onChange={() => { }} />
                                    </div>
                                    <div onClick={() => store.send({ type: 'updateDraw', excludeWinners: !store.excludeWinners })} className="flex justify-between items-center p-3 bg-[#262626] rounded-xl cursor-pointer hover:bg-[#2f2f2f] border border-transparent transition shadow-sm">
                                        <span className={`text-sm font-bold ${store.excludeWinners ? 'text-white' : 'text-gray-300'}`}>이미 뽑힌 사람 제외</span>
                                        <Toggle checked={store.excludeWinners} onChange={() => { }} />
                                    </div>
                                    <div className="bg-[#262626] rounded-xl overflow-hidden border border-transparent hover:border-[#444] transition shadow-sm p-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-gray-300">명령어 추첨 (!참여)</span>
                                        </div>
                                        <input
                                            value={localDrawKeyword}
                                            onChange={(e) => setLocalDrawKeyword(e.target.value)}
                                            onBlur={() => store.send({ type: 'updateDraw', keyword: localDrawKeyword })}
                                            className="w-full bg-[#111] text-white p-2 rounded-lg border border-[#333] text-sm outline-none focus:border-[#00ff80] transition-colors"
                                            placeholder="예: !참여"
                                        />
                                    </div>
                                    <div className="p-3 bg-[#262626] rounded-xl border border-transparent transition shadow-sm">
                                        <div className="flex justify-between items-center mb-2 cursor-pointer group" onClick={() => { /* Toggle Timer Use? store doesn't have direct toggle action for this yet, assuming always on or handled by duration > 0 in legacy */ }}>
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-[#00ff80]" />
                                                <span className="text-sm font-bold text-white">타이머 설정</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="number" placeholder="60" defaultValue={60} className="flex-1 bg-[#111] text-center text-[#00ff80] font-bold py-1 rounded outline-none border border-[#333] focus:border-[#00ff80] transition-colors" />
                                            <span className="text-gray-400 text-sm">초</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 flex flex-col gap-2 relative z-10">
                                    <button onClick={store.undoLastWinner} className="w-full py-3 rounded-xl font-bold text-orange-400 bg-[#222] hover:bg-orange-500/10 hover:text-orange-500 border border-[#444] transition-all flex items-center justify-center gap-2"><RotateCcw size={16} /> 당첨 취소</button>
                                    <button onClick={store.resetDraw} className="w-full py-3 rounded-xl font-bold text-red-400 bg-[#222] hover:bg-red-500/10 hover:text-red-500 border border-[#444] transition-all"><Trash2 size={16} className="inline mr-2" /> 명단 초기화</button>
                                    <button onClick={() => {
                                        if (store.drawStatus === 'recruiting') store.stopDraw();
                                        else checkConflictAndStart('추첨 모집', () => store.startDrawRecruit({ keyword: store.drawKeyword, subsOnly: store.drawSubsOnly, duration: 60 }));
                                    }} className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-lg active:scale-95 ${store.drawStatus === 'recruiting' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#00ff80] text-black hover:bg-[#00cc66]'}`}>
                                        {store.drawStatus === 'recruiting' ? '모집 종료' : '참여자 모집 시작'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* VOTE & DONATE CONTROL */}
                        {(activeTab === 'vote' || activeTab === 'donate') && (
                            <div className="flex flex-col gap-3 h-full relative z-10">
                                {activeTab === 'donate' && (
                                    <div className="bg-[#222] p-3 rounded-xl border border-[#333] flex items-start gap-3">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-[#333] flex items-center justify-center text-[#00ff80]"><Zap size={12} /></div>
                                        <div className="text-xs text-gray-400 leading-relaxed">
                                            <p className="font-bold text-white">투표 참여 방법</p>
                                            후원 메시지에 <span className="text-[#00ff80] font-bold">!투표 [번호]</span>를 입력해야 투표가 됩니다!
                                        </div>
                                    </div>
                                )}

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

                                {activeTab === 'donate' && (
                                    <div className="bg-[#262626] p-4 rounded-xl border border-[#333] space-y-3 shadow-sm">
                                        <div className="flex justify-between text-xs text-gray-400"><span>투표 1표당 금액</span><span className="text-[#00ff80]">{store.voteUnit}원</span></div>
                                        <input type="number" value={store.voteUnit} onChange={(e) => store.startVote({ ...store, unit: Number(e.target.value) } as any)} className="w-full bg-transparent text-white font-bold outline-none border-b border-[#444] focus:border-[#00ff80] transition-colors" />
                                        <div onClick={() => store.send({ type: 'updateVoteSettings', allowMulti: !store.allowMultiVote })} className="flex justify-between items-center cursor-pointer pt-2 border-t border-[#333]">
                                            <span className={`text-xs font-bold ${store.allowMultiVote ? 'text-white' : 'text-gray-400'}`}>복수투표 허용</span>
                                            <Toggle checked={store.allowMultiVote} onChange={() => { }} />
                                        </div>
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scroll">
                                    {store.voteStatus === 'idle' ? (
                                        <>
                                            {localVoteItems.map((item, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <div className="w-6 h-6 rounded-full bg-[#333] flex items-center justify-center text-xs text-gray-500 font-mono">{idx + 1}</div>
                                                    <input value={item} readOnly className="flex-1 bg-[#262626] text-white px-3 py-3 rounded-lg outline-none text-sm focus:ring-1 focus:ring-[#00ff80] transition-all" />
                                                    <button onClick={() => removeVoteItem(idx)} className="w-8 h-8 text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                            <div className="flex gap-2 mt-2">
                                                <input value={newVoteItem} onChange={(e) => setNewVoteItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addVoteItem()} placeholder="새 항목 추가" className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[#00ff80] outline-none" />
                                                <button onClick={addVoteItem} className="px-3 bg-[#333] text-white rounded-lg font-bold hover:bg-[#444]">+</button>
                                            </div>
                                        </>
                                    ) : (
                                        store.voteItems.map((item, idx) => (
                                            <div key={item.id} onClick={() => { setSelectedVoteItem(item); setShowVoteDetailModal(true); }} className="flex gap-2 items-center cursor-pointer hover:bg-[#222] p-1 rounded-lg transition-colors group">
                                                <div className="w-6 h-6 rounded-full bg-[#333] flex items-center justify-center text-xs text-gray-500 font-mono group-hover:bg-[#00ff80] group-hover:text-black transition-colors">{idx + 1}</div>
                                                <div className="flex-1 bg-[#262626]/50 text-white px-3 py-3 rounded-lg text-sm opacity-90 group-hover:opacity-100 border border-transparent group-hover:border-[#333]">
                                                    {item.name} <span className="float-right font-bold text-[#00ff80]">{item.count}표</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-[#333] space-y-2 relative z-10">
                                    <div className="p-3 bg-[#262626] rounded-xl cursor-pointer flex justify-between items-center shadow-sm hover:bg-[#2f2f2f] transition-colors" onClick={() => store.send({ type: 'updateVoteSettings', autoSort: !store.isAutoSort })}>
                                        <span className={`text-sm font-bold ${store.isAutoSort ? 'text-white' : 'text-gray-400'}`}>내림차순 정렬</span>
                                        <Toggle checked={store.isAutoSort} onChange={() => { }} />
                                    </div>
                                    <button onClick={() => checkConflictAndStart('룰렛 연동', store.transferVotesToRoulette)} className="w-full py-3 rounded-xl font-bold bg-[#333] text-gray-300 hover:bg-[#444] hover:text-white transition-all border border-[#444]">
                                        <Shuffle size={16} className="inline mr-2" /> 투표 결과로 룰렛 만들기
                                    </button>
                                    <button onClick={() => { store.resetVote(); setLocalVoteItems([]); }} className="w-full py-3 rounded-xl font-bold text-red-400 bg-[#222] hover:bg-red-500/10 hover:text-red-500 border border-[#444] transition-all">
                                        <Trash2 size={16} className="inline mr-2" /> 투표 초기화
                                    </button>
                                    <button onClick={() => {
                                        if (store.voteStatus === 'active') store.endVote();
                                        else checkConflictAndStart('투표', () => {
                                            if (localVoteItems.length < 2) return alert('최소 2개의 항목이 필요합니다.');
                                            store.startVote({
                                                title: store.voteTitle || '투표',
                                                mode: activeTab === 'vote' ? 'numeric' : 'donation',
                                                items: localVoteItems,
                                                duration: 60,
                                                allowMulti: store.allowMultiVote,
                                                unit: store.voteUnit
                                            });
                                        });
                                    }} className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-lg active:scale-95 ${store.voteStatus === 'active' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#00ff80] text-black hover:bg-[#00cc66]'}`}>
                                        {store.voteStatus === 'active' ? '투표 종료' : '투표 시작'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ROULETTE CONTROL */}
                        {activeTab === 'roulette' && (
                            <div className="flex flex-col gap-3 h-full relative z-10">
                                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scroll">
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
                                <div className="mt-4 pt-4 border-t border-[#333] flex flex-col gap-2 relative z-10">
                                    <button onClick={() => store.updateRouletteItems(localRouletteItems)} className="w-full py-3 rounded-xl font-bold bg-[#333] hover:bg-[#444] transition-all">룰렛 업데이트</button>
                                    <button onClick={store.resetRoulette} className="w-full py-3 rounded-xl font-bold text-red-400 bg-[#222] hover:bg-red-500/10 hover:text-red-500 border border-[#444] transition-all"><Trash2 size={16} className="inline mr-2" /> 룰렛 초기화</button>
                                    <button onClick={() => checkConflictAndStart('룰렛 돌리기', store.spinRoulette)} disabled={!store.rouletteItems.length || store.isSpinning} className="w-full py-4 rounded-xl font-black bg-white text-black text-lg shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                                        돌려! (SPIN)
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SETTINGS CONTROL */}
                        {activeTab === 'settings' && (
                            <div className="flex flex-col gap-2 h-full relative z-10">
                                <button onClick={() => setSettingCategory('tts')} className={`w-full text-left px-4 py-3 font-bold rounded-xl border transition-all shadow-sm ${settingCategory === 'tts' ? 'bg-[#262626] text-[#00ff80] border-[#00ff80]' : 'text-gray-400 border-transparent hover:bg-[#222]'}`}>TTS 설정</button>
                                <button onClick={() => setSettingCategory('overlay')} className={`w-full text-left px-4 py-3 font-bold rounded-xl border transition-all shadow-sm ${settingCategory === 'overlay' ? 'bg-[#262626] text-[#00ff80] border-[#00ff80]' : 'text-gray-400 border-transparent hover:bg-[#222]'}`}>OBS 오버레이</button>
                            </div>
                        )}
                    </div>
                </section>

                {/* RIGHT PANEL (CONTENT) */}
                <section className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-2xl relative overflow-hidden flex flex-col shadow-2xl">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    {/* HEADER */}
                    <div className="relative z-20 flex justify-between items-center p-8 pb-4 shrink-0">
                        {['vote', 'donate'].includes(activeTab) && (
                            <div className="flex flex-col">
                                <span className="text-3xl font-black text-white">총 {store.voteItems.reduce((a, b) => a + b.count, 0)}표</span>
                                <span className={`text-xs font-bold tracking-wider mt-1 ${store.voteStatus === 'active' ? 'text-red-500' : 'text-gray-500'}`}>
                                    {store.voteStatus === 'active' ? '● LIVE' : '○ STANDBY'}
                                </span>
                            </div>
                        )}
                        <div className="text-5xl font-mono font-black text-white tracking-widest leading-none ml-auto">
                            {activeTimerString()}
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-hidden p-6 pt-0">
                            {activeTab === 'draw' && <DrawDisplay mode="dashboard" />}
                            {['vote', 'donate'].includes(activeTab) && <VoteDisplay mode="dashboard" />}
                            {activeTab === 'roulette' && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <RouletteDisplay items={store.rouletteItems} style={{ transform: 'scale(1.3)' }} />
                                    {store.rouletteWinner && (
                                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center animate-fadeIn">
                                            <div className="bg-[#1a1a1a] border-4 border-[#00ff80] p-12 rounded-[3.5rem] text-center shadow-[0_0_100px_rgba(0,255,128,0.5)] transform scale-110 relative overflow-hidden">
                                                <div className="text-[#00ff80] mb-4 font-black tracking-[0.3em] uppercase text-sm drop-shadow-md relative z-10">Roulette Winner</div>
                                                <div className="text-6xl md:text-8xl font-black text-white relative z-10 leading-tight">{store.rouletteWinner}</div>
                                                <button onClick={() => store.resetRoulette()} className="w-full bg-[#00ff80] hover:bg-[#00cc66] text-black px-8 py-5 rounded-2xl font-black shadow-lg active:scale-95 text-xl relative z-10 mt-8">확인</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'settings' && (
                                <div className="overflow-y-auto h-full pointer-events-auto custom-scroll p-4">
                                    {settingCategory === 'tts' && (
                                        <div className="space-y-8 max-w-5xl mx-auto py-4">
                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="flex-1 bg-[#222] p-6 rounded-2xl border border-[#333] flex items-center justify-between shadow-lg">
                                                    <div><h3 className="text-lg font-bold text-white mb-1">TTS 사용</h3><p className="text-xs text-gray-500">채팅을 음성으로 읽어줍니다</p></div>
                                                    <Toggle checked={localSettings.useTTS} onChange={() => setLocalSettings({ ...localSettings, useTTS: !localSettings.useTTS })} />
                                                </div>
                                                <div className="flex-1 bg-[#222] p-6 rounded-2xl border border-[#333] shadow-lg">
                                                    <div className="flex justify-between text-sm font-bold mb-4">
                                                        <span className="text-white">음량</span><span className="text-[#00ff80]">{(localSettings.ttsVolume * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <input type="range" value={localSettings.ttsVolume} min="0" max="1" step="0.1" onChange={(e) => setLocalSettings({ ...localSettings, ttsVolume: Number(e.target.value) })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00ff80]" />
                                                </div>
                                            </div>
                                            {/* Voice List */}
                                            <div className="bg-[#222] p-6 rounded-2xl border border-[#333]">
                                                <h3 className="text-xl font-black text-white mb-6 text-center">TTS 음성 선택</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto custom-scroll">
                                                    {voices.map(v => (
                                                        <div key={v.name} onClick={() => setLocalSettings({ ...localSettings, ttsVoice: v.name })} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between h-[110px] ${localSettings.ttsVoice === v.name ? 'bg-[#00ff80]/10 border-[#00ff80]' : 'bg-[#222] border-[#333]'}`}>
                                                            <div className="text-[10px] font-mono text-gray-500 uppercase">{v.lang}</div>
                                                            <div className="font-bold text-sm text-white line-clamp-2">{v.name}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex justify-center mt-8 pb-8">
                                                <button onClick={() => {
                                                    store.updateTTSSettings({
                                                        volume: localSettings.ttsVolume, rate: localSettings.ttsRate,
                                                        voice: localSettings.ttsVoice, enabled: localSettings.useTTS
                                                    });
                                                    alert('저장되었습니다.');
                                                }} className="px-16 py-4 bg-[#00ff80] hover:bg-[#00cc66] text-black font-black text-xl rounded-xl shadow-[0_0_20px_rgba(0,255,128,0.3)] transition-all flex items-center gap-2"><Save /> 저장하기</button>
                                            </div>
                                        </div>
                                    )}
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
                                <button onClick={() => setShowVoteDetailModal(false)} className="w-10 h-10 rounded-full bg-[#333] hover:bg-[#444] text-gray-400 hover:text-white transition flex items-center justify-center"><Trash2 className="rotate-45" size={18} /></button>
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
