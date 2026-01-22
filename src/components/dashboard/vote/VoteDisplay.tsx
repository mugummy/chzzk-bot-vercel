'use client';

import React from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import { motion, AnimatePresence } from 'framer-motion';

interface VoteDisplayProps {
    mode: 'dashboard' | 'overlay';
    showControls?: boolean;
}

export default function VoteDisplay({ mode, showControls = true }: VoteDisplayProps) {
    const store = useVoteStore();

    const sortedItems = React.useMemo(() => {
        let items = [...store.voteItems];
        // Overlay keeps original order usually
        if (mode === 'overlay') return items;

        // Dashboard: Always show all items (legacy parity)
        // Only sort if enabled
        if (mode === 'dashboard' && store.isAutoSort) {
            items.sort((a, b) => b.count - a.count);
        }
        return items;
    }, [store.voteItems, store.isAutoSort, mode]);

    const totalVotes = store.voteItems.reduce((sum, item) => sum + item.count, 0);

    return (
        <div className={`flex flex-col h-full w-full p-2 ${mode === 'overlay' ? 'gap-4' : 'gap-3'}`}>
            {mode === 'dashboard' && store.voteTitle && (
                <div className="shrink-0 mb-2 px-2 pb-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white text-center">{store.voteTitle}</h2>
                </div>
            )}

            {mode === 'overlay' && store.voteStatus !== 'active' && (
                <div className="shrink-0 mb-2 mx-1 bg-red-600/90 text-white font-black text-3xl text-center py-4 rounded-xl border-2 border-white/20 shadow-[0_0_30px_rgba(255,0,0,0.5)] animate-pulse">
                    ⛔ 투표 마감 (CLOSED)
                </div>
            )}

            <div className={`flex-1 overflow-y-auto pr-2 custom-scroll ${mode === 'overlay' ? 'space-y-4' : 'space-y-3'}`}>
                <AnimatePresence>
                    {sortedItems.map((item, idx) => {
                        const percent = totalVotes ? (item.count / totalVotes) * 100 : 0;
                        return (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
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
                                        <span className={`font-black text-white leading-none truncate max-w-[300px] ${mode === 'overlay' ? 'text-4xl drop-shadow-md' : 'text-2xl'}`}>
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

            {mode === 'overlay' && !showControls && (
                <div className="text-center mt-2">
                    <div className="inline-block px-8 py-3 rounded-full bg-black/60 border border-white/10 backdrop-blur-md shadow-xl">
                        <span className="text-gray-300 font-bold text-xl mr-3 tracking-widest">TOTAL</span>
                        <span className="text-[#00ff80] font-black text-3xl">{totalVotes}</span>
                    </div>
                </div>
            )}
            {/* Dashboard Total Footer (Legacy Style) */}
            {!showControls && mode === 'dashboard' && (
                <div className="text-center mt-2 border-t border-white/5 pt-2">
                    <span className="text-gray-500 font-bold">Total: <span className="text-white">{totalVotes}</span></span>
                </div>
            )}
        </div>
    );
}
