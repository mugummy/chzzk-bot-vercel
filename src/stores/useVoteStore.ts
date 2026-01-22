import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface VoteState {
    isConnected: boolean;
    channelId: string;
    appMode: 'dashboard' | 'overlay';
    socket: Socket | null;

    currentTab: 'draw' | 'vote' | 'donate' | 'roulette' | 'settings';
    isTestMode: boolean;

    // Overlay Visibility
    showDrawOverlay: boolean;
    showVoteOverlay: boolean;
    showRouletteOverlay: boolean;

    // Draw
    isRecruiting: boolean;
    drawStatus: 'idle' | 'recruiting' | 'picking' | 'ended';
    drawTimer: number;
    drawTimerDuration: number;
    useDrawTimer: boolean;
    drawSubsOnly: boolean;
    excludeWinners: boolean;
    previousWinners: string[];
    drawKeyword: string;
    drawCandidates: { name: string; role: string; lastMessage: string }[];
    drawWinner: any | null;
    drawTarget: any | null;

    // Vote
    voteItems: { id: number; name: string; count: number; voters: any[] }[];
    selectedVoteItem: any | null;
    voteTitle: string;
    voteWinner: any | null;
    voteTarget: any | null;
    voteStatus: 'idle' | 'active' | 'picking' | 'ended';
    voteMode: 'numeric' | 'donation';
    voteTimer: number;
    voteTimerDuration: number;
    useVoteTimer: boolean;
    allowMultiVote: boolean;
    voteUnit: number;
    isVoteSubsOnly: boolean;
    voteExcludeWinners: boolean;
    isAutoSort: boolean;
    includeZeroVotes: boolean;

    // Roulette
    rouletteItems: { name: string; weight: number }[];
    activeRouletteItems: { name: string; weight: number }[];
    isRouletteGenerated: boolean;
    isSpinning: boolean;
    rouletteWinner: string | null;
    rouletteRotation: number;
    rouletteTransition: string;

    // Chat Policy / TTS / Overlay Settings
    winnerChatLog: { text: string; time: number }[];
    isWinnerChatActive: boolean;
    useTTS: boolean;
    ttsVolume: number;
    ttsRate: number;
    ttsVoice: string;
    overlaySettings: {
        chromaKey: string;
        opacity: number;
        showTimer: boolean;
        enableTTS: boolean;
        theme: string;
        accentColor: string;
        scale: number;
    };

    // Actions
    connect: (cid: string, mode?: 'dashboard' | 'overlay') => void;
    disconnect: () => void;
    send: (msg: any) => void;
    setSendFn: (fn: any) => void; // Legacy support if needed, but we use socket direct here
    getStateSnapshot: () => any;
    applyStateSnapshot: (state: any) => void;
    handleSync: (state: any) => void;
    handleChat: (chat: any) => void;
    handleDonation: (donation: any) => void;

    // Draw Actions
    startDrawRecruit: (opts: { keyword?: string; subsOnly?: boolean; duration?: number }) => void;
    stopDraw: () => void;
    resetDraw: () => void;
    pickDrawWinner: (count?: number) => void;
    undoLastWinner: () => void;

    // Vote Actions
    startVote: (opts: { title: string; mode: 'numeric' | 'donation'; items: string[]; duration?: number; allowMulti: boolean; unit?: number }) => void;
    endVote: () => void;
    stopVote: () => void;
    resetVote: () => void;
    pickVoteWinner: (itemId: number) => void;
    transferVotesToRoulette: () => void;

    // Roulette Actions
    updateRouletteItems: (items: { name: string; weight: number }[]) => void;
    resetRoulette: () => void;
    spinRoulette: () => void;

    // Settings Actions
    updateTTSSettings: (settings: { volume: number; rate: number; voice: string; enabled: boolean }) => void;
    updateOverlaySettings: (settings: any) => void;
}

