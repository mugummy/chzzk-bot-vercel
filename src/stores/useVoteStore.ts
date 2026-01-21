import { create } from 'zustand';

interface VoteState {
    isConnected: boolean;

    // Vote
    voteId: string | null;
    voteTitle: string;
    voteItems: { id: number; name: string; count: number; voters: any[] }[];
    voteStatus: 'idle' | 'active' | 'ended';
    voteMode: 'numeric' | 'donation';
    voteTimer: number; // in seconds
    allowMultiVote: boolean;
    showVoteOverlay: boolean;
    voteUnit: number;

    // Draw (Viewer Pickup)
    drawSessionId: string | null;
    drawStatus: 'idle' | 'recruiting' | 'picking' | 'ended';
    drawKeyword: string;
    drawCandidates: { name: string; role: string; lastMessage: string }[];
    drawWinner: any | null;
    previousWinners: string[];
    drawTimer: number;
    showDrawOverlay: boolean;
    drawSubsOnly: boolean;

    // Roulette
    rouletteItems: { name: string; weight: number }[];
    rouletteActiveItems: { name: string; weight: number }[];
    isSpinning: boolean;
    rouletteWinner: string | null;
    rouletteRotation: number;
    rouletteTransition: string;
    showRouletteOverlay: boolean;

    // Actions
    connect: (url: string, userId: string) => void;
    disconnect: () => void;
    send: (payload: any) => void;

    // Shared Connection Support
    sendFn: ((payload: any) => void) | null;
    setSendFn: (fn: (payload: any) => void) => void;
    handleSync: (payload: any) => void;

    // Vote Commands
    startVote: (params: { title: string, mode: string, items: string[], duration: number, allowMulti: boolean, unit: number }) => void;
    endVote: () => void;
    stopVote: () => void;
    toggleVoteOverlay: (show: boolean) => void;
    resetVote: () => void;
    transferVotesToRoulette: () => void;

    // Draw Commands
    startDrawRecruit: (params: { keyword: string, subsOnly: boolean, duration: number }) => void;
    pickDrawWinner: (count: number) => void;
    undoLastWinner: () => void;
    stopDraw: () => void;
    toggleDrawOverlay: (show: boolean) => void;
    resetDraw: () => void;

    // Roulette Commands
    updateRouletteItems: (items: any[]) => void;
    spinRoulette: () => void;
    resetRoulette: () => void;
    resetRouletteState: () => void;
    toggleRouletteOverlay: (show: boolean) => void;
}

export const useVoteStore = create<VoteState>((set, get) => ({
    isConnected: false,
    sendFn: null,

    voteId: null, voteTitle: '', voteItems: [], voteStatus: 'idle', voteMode: 'numeric', voteTimer: 0, allowMultiVote: false, showVoteOverlay: false, voteUnit: 1000,
    drawSessionId: null, drawStatus: 'idle', drawKeyword: '!참여', drawCandidates: [], drawWinner: null, previousWinners: [], drawTimer: 0, showDrawOverlay: false, drawSubsOnly: false,
    rouletteItems: [], rouletteActiveItems: [], isSpinning: false, rouletteWinner: null, rouletteRotation: 0, rouletteTransition: 'none', showRouletteOverlay: false,

    setSendFn: (fn) => set({ sendFn: fn }),

    handleSync: (payload: any) => {
        if (payload.vote) {
            set({
                voteId: payload.vote.voteId,
                voteTitle: payload.vote.title,
                voteItems: payload.vote.items,
                voteStatus: payload.vote.status,
                voteMode: payload.vote.mode,
                voteTimer: payload.vote.timer,
                allowMultiVote: payload.vote.allowMultiVote,
                showVoteOverlay: payload.vote.showOverlay,
                voteUnit: payload.vote.voteUnit
            });
        }
        if (payload.draw) {
            set({
                drawSessionId: payload.draw.sessionId,
                drawStatus: payload.draw.status,
                drawKeyword: payload.draw.keyword,
                drawCandidates: payload.draw.candidates,
                drawWinner: payload.draw.winner,
                previousWinners: payload.draw.previousWinners || [],
                drawTimer: payload.draw.timer,
                showDrawOverlay: payload.draw.showOverlay,
                drawSubsOnly: payload.draw.subsOnly
            });
        }
        if (payload.roulette) {
            set({
                rouletteItems: payload.roulette.items,
                rouletteActiveItems: payload.roulette.activeItems || [],
                isSpinning: payload.roulette.isSpinning,
                rouletteWinner: payload.roulette.winner,
                rouletteRotation: payload.roulette.rotation,
                rouletteTransition: payload.roulette.transition,
                showRouletteOverlay: payload.roulette.showOverlay,
            });
        }
    },

    connect: () => { }, // Handled by BotInstance/DashboardPage usually
    disconnect: () => { },

    send: (payload: any) => {
        // 1. Prefer External Handler (Dashboard)
        const { sendFn } = get();
        if (sendFn) {
            sendFn(payload);
            return;
        }
    },

    startVote: (params) => get().send({ type: 'startVote', ...params }),
    endVote: () => get().send({ type: 'endVote' }),
    stopVote: () => get().send({ type: 'stopVote' }),
    toggleVoteOverlay: (show) => get().send({ type: 'toggleVoteOverlay', show }),
    resetVote: () => get().send({ type: 'resetVote' }),
    transferVotesToRoulette: () => get().send({ type: 'transferVotesToRoulette' }),

    startDrawRecruit: (params) => get().send({ type: 'startDrawRecruit', ...params }),
    pickDrawWinner: (count) => get().send({ type: 'pickDrawWinner', count }),
    undoLastWinner: () => get().send({ type: 'undoLastWinner' }),
    stopDraw: () => get().send({ type: 'stopDraw' }),
    toggleDrawOverlay: (show) => get().send({ type: 'toggleDrawOverlay', show }),
    resetDraw: () => get().send({ type: 'resetDraw' }),

    updateRouletteItems: (items) => get().send({ type: 'updateRoulette', items }),
    spinRoulette: () => get().send({ type: 'spinRoulette' }),
    resetRoulette: () => get().send({ type: 'resetRoulette' }),
    resetRouletteState: () => set({ rouletteWinner: null }),
    toggleRouletteOverlay: (show) => get().send({ type: 'toggleRouletteOverlay', show }),
}));
