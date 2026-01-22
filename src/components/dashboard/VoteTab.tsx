'use client';

import React, { useState } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import VoteDisplay from '@/components/dashboard/vote/VoteDisplay';
import DrawDisplay from '@/components/dashboard/vote/DrawDisplay';
import RouletteDisplay from '@/components/dashboard/vote/RouletteDisplay';
import {
    Users, BarChart2, Coins, Disc, Settings, Sliders, Zap,
    Clock, Trash2, Shuffle, Check, Play, Volume2, Save,
    Link, Eye, EyeOff, Crown, Copy, ToggleLeft, ToggleRight, RotateCcw
} from 'lucide-react';

export default function VoteTab() {
    const store = useVoteStore();
    const [activeTab, setActiveTab] = useState<'vote' | 'draw' | 'donate' | 'roulette' | 'settings'>('draw');

    // Local State for Items Editor
    const [localVoteItems, setLocalVoteItems] = useState<string[]>([]);
    const [newVoteItem, setNewVoteItem] = useState('');

    const [localRouletteItems, setLocalRouletteItems] = useState<{ name: string; weight: number }[]>([]);
    const [newRouletteName, setNewRouletteName] = useState('');
    const [newRouletteWeight, setNewRouletteWeight] = useState(1);

    // Local State for Inputs (to avoid freezing)
    const [localDrawKeyword, setLocalDrawKeyword] = useState('!참여');
    const [localVoteTitle, setLocalVoteTitle] = useState('');

    // Sync Store -> Local (One way sync when store updates, if needed)
    React.useEffect(() => {
        if (store.drawKeyword) setLocalDrawKeyword(store.drawKeyword);
    }, [store.drawKeyword]);

    React.useEffect(() => {
        if (store.voteTitle) setLocalVoteTitle(store.voteTitle);
    }, [store.voteTitle]);

    const handleVoteTitleBlur = () => {
        if (localVoteTitle !== store.voteTitle) {
            store.send({ type: 'updateVoteSettings', title: localVoteTitle });
        }
    };

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
        overlayUrl: 'http://localhost:3000/overlay' // Placeholder
    });

    // TTS State
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    React.useEffect(() => {
        const loadVoices = () => {
            const v = window.speechSynthesis.getVoices();
            if (v.length > 0) {
                setVoices(v);
                // Set default to Korean if available and not set
                if (!localSettings.ttsVoice) {
                    const ko = v.find(voice => voice.lang.includes('ko'));
                    if (ko) setLocalSettings(prev => ({ ...prev, ttsVoice: ko.name }));
                }
            }
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const previewVoice = (voice: SpeechSynthesisVoice) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("목소리 테스트입니다.");
        utterance.voice = voice;
        utterance.volume = localSettings.ttsVolume;
        utterance.rate = localSettings.ttsRate;
        window.speechSynthesis.speak(utterance);
    };

    const saveSettings = (type: 'tts' | 'overlay') => {
        if (type === 'tts') {
            store.updateTTSSettings({
                volume: localSettings.ttsVolume,
                rate: localSettings.ttsRate,
                voice: localSettings.ttsVoice,
                enabled: localSettings.useTTS
            });
            alert('TTS 설정이 저장되었습니다.');
        } else {
            store.updateOverlaySettings({
                chromaKey: localSettings.overlayChroma,
                enableTTS: localSettings.overlayTTS,
                showTimer: localSettings.overlayTimer,
                opacity: localSettings.overlayOpacity,
                theme: localSettings.overlayTheme,
                accentColor: localSettings.overlayAccent,
                scale: localSettings.overlayScale
            });
            alert('오버레이 설정이 저장되었습니다.');
        }
    };

    // Toggle Helper
    const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
        <div onClick={onChange} className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${checked ? 'bg-[#00ff80]' : 'bg-gray-600'}`}>
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
    );

    // Handlers
    const addVoteItem = () => {
        if (newVoteItem.trim()) {
            setLocalVoteItems([...localVoteItems, newVoteItem.trim()]);
            setNewVoteItem('');
        }
    };
    const removeVoteItem = (idx: number) => {
        setLocalVoteItems(localVoteItems.filter((_, i) => i !== idx));
    };

    const addRouletteItem = () => {
        if (newRouletteName.trim()) {
            setLocalRouletteItems([...localRouletteItems, { name: newRouletteName.trim(), weight: Number(newRouletteWeight) || 1 }]);
            setNewRouletteName('');
            setNewRouletteWeight(1);
        }
    };
    const removeRouletteItem = (idx: number) => {
        setLocalRouletteItems(localRouletteItems.filter((_, i) => i !== idx));
    };
    const saveRoulette = () => {
        store.updateRouletteItems(localRouletteItems);
    };

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

    const handleVoteItemClick = (item: any) => {
        setSelectedVoteItem(item);
        setShowVoteDetailModal(true);
    };

    const pickVoteWinner = (item: any) => {
        store.send({ type: 'pickVoteWinner', itemId: item.id, count: 1 });
        setShowVoteDetailModal(false);
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
                                        <span className={`text-sm font-bold ${store.excludeWinners ? 'text-white' : 'text-gray-300'}`}>이미 뽑힌 사람 제외</span>
                                        <Toggle checked={store.excludeWinners} onChange={() => store.send({ type: 'updateDraw', excludeWinners: !store.excludeWinners })} />
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-[#262626] rounded-xl border border-transparent shadow-sm">
                                        <div className="flex flex-col w-full">
                                            <span className="text-sm font-bold text-gray-300">명령어 추첨 (!참여)</span>
                                            <input
                                                value={localDrawKeyword}
                                                onChange={(e) => setLocalDrawKeyword(e.target.value)}
                                                onBlur={() => store.send({ type: 'updateDraw', keyword: localDrawKeyword })}
                                                onKeyDown={(e) => e.key === 'Enter' && store.send({ type: 'updateDraw', keyword: localDrawKeyword })}
                                                className="bg-[#111] text-white p-2 mt-1 rounded-lg border border-[#333] text-sm outline-none focus:border-[#00ff80] w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 flex flex-col gap-2 relative z-10">
                                    <button onClick={store.undoLastWinner} className="w-full py-3 rounded-xl font-bold text-orange-400 bg-[#222] hover:bg-orange-500/10 hover:text-orange-500 border border-[#444] transition-all flex items-center justify-center gap-2">
                                        <RotateCcw size={16} /> 당첨 취소 (Undo)
                                    </button>
                                    <button onClick={store.resetDraw} className="w-full py-3 rounded-xl font-bold text-red-400 bg-[#222] hover:bg-red-500/10 hover:text-red-500 border border-[#444] transition-all flex items-center justify-center gap-2">
                                        <Trash2 size={16} /> 명단 초기화
                                    </button>

                                    {store.previousWinners && store.previousWinners.length > 0 && (
                                        <div className="p-3 bg-[#222] rounded-xl border border-[#333] max-h-32 overflow-y-auto custom-scroll">
                                            <div className="text-xs text-gray-500 font-bold mb-2">당첨자 목록 ({store.previousWinners.length})</div>
                                            <div className="flex flex-wrap gap-1">
                                                {store.previousWinners.map((w, i) => (
                                                    <span key={i} className="text-xs bg-[#333] text-gray-300 px-2 py-1 rounded-md">{w}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

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
                                        value={localVoteTitle}
                                        onChange={(e) => setLocalVoteTitle(e.target.value)}
                                        onBlur={handleVoteTitleBlur}
                                        onKeyDown={(e) => e.key === 'Enter' && handleVoteTitleBlur()}
                                        placeholder="투표 주제를 입력하세요..."
                                        className="w-full bg-transparent text-white font-bold text-lg outline-none border-b border-[#444] focus:border-[#00ff80] transition-colors placeholder-gray-600"
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scroll">
                                    {/* Edit Mode (Idle) vs View Mode (Active/Ended) */}
                                    {store.voteStatus === 'idle' ? (
                                        <>
                                            {localVoteItems.map((item, idx) => (
                                                <div key={idx} className="flex gap-2 items-center group">
                                                    <div className="w-6 h-6 rounded-full bg-[#333] flex items-center justify-center text-xs text-gray-500 font-mono">{idx + 1}</div>
                                                    <div className="flex-1 bg-[#262626] text-white px-3 py-3 rounded-lg text-sm">{item}</div>
                                                    <button onClick={() => removeVoteItem(idx)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-[#333] rounded-lg transition-all"><Trash2 size={14} /></button>
                                                </div>
                                            ))}
                                            <div className="flex gap-2 mt-2">
                                                <input
                                                    value={newVoteItem}
                                                    onChange={(e) => setNewVoteItem(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && addVoteItem()}
                                                    placeholder="새 항목 추가..."
                                                    className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[#00ff80] outline-none"
                                                />
                                                <button onClick={addVoteItem} className="px-3 bg-[#333] text-white rounded-lg font-bold hover:bg-[#444]">+</button>
                                            </div>
                                        </>
                                    ) : (
                                        // View Mode
                                        store.voteItems.map((item, idx) => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleVoteItemClick(item)}
                                                className="flex gap-2 items-center cursor-pointer hover:bg-[#222] p-1 rounded-lg transition-colors group"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-[#333] flex items-center justify-center text-xs text-gray-500 font-mono group-hover:bg-[#00ff80] group-hover:text-black transition-colors">{idx + 1}</div>
                                                <div className="flex-1 bg-[#262626]/50 text-white px-3 py-3 rounded-lg text-sm opacity-90 group-hover:opacity-100 border border-transparent group-hover:border-[#333]">
                                                    {item.name} <span className="float-right font-bold text-[#00ff80]">{item.count}표 ({(item as any).percent || 0}%)</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-[#333] space-y-2 relative z-10">
                                    <button onClick={() => checkConflictAndStart('룰렛 연동', store.transferVotesToRoulette)} className="w-full py-3 rounded-xl font-bold bg-[#333] text-gray-300 hover:bg-[#444] hover:text-white transition-all border border-[#444] flex items-center justify-center gap-2">
                                        <Shuffle size={16} /> 투표 결과로 룰렛 만들기
                                    </button>
                                    <button onClick={() => { store.resetVote(); setLocalVoteItems([]); }} className="w-full py-3 rounded-xl font-bold text-red-400 bg-[#222] hover:bg-red-500/10 hover:text-red-500 border border-[#444] transition-all flex items-center justify-center gap-2">
                                        <Trash2 size={16} /> 투표 초기화
                                    </button>
                                    <button
                                        onClick={() => {
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
                                    {/* Existing Items */}
                                    {localRouletteItems.map((item, idx) => {
                                        const totalWeight = localRouletteItems.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0) || 1;
                                        const percent = Math.round((Number(item.weight) / totalWeight) * 100);

                                        return (
                                            <div key={idx} className="flex gap-2 items-center group bg-[#262626] p-2 rounded-lg border border-transparent hover:border-[#444]">
                                                <div className="w-1 h-8 rounded-full" style={{ background: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1'][idx % 6] }}></div>
                                                <input
                                                    value={item.name}
                                                    onChange={(e) => {
                                                        const newItems = [...localRouletteItems];
                                                        newItems[idx].name = e.target.value;
                                                        setLocalRouletteItems(newItems);
                                                    }}
                                                    className="flex-1 bg-transparent text-white text-sm outline-none"
                                                />
                                                <div className="flex items-center gap-1 bg-[#111] rounded px-2">
                                                    <input
                                                        type="number"
                                                        value={item.weight}
                                                        onChange={(e) => {
                                                            const newItems = [...localRouletteItems];
                                                            newItems[idx].weight = Number(e.target.value);
                                                            setLocalRouletteItems(newItems);
                                                        }}
                                                        className="w-10 bg-transparent text-center text-xs outline-none font-bold"
                                                    />
                                                    <span className="text-xs text-gray-500 w-8 text-right font-mono">{percent}%</span>
                                                </div>
                                                <button onClick={() => removeRouletteItem(idx)} className="text-red-400 p-1 hover:bg-[#333] rounded"><Trash2 size={14} /></button>
                                            </div>
                                        );
                                    })}

                                    {/* Add New */}
                                    <div className="flex gap-2 mt-2 p-2 bg-[#222] rounded-lg border border-dashed border-[#444]">
                                        <input
                                            value={newRouletteName}
                                            onChange={(e) => setNewRouletteName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addRouletteItem()}
                                            placeholder="항목 이름"
                                            className="flex-1 bg-transparent text-sm text-white outline-none"
                                        />
                                        <input
                                            type="number"
                                            value={newRouletteWeight}
                                            onChange={(e) => setNewRouletteWeight(Number(e.target.value))}
                                            className="w-12 bg-[#111] border border-[#333] rounded text-center text-xs outline-none"
                                        />
                                        <button onClick={addRouletteItem} className="px-3 bg-[#444] text-white rounded text-xs hover:bg-[#555] font-bold">추가</button>
                                    </div>

                                    <button onClick={saveRoulette} className="w-full py-2 mt-2 rounded-lg bg-[#333] text-[#00ff80] font-bold text-xs hover:bg-[#444] flex items-center justify-center gap-1">
                                        <Save size={14} /> 서버에 저장 (리스트 업데이트)
                                    </button>
                                </div>
                                <div className="mt-4 pt-4 border-t border-[#333] flex flex-col gap-2 relative z-10">
                                    <button onClick={() => { store.resetRoulette(); setLocalRouletteItems([]); }} className="w-full py-3 rounded-xl font-bold text-red-400 bg-[#222] hover:bg-red-500/10 hover:text-red-500 border border-[#444] transition-all flex items-center justify-center gap-2">
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

                        {/* SETTINGS (Full Implementation) */}
                        {activeTab === 'settings' && (
                            <div className="flex flex-col gap-2 h-full relative z-10">
                                <div className="flex gap-2 mb-4">
                                    {(['tts', 'overlay'] as const).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSettingCategory(cat)}
                                            className={`flex-1 py-3 font-bold rounded-xl border transition-all ${settingCategory === cat ? 'bg-[#262626] text-[#00ff80] border-[#00ff80]' : 'text-gray-400 border-transparent hover:bg-[#222]'}`}
                                        >
                                            {cat === 'tts' ? 'TTS 설정' : 'OBS 오버레이'}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scroll p-1">
                                    {settingCategory === 'tts' && (
                                        <div className="space-y-6">
                                            {/* TTS Toggle & Volume */}
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="flex-1 bg-[#222] p-4 rounded-2xl border border-[#333] flex justify-between items-center">
                                                    <div>
                                                        <h3 className="font-bold text-white">TTS 사용</h3>
                                                        <p className="text-xs text-gray-500">채팅 음성 읽기</p>
                                                    </div>
                                                    <Toggle checked={localSettings.useTTS} onChange={() => setLocalSettings({ ...localSettings, useTTS: !localSettings.useTTS })} />
                                                </div>
                                                <div className="flex-1 bg-[#222] p-4 rounded-2xl border border-[#333]">
                                                    <div className="flex justify-between text-xs font-bold mb-2">
                                                        <span className="text-gray-400">음량</span>
                                                        <span className="text-[#00ff80]">{(localSettings.ttsVolume * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <input
                                                        type="range" min="0" max="1" step="0.1"
                                                        value={localSettings.ttsVolume}
                                                        onChange={(e) => setLocalSettings({ ...localSettings, ttsVolume: Number(e.target.value) })}
                                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00ff80]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Voice List */}
                                            <div className="bg-[#222] p-4 rounded-2xl border border-[#333]">
                                                <h3 className="font-bold text-white mb-2">음성 선택</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto custom-scroll pr-2">
                                                    {voices.map((voice) => (
                                                        <div
                                                            key={voice.name}
                                                            onClick={() => {
                                                                setLocalSettings({ ...localSettings, ttsVoice: voice.name });
                                                                previewVoice(voice);
                                                            }}
                                                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between h-[80px] ${localSettings.ttsVoice === voice.name ? 'bg-[#00ff80]/10 border-[#00ff80] shadow-[0_0_15px_rgba(0,255,128,0.2)]' : 'bg-[#1a1a1a] border-[#333] hover:border-gray-500'}`}
                                                        >
                                                            <div className="text-[10px] font-mono uppercase text-gray-400 mb-1">{voice.lang}</div>
                                                            <div className={`font-bold text-xs leading-tight line-clamp-2 ${localSettings.ttsVoice === voice.name ? 'text-[#00ff80]' : 'text-gray-300'}`}>
                                                                {voice.name.replace('Google', '').replace('Microsoft', '').trim()}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {voices.length === 0 && (
                                                        <div className="col-span-full text-center text-gray-500 py-4">
                                                            사용 가능한 음성이 없습니다.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button onClick={() => saveSettings('tts')} className="w-full py-4 bg-[#00ff80] text-black font-black rounded-xl hover:bg-[#00cc66] transition shadow-lg">
                                                <Save className="inline mr-2" size={18} /> 설정 저장하기
                                            </button>
                                        </div>
                                    )}

                                    {settingCategory === 'overlay' && (
                                        <div className="space-y-6">
                                            {/* URL Section */}
                                            <div className="bg-[#222] p-4 rounded-2xl border border-[#333]">
                                                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Link size={16} className="text-[#00ff80]" /> 오버레이 URL</h3>
                                                <div className="flex gap-2">
                                                    <div className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-xs font-mono text-gray-400 truncate">
                                                        {localSettings.overlayUrl}
                                                    </div>
                                                    <button onClick={() => navigator.clipboard.writeText(localSettings.overlayUrl)} className="px-3 bg-[#333] text-white rounded-lg hover:bg-[#444]"><Copy size={16} /></button>
                                                </div>
                                            </div>

                                            {/* Controls */}
                                            <div className="bg-[#222] p-4 rounded-2xl border border-[#333] space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-sm text-gray-300">오버레이 음성 출력</span>
                                                    <Toggle checked={localSettings.overlayTTS} onChange={() => setLocalSettings({ ...localSettings, overlayTTS: !localSettings.overlayTTS })} />
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-sm text-gray-300">타이머 표시</span>
                                                    <Toggle checked={localSettings.overlayTimer} onChange={() => setLocalSettings({ ...localSettings, overlayTimer: !localSettings.overlayTimer })} />
                                                </div>
                                            </div>

                                            <button className="w-full py-4 bg-[#00ff80] text-black font-black rounded-xl hover:bg-[#00cc66] transition shadow-lg">
                                                <Save className="inline mr-2" size={18} /> 설정 저장하기
                                            </button>
                                        </div>
                                    )}
                                </div>
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

            {/* VOTE DETAIL MODAL */}
            {showVoteDetailModal && selectedVoteItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowVoteDetailModal(false)}>
                    <div className="bg-[#1a1a1a] rounded-2xl border border-[#333] shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden relative" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-[#333] flex justify-between items-center bg-[#222]">
                            <div>
                                <span className="text-[#00ff80] font-bold text-sm tracking-widest mb-1 block">VOTE DETAIL</span>
                                <h2 className="text-2xl font-black text-white">{selectedVoteItem.name}</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setShowRealNames(!showRealNames)} className="flex items-center gap-2 cursor-pointer bg-[#333] px-3 py-1.5 rounded-lg hover:bg-[#444] transition text-gray-300 text-xs font-bold">
                                    {showRealNames ? <Eye size={14} className="text-[#00ff80]" /> : <EyeOff size={14} />} 닉네임 보기
                                </button>
                                <button onClick={() => setShowVoteDetailModal(false)} className="w-8 h-8 rounded-full hover:bg-[#333] flex items-center justify-center text-gray-500 hover:text-white">
                                    <Trash2 size={16} className="rotate-45" /> {/* Close Icon substitute */}
                                </button>
                            </div>
                        </div>

                        {/* Voter List */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scroll bg-[#111]">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {(selectedVoteItem.voters || []).map((voter: any, idx: number) => (
                                    <div key={idx} className="bg-[#222] p-3 rounded-lg border border-[#333] flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${voter.role === '구독자' ? 'bg-[#00ff80] text-black' : 'bg-[#333] text-gray-400 border border-[#444]'}`}>
                                            {voter.role === '구독자' ? '구' : '팬'}
                                        </div>
                                        <div className="truncate text-sm font-bold text-gray-300">
                                            {showRealNames ? voter.name : (voter.name.substring(0, 2) + '***')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-[#333] bg-[#222]">
                            <button
                                onClick={() => pickVoteWinner(selectedVoteItem)}
                                disabled={store.voteStatus !== 'idle'}
                                className="w-full py-4 rounded-xl font-black text-black bg-[#00ff80] hover:bg-[#00cc66] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg flex items-center justify-center gap-2 text-xl"
                            >
                                <Crown size={20} /> 이 항목에서 추첨하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