export const useVoteStore = create<VoteState>((set, get) => {

    // Helper: Emit Sync
    const emitSync = () => {
        const { socket, appMode, getStateSnapshot } = get();
        if (appMode === 'overlay') return;
        if (socket && socket.connected) {
            socket.emit('sync-state', getStateSnapshot());
        }
    };

    // Helper: Speak TTS
    const speakTTS = (text: string) => {
        const { useTTS, ttsVolume, ttsRate, ttsVoice } = get();
        if (!useTTS || !text || typeof window === 'undefined') return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = ttsVolume;
        utterance.rate = ttsRate;

        if (ttsVoice) {
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.name === ttsVoice);
            if (voice) utterance.voice = voice;
        }
        window.speechSynthesis.speak(utterance);
    };

    return {
        // Initial State
        isConnected: false,
        channelId: '',
        appMode: 'dashboard',
        socket: null,
        currentTab: 'draw',
        isTestMode: false,

        showDrawOverlay: false,
        showVoteOverlay: false,
        showRouletteOverlay: false,

        isRecruiting: false,
        drawStatus: 'idle',
        drawTimer: 60,
        drawTimerDuration: 60,
        useDrawTimer: true,
        drawSubsOnly: false,
        excludeWinners: true,
        previousWinners: [],
        drawKeyword: '!참여',
        drawCandidates: [],
        drawWinner: null,
        drawTarget: null,

        voteItems: [],
        selectedVoteItem: null,
        voteTitle: '',
        voteWinner: null,
        voteTarget: null,
        voteStatus: 'idle',
        voteMode: 'numeric',
        voteTimer: 60,
        voteTimerDuration: 60,
        useVoteTimer: true,
        allowMultiVote: true,
        voteUnit: 1000,
        isVoteSubsOnly: false,
        voteExcludeWinners: true,
        isAutoSort: true,
        includeZeroVotes: false,

        rouletteItems: [
            { name: '꽝', weight: 30 },
            { name: '문화상품권', weight: 10 },
            { name: '한번 더', weight: 20 },
            { name: '치킨 기프티콘', weight: 5 },
            { name: '방종권', weight: 1 }
        ],
        activeRouletteItems: [],
        isRouletteGenerated: false,
        isSpinning: false,
        rouletteWinner: null,
        rouletteRotation: 0,
        rouletteTransition: 'none',

        winnerChatLog: [],
        isWinnerChatActive: false,
        useTTS: true,
        ttsVolume: 1.0,
        ttsRate: 1.0,
        ttsVoice: '',
        overlaySettings: {
            chromaKey: 'transparent',
            opacity: 0.9,
            showTimer: true,
            enableTTS: false,
            theme: 'basic',
            accentColor: '#10b981',
            scale: 1.0
        },

        // Implementations

        setSendFn: () => { }, // No-op now

        getStateSnapshot: () => {
            const s = get();
            return {
                currentTab: s.currentTab,
                showDrawOverlay: s.showDrawOverlay,
                showVoteOverlay: s.showVoteOverlay,
                showRouletteOverlay: s.showRouletteOverlay,
                isRecruiting: s.isRecruiting,
                drawStatus: s.drawStatus,
                drawTimer: s.drawTimer,
                drawCandidates: s.drawCandidates,
                drawWinner: s.drawWinner,
                voteStatus: s.voteStatus,
                voteItems: s.voteItems,
                voteWinner: s.voteWinner,
                rouletteItems: s.rouletteItems,
                rouletteWinner: s.rouletteWinner,
                isSpinning: s.isSpinning,
                winnerChatLog: s.winnerChatLog,
                isWinnerChatActive: s.isWinnerChatActive,
                overlaySettings: s.overlaySettings
            };
        },

        applyStateSnapshot: (state) => set(state),
        handleSync: (state) => set(state),

        connect: (cid, mode = 'dashboard') => {
            if (get().socket) get().socket?.disconnect();

            const socket = io('http://localhost:3000');
            set({ channelId: cid, appMode: mode, socket });

            socket.on('connect', () => {
                if (mode === 'dashboard') {
                    socket.emit('connect-channel', cid);
                    socket.on('request-sync', () => emitSync());
                } else {
                    socket.emit('request-sync');
                }
            });

            socket.on('status', (data: any) => set({ isConnected: data.connected }));
            socket.on('chat', (chat: any) => get().handleChat(chat));
            socket.on('donation', (d: any) => get().handleDonation(d));
            socket.on('sync-state', (s: any) => {
                if (get().appMode === 'overlay') set(s);
            });
        },

        disconnect: () => {
            get().socket?.disconnect();
            set({ socket: null, isConnected: false });
        },

        send: (msg) => {
            const state = get();

            // Handle Legacy/VoteTab generic sends
            if (msg.type === 'updateDraw') {
                const updates: any = {};
                if (msg.keyword !== undefined) updates.drawKeyword = msg.keyword;
                if (msg.subsOnly !== undefined) updates.drawSubsOnly = msg.subsOnly;
                if (msg.excludeWinners !== undefined) updates.excludeWinners = msg.excludeWinners;
                set(updates);
                state.socket?.emit('sync-state', get().getStateSnapshot());
            }
            else if (msg.type === 'updateVoteSettings') {
                const updates: any = {};
                if (msg.title !== undefined) updates.voteTitle = msg.title;
                set(updates);
                state.socket?.emit('sync-state', get().getStateSnapshot());
            }
            else if (msg.type === 'pickVoteWinner') {
                // Bridge for VoteTab calling send({type:'pickVoteWinner'...})
                get().pickVoteWinner(msg.itemId);
            }
        },

        handleChat: (chat) => {
            const state = get();
            if (state.appMode === 'overlay') return;

            const msg = (chat.message || '').trim();
            const profile = chat.profile || {};
            const userRole = profile.userRole || '';
            let role = '팬';
            if (userRole === 'streaming_channel_owner' || userRole === 'owner') role = '계정주';
            else if (userRole === 'streaming_channel_manager' || userRole === 'manager') role = '매니저';
            else if (chat.extras?.isSubscriber || profile.isSubscriber) role = '구독자';

            // 1. Winner Chat Log
            if (state.isWinnerChatActive) {
                const currentWinner = state.drawWinner || state.voteWinner;
                const winnerName = currentWinner?.name || currentWinner?.nickname;

                if (winnerName && winnerName === profile.nickname) {
                    const newLog = [...state.winnerChatLog, { text: msg, time: Date.now() }];
                    set({ winnerChatLog: newLog });
                    emitSync();
                    speakTTS(msg);
                    return;
                }
            }

            // 2. Draw Recruitment
            if (state.drawStatus === 'recruiting') {
                if (state.drawKeyword && !msg.startsWith(state.drawKeyword)) return;
                if (state.drawSubsOnly && role !== '구독자' && role !== '계정주') return;

                const exists = state.drawCandidates.find(p => p.name === profile.nickname);
                if (!exists) {
                    const newCandidates = [...state.drawCandidates, { name: profile.nickname, role, lastMessage: msg }];
                    set({ drawCandidates: newCandidates });
                    emitSync();
                }
            }

            // 3. Numeric Vote
            if (state.voteStatus === 'active' && state.voteMode === 'numeric' && msg.startsWith('!투표')) {
                const num = parseInt(msg.replace('!투표', '').trim());
                if (!isNaN(num)) {
                    const items = [...state.voteItems];
                    const item = items.find(v => v.id === num);
                    if (item) {
                        // Check Multi
                        const alreadyVoted = items.some(v => v.voters.some((p: any) => p.name === profile.nickname));
                        if (!state.allowMultiVote && alreadyVoted) return;

                        item.count++;
                        item.voters.push({ name: profile.nickname, role, lastMessage: msg });
                        set({ voteItems: items });
                        emitSync();
                    }
                }
            }
        },

        handleDonation: (donation) => {
            const state = get();
            if (state.appMode === 'overlay' || state.voteStatus !== 'active' || state.voteMode !== 'donation') return;

            const msg = (donation.message || '').trim();
            const amount = donation.extras?.payAmount || 0;
            const votes = Math.floor(amount / state.voteUnit);
            const match = msg.match(/^!투표\s*(\d+)/);

            if (votes >= 1 && match) {
                const num = parseInt(match[1]);
                const items = [...state.voteItems];
                const item = items.find(v => v.id === num);
                if (item) {
                    const nickname = donation.profile?.nickname || 'Anonymous';
                    if (!state.allowMultiVote) {
                        const alreadyVoted = items.some(v => v.voters.some((p: any) => p.name === nickname));
                        if (alreadyVoted) return;
                    }
                    item.count += votes;
                    for (let i = 0; i < votes; i++) item.voters.push({ name: nickname, role: '팬', lastMessage: msg });
                    set({ voteItems: items });
                    emitSync();
                }
            }
        },

        startDrawRecruit: (opts) => {
            set({
                isRecruiting: true,
                drawStatus: 'recruiting',
                drawKeyword: opts.keyword || '!참여',
                drawSubsOnly: opts.subsOnly || false,
                drawTimer: opts.duration || 60,
                drawTimerDuration: opts.duration || 60,
                showDrawOverlay: true,
                showVoteOverlay: false,
                showRouletteOverlay: false,
                drawCandidates: [],
                drawWinner: null,
                winnerChatLog: [],
                isWinnerChatActive: false
            });
            emitSync();
        },
        stopDraw: () => {
            set({ isRecruiting: false, drawStatus: 'idle' });
            emitSync();
        },
        resetDraw: () => {
            set({ drawCandidates: [], drawWinner: null, drawStatus: 'idle', isRecruiting: false, winnerChatLog: [], isWinnerChatActive: false });
            emitSync();
        },
        pickDrawWinner: (count = 1) => {
            const { drawCandidates, drawSubsOnly, excludeWinners, previousWinners, isTestMode } = get();
            let pool = [...drawCandidates];
            if (drawSubsOnly) pool = pool.filter(p => p.role === '구독자' || p.role === '계정주');
            if (excludeWinners && previousWinners.length > 0) pool = pool.filter(p => !previousWinners.includes(p.name));
            if (pool.length === 0 && isTestMode) pool = [{ name: 'Test1', role: '팬', lastMessage: 'hi' }, { name: 'Test2', role: '구독자', lastMessage: 'hello' }];

            if (pool.length === 0) return alert('추첨 대상이 없습니다.');

            const winner = pool[Math.floor(Math.random() * pool.length)];
            set({ drawStatus: 'picking', drawTarget: winner, drawWinner: null, isWinnerChatActive: false, winnerChatLog: [] });
            emitSync();

            setTimeout(() => {
                set({
                    drawStatus: 'ended',
                    drawWinner: winner,
                    isWinnerChatActive: true,
                    previousWinners: [...previousWinners, winner.name]
                });
                emitSync();
            }, 3000);
        },
        undoLastWinner: () => {
            const { previousWinners } = get();
            if (previousWinners.length > 0) {
                const newWinners = [...previousWinners];
                newWinners.pop();
                set({ previousWinners: newWinners, drawWinner: null, drawStatus: 'idle' });
                emitSync();
            }
        },

        startVote: (opts) => {
            set({
                voteStatus: 'active',
                voteTitle: opts.title,
                voteMode: opts.mode,
                voteItems: opts.items.map((name, i) => ({ id: i + 1, name, count: 0, voters: [] })),
                voteTimer: opts.duration || 60,
                allowMultiVote: opts.allowMulti,
                voteUnit: opts.unit || 1000,
                showVoteOverlay: true,
                showDrawOverlay: false,
                showRouletteOverlay: false,
                voteWinner: null,
                winnerChatLog: [],
                isWinnerChatActive: false
            });
            emitSync();
        },
        endVote: () => { set({ voteStatus: 'ended' }); emitSync(); },
        stopVote: () => { set({ voteStatus: 'idle' }); emitSync(); }, // Reset to idle
        resetVote: () => { set({ voteStatus: 'idle', voteItems: [], voteWinner: null, winnerChatLog: [], isWinnerChatActive: false }); emitSync(); },
        pickVoteWinner: (itemId) => {
            const { voteItems, isVoteSubsOnly } = get();
            const item = voteItems.find(v => v.id === itemId);
            if (!item || item.voters.length === 0) return alert('참여자가 없습니다.');

            let candidates = item.voters;
            if (isVoteSubsOnly) candidates = candidates.filter((v: any) => v.role === '구독자');
            if (candidates.length === 0) return alert('대상자가 없습니다.');

            const winner = candidates[Math.floor(Math.random() * candidates.length)];
            set({ voteStatus: 'picking', voteTarget: winner, voteWinner: null, winnerChatLog: [], isWinnerChatActive: false });
            emitSync();

            setTimeout(() => {
                set({ voteStatus: 'ended', voteWinner: winner, isWinnerChatActive: true });
                emitSync();
            }, 3000);
        },
        transferVotesToRoulette: () => {
            const { voteItems, includeZeroVotes } = get();
            const items = voteItems.map(i => {
                let w = i.count;
                if (includeZeroVotes && w === 0) w = 1;
                return { name: i.name, weight: w };
            }).filter(i => i.weight > 0);

            if (items.length < 2) return alert('항목 부족 (최소 2개)');

            set({
                rouletteItems: items,
                currentTab: 'roulette',
                showRouletteOverlay: true,
                showDrawOverlay: false,
                showVoteOverlay: false
            });
            emitSync();
        },

        updateRouletteItems: (items) => { set({ rouletteItems: items }); emitSync(); },
        resetRoulette: () => { set({ rouletteWinner: null, isSpinning: false, isRouletteGenerated: false }); emitSync(); },
        spinRoulette: () => {
            const { rouletteItems } = get();
            if (rouletteItems.length < 2) return alert('항목 부족');
            set({ isSpinning: true, rouletteWinner: null, showRouletteOverlay: true });
            emitSync();

            const total = rouletteItems.reduce((a, b) => a + b.weight, 0);
            let r = Math.random() * total;
            let winner = rouletteItems[0].name;
            for (let i = 0; i < rouletteItems.length; i++) {
                r -= rouletteItems[i].weight;
                if (r <= 0) { winner = rouletteItems[i].name; break; }
            }

            // Simple Timeout for Spin
            setTimeout(() => {
                set({ isSpinning: false, rouletteWinner: winner });
                emitSync();
            }, 4000);
        },

        updateTTSSettings: (s) => {
            set({ ttsVolume: s.volume, ttsRate: s.rate, ttsVoice: s.voice, useTTS: s.enabled });
            emitSync();
        },
        updateOverlaySettings: (s) => {
            set({ overlaySettings: s });
            emitSync();
        }
    };
});
