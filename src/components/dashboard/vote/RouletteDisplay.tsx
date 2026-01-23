'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import { Trash2, Plus, RotateCcw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RouletteDisplayProps {
    mode?: 'dashboard' | 'overlay';
}

export default function RouletteDisplay({ mode = 'dashboard' }: RouletteDisplayProps) {
    const store = useVoteStore();

    // Local State for Configuration
    // We init from store.rouletteItems if available
    const [configItems, setConfigItems] = useState<{ name: string; weight: number }[]>([]);

    useEffect(() => {
        if (store.rouletteItems.length > 0 && configItems.length === 0) {
            setConfigItems(store.rouletteItems);
        } else if (store.rouletteItems.length === 0 && configItems.length === 0) {
            // Default 2 items
            setConfigItems([{ name: '', weight: 1 }, { name: '', weight: 1 }]);
        }
    }, [store.rouletteItems]);

    // Derived: Total Weight for Config
    const totalConfigWeight = configItems.reduce((sum, i) => sum + (Number(i.weight) || 0), 0) || 1;

    // Mode determination
    // If activeRouletteItems has items, we are in GAME mode.
    // If not, we are in CONFIG mode.
    const isGameMode = store.activeRouletteItems.length > 0;

    // --- Actions ---
    const handleStartGame = () => {
        const validItems = configItems.filter(i => i.name.trim() !== '');
        if (validItems.length < 2) return alert('최소 2개의 항목이 필요합니다.');
        store.updateRouletteItems(validItems);
        store.transferVotesToRoulette(); // This actually sets activeItems = items. Wait, transferVotesToRoulette does more.
        // We need a direct "Start" action.
        // Let's manually set active items in store to switch mode.
        // Since useVoteStore doesn't have a direct "SetActive" from items, 
        // we can use updateRouletteItems (sets items) + a logic to "Lock In"
        // Actually store.updateRouletteItems sets items but clears activeItems?
        // Let's check store: updateRouletteItems => set({ rouletteItems: items, activeRouletteItems: [] })
        // We need a generic "Start Roulette" which copies rouletteItems -> activeRouletteItems
    };

    // Helper to start
    const startGame = () => {
        const validItems = configItems.filter(i => i.name.trim() !== '');
        if (validItems.length < 2) return alert('최소 2개의 항목이 필요합니다.');

        // 1. Update global items
        store.updateRouletteItems(validItems);

        // 2. Set Active Items manually to switch mode
        // Since we don't have a specific action, we can just use the store setter normally
        useVoteStore.setState({
            activeRouletteItems: validItems,
            rouletteRotation: 0,
            rouletteWinner: null
        });
    };

    const handleReset = () => {
        store.resetRoulette();
        // This clears activeItems, so we go back to Config mode.
    };


    // --- Render: Config Mode ---
    if (!isGameMode) {
        if (mode === 'overlay') return null; // Don't show config in overlay

        return (
            <div className="w-full h-full flex flex-col items-center p-8 bg-transparent animate-fadeIn">
                <div className="w-full max-w-3xl flex flex-col gap-4">
                    <div className="flex-1 overflow-y-auto max-h-[60vh] custom-scroll space-y-4 pr-2">
                        {configItems.map((item, idx) => {
                            const percent = ((item.weight / totalConfigWeight) * 100).toFixed(2);
                            return (
                                <div key={idx} className="flex items-center gap-4 bg-transparent animate-slideIn">
                                    <span className="text-2xl font-bold text-white w-20 text-right">항목 {idx + 1}</span>
                                    <input
                                        value={item.name}
                                        onChange={(e) => {
                                            const newItems = [...configItems];
                                            newItems[idx].name = e.target.value;
                                            setConfigItems(newItems);
                                        }}
                                        placeholder="투표 이름"
                                        className="flex-1 bg-[#262626] border border-[#333] rounded-lg px-4 py-4 text-gray-200 focus:text-white focus:border-[#00ff80] outline-none transition-all placeholder-gray-600 text-lg"
                                    />
                                    <input
                                        type="number"
                                        value={item.weight}
                                        onChange={(e) => {
                                            const newItems = [...configItems];
                                            newItems[idx].weight = Number(e.target.value);
                                            setConfigItems(newItems);
                                        }}
                                        className="w-24 bg-[#262626] border border-[#333] rounded-lg px-4 py-4 text-center text-white focus:border-[#00ff80] outline-none transition-all font-mono text-lg"
                                    />
                                    <span className="text-gray-400 font-mono w-20 text-right">{percent}%</span>
                                    <button
                                        onClick={() => setConfigItems(configItems.filter((_, i) => i !== idx))}
                                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        <X size={32} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 space-y-4">
                        <button
                            onClick={() => setConfigItems([...configItems, { name: '', weight: 1 }])}
                            className="w-full py-4 rounded-xl border-2 border-[#00ff80] text-[#00ff80] font-bold text-xl hover:bg-[#00ff80] hover:text-black transition-all"
                        >
                            항목 추가
                        </button>
                        <button
                            onClick={startGame}
                            className="w-full py-6 rounded-xl bg-[#00ff80] text-black font-black text-2xl hover:bg-[#00cc66] shadow-[0_0_30px_rgba(0,255,128,0.4)] transition-all active:scale-[0.98]"
                        >
                            룰렛 시작
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Render: Game Mode ---
    const activeItems = store.activeRouletteItems;
    const totalActiveWeight = activeItems.reduce((sum, item) => sum + Number(item.weight), 0);
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1'];

    // Conic Gradient for Wheel
    const gradientString = (() => {
        let currentPercent = 0;
        const parts = activeItems.map((item, idx) => {
            const weightPercent = (Number(item.weight) / totalActiveWeight) * 100;
            const start = currentPercent;
            const end = currentPercent + weightPercent;
            currentPercent += weightPercent;
            return `${colors[idx % colors.length]} ${start}% ${end}%`;
        });
        return `conic-gradient(${parts.join(', ')})`;
    })();

    // Helper for Text Rotation
    const getSegmentRotation = (idx: number) => {
        let previousWeight = 0;
        for (let i = 0; i < idx; i++) previousWeight += Number(activeItems[i].weight);
        const myWeight = Number(activeItems[idx].weight);
        const startAngle = (previousWeight / totalActiveWeight) * 360;
        const wedgeAngle = (myWeight / totalActiveWeight) * 360;
        return startAngle + (wedgeAngle / 2);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-transparent animate-fadeIn relative">

            {/* Wheel Container */}
            <div className="relative w-[min(700px,85vw)] h-[min(700px,85vw)] mb-12 mt-8">

                {/* Red Pin Indicator - Fixed Top Right or Custom (Image: Looks like standard Top with style) */}
                {/* Using Standard Top for alignment with logic, but styled as red marker */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                    {/* Red Location Pin Shape */}
                    <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M30 0C13.4315 0 0 13.4315 0 30C0 52.5 30 80 30 80C30 80 60 52.5 60 30C60 13.4315 46.5685 0 30 0Z" fill="#EF4444" />
                        <circle cx="30" cy="30" r="12" fill="#991B1B" />
                    </svg>
                </div>

                {/* Outer Ring */}
                <div className="absolute inset-[-20px] rounded-full border-[20px] border-[#e5e5e5] shadow-xl"></div>

                {/* The Rotating Wheel */}
                <div
                    className="w-full h-full rounded-full border-[10px] border-[#333] relative overflow-hidden shadow-inner"
                    style={{
                        transform: `rotate(${store.rouletteRotation}deg)`,
                        transition: `transform ${store.isSpinning ? 4 : 0}s cubic-bezier(0.2, 0.8, 0.2, 1)`,
                    }}
                >
                    <div className="absolute inset-0" style={{ background: gradientString }}></div>

                    {/* Items Text */}
                    <div className="absolute inset-0">
                        {activeItems.map((item, idx) => {
                            const rotation = getSegmentRotation(idx);
                            const wedgeAngle = (Number(item.weight) / totalActiveWeight) * 360;
                            const showText = wedgeAngle > 10;

                            return (
                                <div
                                    key={idx}
                                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[50%] w-[40px] origin-bottom flex flex-col items-center pt-8 z-10 pointer-events-none"
                                    style={{ transform: `rotate(${rotation}deg)` }}
                                >
                                    {showText && (
                                        <span
                                            className="text-white font-black text-xl drop-shadow-md whitespace-nowrap tracking-wider max-w-[200px] truncate"
                                            style={{
                                                writingMode: 'vertical-rl',
                                                textOrientation: 'upright',
                                                letterSpacing: '0.1em'
                                                // Standard upright text looks good on straight rays
                                            }}
                                        >
                                            {/* If vertical looks bad, we can rotate(-90) */}
                                            <div style={{ transform: 'rotate(0deg)', writingMode: 'vertical-rl' }}>
                                                {item.name}
                                            </div>
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Controls - Hide in Overlay */}
            {mode === 'dashboard' && (
                <div className="flex gap-4 relative z-20">
                    <button
                        onClick={handleReset}
                        className="px-8 py-3 rounded-xl border border-[#00ff80] text-[#00ff80] font-bold text-lg hover:bg-[#00ff80] hover:text-black transition-all"
                        disabled={store.isSpinning}
                    >
                        항목 다시 설정하기
                    </button>
                    <button
                        onClick={store.spinRoulette}
                        disabled={store.isSpinning}
                        className="px-12 py-3 rounded-xl bg-[#00ff80] text-black font-black text-2xl shadow-[0_0_20px_rgba(0,255,128,0.4)] hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 transition-all"
                    >
                        돌려!
                    </button>
                </div>
            )}

            {/* Winner Overlay (Center) */}
            <AnimatePresence>
                {store.rouletteWinner && !store.isSpinning && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => useVoteStore.setState({ rouletteWinner: null })}
                    >
                        <div className="bg-[#1a1a1a] p-12 rounded-3xl border-2 border-[#00ff80] text-center shadow-2xl transform hover:scale-105 transition-all cursor-pointer">
                            <div className="text-[#00ff80] font-bold text-xl mb-4 tracking-widest">WINNER</div>
                            <div className="text-6xl font-black text-white drop-shadow-[0_0_30px_rgba(0,255,128,0.5)]">{store.rouletteWinner}</div>
                            <div className="mt-8 text-gray-500 text-sm">화면을 클릭하여 닫기</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
