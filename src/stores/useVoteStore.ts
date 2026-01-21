import { create } from 'zustand';

interface VoteState {
    socket: WebSocket | null;
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
    drawTimer: number;
    showDrawOverlay: boolean;
    drawSubsOnly: boolean;

    // Roulette
    rouletteItems: { name: string; weight: number }[];
    rouletteActiveItems: { name: string; weight: number }[];
    isSpinning: boolean;
    rouletteWinner: string | null;
    rouletteRotation: number;
    showRouletteOverlay: boolean;

    // Actions
    connect: (url: string, userId: string) => void;
    disconnect: () => void;
    send: (payload: any) => void;

    // Vote Commands
    startVote: (params: { title: string, mode: string, items: string[], duration: number, allowMulti: boolean, unit: number }) => void;
    endVote: () => void;
    stopVote: () => void;
    toggleVoteOverlay: (show: boolean) => void;

    // Draw Commands
    startDrawRecruit: (params: { keyword: string, subsOnly: boolean, duration: number }) => void;
    pickDrawWinner: (count: number) => void;
    stopDraw: () => void;
    toggleDrawOverlay: (show: boolean) => void;

    // Roulette Commands
    updateRouletteItems: (items: any[]) => void;
    spinRoulette: () => void;
    resetRoulette: () => void;
    resetRouletteState: () => void;
    toggleRouletteOverlay: (show: boolean) => void;
}

export const useVoteStore = create<VoteState>((set, get) => ({
    socket: null,
    isConnected: false,

    voteId: null, voteTitle: '', voteItems: [], voteStatus: 'idle', voteMode: 'numeric', voteTimer: 0, allowMultiVote: false, showVoteOverlay: false, voteUnit: 1000,
    drawSessionId: null, drawStatus: 'idle', drawKeyword: '!참여', drawCandidates: [], drawWinner: null, drawTimer: 0, showDrawOverlay: false, drawSubsOnly: false,
    rouletteItems: [], rouletteActiveItems: [], isSpinning: false, rouletteWinner: null, rouletteRotation: 0, showRouletteOverlay: false,

    connect: (url: string, userId: string) => {
        if (get().socket) return;

        console.log('Connecting to WebSocket:', url);
        const socket = new WebSocket(url);

        socket.onopen = () => {
            console.log('VoteStore Connected');
            set({ isConnected: true });
            // Auth
            socket.send(JSON.stringify({ type: 'auth', userId }));
        };

        socket.onclose = () => {
            console.log('VoteStore Disconnected');
            set({ isConnected: false, socket: null });
        };

        socket.onerror = (err) => {
            console.error('WebSocket Error:', err);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Server sends "broadcast" wrapped in { type, payload } usually? 
                // broadcastToUser sends raw JSON. 
                // VoteManager.broadcast calls bot.broadcast('voteSync', states).
                // Index.ts sends JSON.stringify({ type: 'voteSync', payload: states }).

                if (data.type === 'voteSync') {
                    const payload = data.payload;
                    // payload = { vote, draw, roulette }
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
                            drawTimer: payload.draw.timer,
                            showDrawOverlay: payload.draw.showOverlay,
                            drawSubsOnly: payload.draw.subsOnly
                        });
                    }
                    if (payload.roulette) {
                        set({
                            rouletteItems: payload.roulette.items,
                            // If backend has activeItems, use it? Backend logic assumes snapshot.
                            rouletteActiveItems: payload.roulette.activeItems || [],
                            isSpinning: payload.roulette.isSpinning,
                            rouletteWinner: payload.roulette.winner,
                            rouletteRotation: payload.roulette.rotation,
                            showRouletteOverlay: payload.roulette.showOverlay,
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to parse WS message:', e);
            }
        };

        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.close();
            set({ socket: null, isConnected: false });
        }
    },

    send: (payload: any) => {
        const { socket } = get();
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
        }
    },

    startVote: (params) => get().send({ type: 'startVote', ...params }),
    endVote: () => get().send({ type: 'endVote' }),
    stopVote: () => get().send({ type: 'stopVote' }),
    toggleVoteOverlay: (show) => get().send({ type: 'toggleVoteOverlay', show }),

    startDrawRecruit: (params) => get().send({ type: 'startDrawRecruit', ...params }),
    pickDrawWinner: (count) => get().send({ type: 'pickDrawWinner', count }),
    stopDraw: () => get().send({ type: 'stopDraw' }),
    toggleDrawOverlay: (show) => get().send({ type: 'toggleDrawOverlay', show }),

    updateRouletteItems: (items) => get().send({ type: 'updateRoulette', items }),
    spinRoulette: () => get().send({ type: 'spinRoulette' }),
    resetRoulette: () => get().send({ type: 'resetRoulette' }),
    resetRouletteState: () => set({ rouletteWinner: null }),
    toggleRouletteOverlay: (show) => get().send({ type: 'toggleRouletteOverlay', show }),
}));
