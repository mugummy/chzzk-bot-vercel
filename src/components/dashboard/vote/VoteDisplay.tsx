'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Play, RotateCcw, Shuffle, X, Plus, Crown, Trash2, Eye, EyeOff, Diamond, Wrench, Users, Sparkles } from 'lucide-react';
import Toggle from '@/components/ui/Toggle';

interface VoteDisplayProps {
    mode: 'dashboard' | 'overlay';
    showControls?: boolean;
    activeTab?: 'vote' | 'donate';
}

export default function VoteDisplay({ mode, showControls = true, activeTab = 'vote' }: VoteDisplayProps) {
    const store = useVoteStore();
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [showRealNames, setShowRealNames] = useState(false);

    // Slot Machine Logic Variables
    const [slotName, setSlotName] = useState('???');
    const [showChatReveal, setShowChatReveal] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Creation State (Local to this component now, replacing VoteTab's side logic)
    const [localItems, setLocalItems] = useState<string[]>([]);
    const [newItem, setNewItem] = useState('');
    const [creationTitle, setCreationTitle] = useState('');

    // Sync store items to local on mount/reset
    useEffect(() => {
        if (store.voteStatus === 'idle' && store.voteItems.length === 0 && localItems.length === 0) {
            setLocalItems(['', '']); // Start with 2 empty items
        }
    }, [store.voteStatus]);

    // Slot Machine Animation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (store.isVotePicking) {
            setShowChatReveal(false);
            interval = setInterval(() => {
                const item = store.voteItems.find(i => i.id === selectedItemId);
                const candidates = item?.voters.length ? item.voters : [{ name: '참여자 없음' }];
                const randomName = candidates[Math.floor(Math.random() * candidates.length)].name;
                setSlotName(randomName);
            }, 50);
        } else if (store.voteWinner) {
            setSlotName(store.voteWinner.name);
            setTimeout(() => setShowChatReveal(true), 1000);
        }
        return () => clearInterval(interval);
    }, [store.isVotePicking, store.voteWinner, selectedItemId, store.voteItems]);

    // Auto-scroll chat
    useEffect(() => {
        if (showChatReveal && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [store.chatHistory, showChatReveal]);


    const sortedItems = React.useMemo(() => {
        let items = [...store.voteItems];
        if (mode === 'dashboard' && store.isAutoSort) {
            items.sort((a, b) => b.count - a.count);
        }
        return items;
    }, [store.voteItems, store.isAutoSort, mode]);

    const totalVotes = store.voteItems.reduce((sum, item) => sum + item.count, 0);

    // 1. CREATION SCREEN (Dashboard Only)
    if (mode === 'dashboard' && store.voteStatus === 'idle') {
        return (
            <div className="w-full h-full flex flex-col items-center p-8 bg-transparent animate-fadeIn">
                <div className="w-full max-w-2xl space-y-6">
                    {/* Amount Input for Donation Vote */}
                    {activeTab === 'donate' && (
                        <div className="flex items-center gap-4">
                            <label className="text-xl font-bold text-white w-24">금액</label>
                            <div className="flex-1 relative">
                                <input
                                    type="number"
                                    value={store.voteUnit}
                                    onChange={(e) => store.send({ type: 'updateVoteSettings', unit: Number(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white focus:border-[#00ff80] outline-none transition-all font-bold text-right text-xl"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">원</span>
                            </div>
                            <div className="flex items-center gap-2 cursor-pointer bg-white/5 px-4 py-3 rounded-xl border border-white/10 hover:border-white/20" onClick={() => store.send({ type: 'updateVoteSettings', allowMulti: !store.allowMultiVote })}>
                                <Toggle checked={store.allowMultiVote} onChange={() => { }} />
                                <span className="text-sm text-gray-400 font-bold">복수투표 허용</span>
                            </div>
                        </div>
                    )}

                    {/* Items */}
                    {localItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                            <label className="text-xl font-bold text-white w-24">항목 {idx + 1}</label>
                            <input
                                value={item}
                                onChange={(e) => {
                                    const newItems = [...localItems];
                                    newItems[idx] = e.target.value;
                                    setLocalItems(newItems);
                                }}
                                placeholder="투표 이름"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-300 focus:text-white focus:border-[#00ff80] outline-none transition-all placeholder-gray-600"
                            />
                            <button onClick={() => setLocalItems(localItems.filter((_, i) => i !== idx))} className="text-gray-500 hover:text-red-500 transition-colors p-2"><X size={24} /></button>
                        </div>
                    ))}

                    <button onClick={() => setLocalItems([...localItems, ''])} className="w-full py-3 border border-[#00ff80] text-[#00ff80] rounded-xl font-bold hover:bg-[#00ff80] hover:text-black transition-all flex items-center justify-center gap-2">
                        <Plus size={20} /> 항목 추가
                    </button>

                    <div className="flex justify-center items-center gap-4 mt-8">
                        <div className="bg-white/5 px-4 py-2 rounded-lg flex items-center gap-2 border border-white/10">
                            <Toggle checked={store.useVoteTimer} onChange={() => store.send({ type: 'updateVoteSettings', useTimer: !store.useVoteTimer })} />
                            <span className="text-gray-400 text-sm font-bold">타이머 사용하기</span>
                        </div>
                        <button
                            onClick={() => {
                                const validItems = localItems.filter(i => i.trim());
                                if (validItems.length < 2) return alert('최소 2개의 항목이 필요합니다.');
                                store.startVote({
                                    title: creationTitle || '투표',
                                    items: validItems,
                                    mode: activeTab === 'donate' ? 'donation' : 'numeric',
                                    duration: store.voteTimerDuration,
                                    allowMulti: store.allowMultiVote,
                                    unit: store.voteUnit
                                });
                            }}
                            className="bg-[#00ff80] text-black font-black text-xl px-12 py-4 rounded-xl shadow-[0_0_20px_rgba(0,255,128,0.3)] hover:scale-105 active:scale-95 transition-all"
                        >
                            투표 시작
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. ACTIVE & ENDED SCREEN
    return (
        <div className={`flex flex-col h-full w-full relative ${mode === 'overlay' ? 'p-2 gap-4' : 'p-6 gap-3 bg-transparent'}`}>

            {/* Header */}
            {mode === 'dashboard' && (
                <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-4">
                    <div>
                        <h1 className="text-4xl font-black text-white">총 {totalVotes}표</h1>
                    </div>
                    {/* Removed duplicate timer here as requested */}
                    <div className="text-4xl font-mono font-black text-white">
                        {store.voteStatus === 'active' ? 'LIVE' : 'CLOSED'}
                    </div>
                </div>
            )}

            {/* Instruction Card (Active Only) */}
            {mode === 'dashboard' && store.voteStatus === 'active' && (
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 mb-4 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-white text-lg">
                            {store.voteMode === 'donation'
                                ? `투표금액 ${store.voteUnit}원 / ${store.allowMultiVote ? '복수투표 허용됨' : '복수투표 허용 안됨'}`
                                : '채팅 투표가 진행중입니다'}
                        </h3>
                    </div>
                    <div className="text-sm text-gray-400 space-y-2">
                        {store.voteMode === 'donation' && !store.allowMultiVote && (
                            <ul className="list-disc list-inside space-y-1 mb-2">
                                <li className="font-bold text-white">복수투표가 허용되지 않았습니다</li>
                                <ul className="list-[circle] list-inside pl-4 space-y-1 text-gray-500">
                                    <li>얼마를 투표하던 투표 수 하나로 고정됩니다 (최소 투표 금액을 넘지 않을 경우 투표되지 않습니다)</li>
                                    <li>추가 도네 시 해당 투표자의 기존 투표를 지우고 새로운 투표로 취급됩니다</li>
                                </ul>
                            </ul>
                        )}
                        <ul className="list-disc list-inside space-y-1">
                            <li>{store.voteMode === 'donation' ? '도네 시' : '채팅 시'} 반드시 <span className="text-[#00ff80] font-bold">메시지 가장 앞에 \'!투표 [번호]\' 혹은 \'!투표[번호]\'</span>와 같이 입력해주세요 (예: !투표 1)</li>
                            {store.voteMode === 'donation' && (
                                <li className="text-[#00ff80] font-bold">익명 도네 시 투표가 들어가지 않습니다. 주의하세요!</li>
                            )}
                            <li>투표율 바를 클릭하면 상세 정보를 확인할 수 있습니다</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Vote List */}
            <div className={`flex-1 overflow-y-auto pr-2 custom-scroll ${mode === 'overlay' ? 'space-y-4' : 'space-y-3'}`}>
                <AnimatePresence>
                    {sortedItems.map((item, idx) => {
                        const percent = totalVotes ? (item.count / totalVotes) * 100 : 0;
                        return (
                            <motion.div
                                key={item.id}
                                layout
                                onClick={() => mode === 'dashboard' && setSelectedItemId(item.id)}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className={`
                               relative rounded-xl overflow-hidden border transition-all
                               ${mode === 'overlay'
                                        ? 'h-24 border-white/20 bg-black/40 shadow-lg'
                                        : 'h-20 bg-[#333] border-[#444] group hover:border-[#00ff80] cursor-pointer active:scale-[0.99]'}
                                `}
                            >
                                {/* Progress Bar Background */}
                                <motion.div
                                    className={`absolute top-0 left-0 h-full transition-all duration-500 ${mode === 'overlay' ? 'bg-[#00ff80]/40 shadow-[0_0_20px_rgba(0,255,128,0.2)]' : 'bg-[#444]/50'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percent}%` }}
                                />

                                <div className="relative z-10 flex items-center justify-between px-6 h-full">
                                    <div className="flex flex-col justify-center">
                                        <span className={`font-bold mb-1 tracking-wider ${mode === 'overlay' ? 'text-[#00ff80] text-lg' : 'text-gray-400 text-xs'}`}>
                                            !투표{item.id}
                                        </span>
                                        <span className={`font-black text-white leading-none truncate max-w-[300px] ${mode === 'overlay' ? 'text-4xl drop-shadow-md' : 'text-xl'}`}>
                                            {item.name}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={`font-black text-white leading-none ${mode === 'overlay' ? 'text-4xl drop-shadow-md' : 'text-2xl'}`}>
                                            {item.count}표
                                        </span>
                                        <span className={`font-bold leading-none ${mode === 'overlay' ? 'text-white/80 text-2xl' : 'text-gray-400 text-lg'}`}>
                                            {Math.round(percent)}%
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Active/Ended Footer Controls */}
            {mode === 'dashboard' && (
                <div className="mt-4 flex justify-between items-center bg-[#161616] p-2 border-t border-[#333] pt-4">
                    <div className="flex items-center gap-2 cursor-pointer hover:bg-[#222] p-2 rounded-lg transition-colors" onClick={() => {
                        // Optimistic update
                        store.send({ type: 'updateVoteSettings', autoSort: !store.isAutoSort });
                        // Also force local re-render if needed, but memo should handle it
                    }}>
                        <Toggle checked={!!store.isAutoSort} onChange={() => { }} />
                        <span className="text-gray-400 font-bold text-sm">투표수가 높은 순으로 표시하기</span>
                    </div>

                    <div className="flex gap-2">
                        {store.voteStatus === 'active' ? (
                            <button onClick={store.endVote} className="bg-[#00ff80] text-black font-bold px-8 py-3 rounded-lg hover:bg-[#00cc66] transition-all">
                                투표 종료
                            </button>
                        ) : (
                            <>
                                <button onClick={() => { store.resetVote(); setLocalItems(['', '']); setNewItem(''); }} className="bg-[#00ff80] text-black font-bold px-8 py-3 rounded-lg hover:bg-[#00cc66] transition-all">
                                    다시 시작하기
                                </button>
                                <button onClick={store.transferVotesToRoulette} className="bg-transparent border border-[#00ff80] text-[#00ff80] font-bold px-8 py-3 rounded-lg hover:bg-[#00ff80] hover:text-black transition-all">
                                    투표결과로 룰렛 돌리기
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}


            {/* DETAIL MODAL (Slot Machine Reveal Style) */}
            <AnimatePresence>
                {selectedItemId !== null && mode === 'dashboard' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-[#161616] flex flex-col p-8"
                    >
                        {(() => {
                            const item = store.voteItems.find(i => i.id === selectedItemId);
                            if (!item) { setSelectedItemId(null); return null; }
                            // If Picking/Winner, show Slot Machine View
                            // Else show List View
                            const showSlotMachine = store.isVotePicking || store.voteWinner;

                            return (
                                <div className="flex-1 flex flex-col relative">
                                    {/* Header */}
                                    <div className="mb-8">
                                        <span className="text-white font-black text-2xl block mb-2">!투표{item.id}</span>
                                        <h1 className="text-5xl font-black text-white">{item.name}</h1>
                                    </div>

                                    {/* Main Content Area */}
                                    <div className="flex-1 relative border border-[#333] rounded-2xl bg-[#0f0f0f] overflow-hidden flex flex-col items-center justify-center">
                                        {showSlotMachine ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center relative">
                                                {/* Slot Machine Reuse */}
                                                <div className={`relative flex flex-col items-center transition-all duration-700 ${showChatReveal ? '-translate-y-12' : ''}`}>
                                                    <div className="w-[300px] h-[2px] bg-gradient-to-r from-transparent via-[#00ff80] to-transparent mb-6"></div>
                                                    <div className="min-h-[60px] flex items-center justify-center overflow-hidden">
                                                        <span className={`text-4xl font-black text-white tracking-tight ${store.isVotePicking ? 'animate-pulse' : 'text-[#00ff80] drop-shadow-[0_0_15px_rgba(0,255,128,0.5)]'}`}>
                                                            {slotName}
                                                        </span>
                                                    </div>
                                                    <div className="w-[300px] h-[2px] bg-gradient-to-r from-transparent via-[#00ff80] to-transparent mt-6"></div>
                                                </div>

                                                {/* Winner Chat Reveal */}
                                                <div className={`absolute bottom-0 w-full max-w-xl px-6 transition-all duration-700 ease-out flex flex-col items-center ${showChatReveal ? 'h-[50%] opacity-100 mb-8' : 'h-0 opacity-0 mb-0'}`}>
                                                    <div className="flex-1 w-full bg-[#1a1a1a]/90 backdrop-blur-md rounded-xl border border-[#333] overflow-hidden flex flex-col shadow-2xl">
                                                        <div className="bg-[#222] px-4 py-2 border-b border-[#333] flex justify-between items-center">
                                                            <span className="text-xs font-bold text-gray-400">최근 채팅</span>
                                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                                        </div>
                                                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll" ref={scrollRef}>
                                                            {store.chatHistory.map((msg, idx) => (
                                                                <div key={idx} className={`text-sm ${msg.nickname === store.voteWinner?.name ? 'bg-[#00ff80]/10 border border-[#00ff80]/30 rounded-lg p-2' : ''}`}>
                                                                    <span className={`font-bold mr-2 ${msg.nickname === store.voteWinner?.name ? 'text-[#00ff80]' : 'text-gray-400'}`}>{msg.nickname}:</span>
                                                                    <span className="text-gray-200">{msg.message}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex gap-2">
                                                        <button onClick={() => { store.resetVoteWinner(); setShowChatReveal(false); }} className="px-6 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg font-bold text-sm">목록으로</button>
                                                        <button onClick={() => { store.pickVoteWinner(selectedItemId as number); setShowChatReveal(false); }} className="px-6 py-2 bg-[#00ff80] hover:bg-[#00cc66] text-black rounded-lg font-bold text-sm">다시 추첨하기</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col">
                                                {/* List Header */}
                                                <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a]">
                                                    <div className="text-gray-400 text-sm font-bold flex gap-4">
                                                        <span className="flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => setShowRealNames(!showRealNames)}>
                                                            <div className={`w-10 h-6 rounded-full relative transition-colors ${!showRealNames ? 'bg-[#00ff80]' : 'bg-[#333]'}`}>
                                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${!showRealNames ? 'left-5' : 'left-1'}`}></div>
                                                            </div>
                                                            <span>익명으로 보기</span>
                                                        </span>
                                                        <span className="flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => store.send({ type: 'updateVoteSettings', voteExcludeWinners: !store.voteExcludeWinners })}>
                                                            <Toggle checked={store.voteExcludeWinners} onChange={() => { }} />
                                                            <span>이미 뽑힌 참여자 제외하기</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* List */}
                                                <div className="flex-1 overflow-y-auto p-4 custom-scroll grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 content-start">
                                                    {item.voters.map((voter: any, idx: number) => {
                                                        const hasRole = ['스트리머', '매니저', '구독자'].includes(voter.role);
                                                        return (
                                                            <div key={idx} className="bg-[#222] p-3 rounded-lg border border-[#333] flex items-center gap-3">
                                                                {hasRole && (
                                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs
                                                                    ${voter.role === '스트리머' ? 'bg-[#00ff80] text-black' :
                                                                            voter.role === '매니저' ? 'bg-green-700 text-white' :
                                                                                'bg-[#333] text-[#00ff80] border border-[#00ff80]'}`
                                                                    }>
                                                                        {voter.role === '스트리머' && <Crown size={12} fill="currentColor" />}
                                                                        {voter.role === '매니저' && <Wrench size={12} fill="currentColor" />}
                                                                        {voter.role === '구독자' && <Diamond size={12} fill="currentColor" />}
                                                                    </div>
                                                                )}
                                                                <div className="truncate text-sm font-bold text-gray-300">
                                                                    {showRealNames ? voter.name : (voter.name.length > 2 ? voter.name.substring(0, 2) + '***' : voter.name.substring(0, 1) + '*')}
                                                                </div>
                                                                {store.voteMode === 'donation' && voter.amount && <span className="ml-auto text-xs text-[#00ff80]">{voter.amount.toLocaleString()}</span>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {/* Footer Stats / Draw Button */}
                                                <div className="p-6 border-t border-[#333] bg-[#1a1a1a] flex justify-between items-center">
                                                    <span className="text-xl font-bold text-white">총 {item.count}표 / {item.voters.length}명 ({totalVotes ? Math.round((item.count / totalVotes) * 100) : 0}%)</span>
                                                    <span className="text-xl font-bold text-white">총 {item.voters.length}명</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Control Buttons (Top Right Overlay) */}
                                    <div className="absolute top-0 right-0 flex gap-2">
                                        {!showSlotMachine && (
                                            <>
                                                <button onClick={() => setSelectedItemId(null)} className="border border-[#00ff80] text-[#00ff80] px-6 py-2 rounded-lg font-bold hover:bg-[#00ff80]/10">목록으로</button>
                                                <button onClick={() => store.pickVoteWinner(item.id)} className="bg-[#00ff80] text-black px-8 py-2 rounded-lg font-bold hover:bg-[#00cc66] shadow-[0_0_15px_rgba(0,255,128,0.4)]">추첨하기</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
