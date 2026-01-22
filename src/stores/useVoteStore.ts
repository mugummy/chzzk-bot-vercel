import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface VoteItem {
    id: number;
    name: string;
    count: number;
    percent?: number;
    voters: any[];
}

interface RouletteItem {
    name: string;
    weight: number;
}

interface User {
    name: string;
    role: string;
    lastMessage?: string;
}

interface VoteState {
    // Connection
    isConnected: boolean;
    channelId: string | null;
    socket: Socket | null;
    isTestMode: boolean;

    // Tab State (Synced if possible, but mainly local for now)
    currentTab: 'draw' | 'vote' | 'donate' | 'roulette' | 'settings';

    // Draw State
    drawStatus: 'idle' | 'recruiting' | 'picking';
    drawCandidates: User[];
    drawKeyword: string;
    useDrawCommand: boolean;
    drawSubsOnly: boolean;
    excludeWinners: boolean;
    drawTimer: number;
    drawTimerDuration: number;
    useDrawTimer: boolean;
    drawWinner: User | null;
    previousWinners: string[];

    // Vote State
    voteStatus: 'idle' | 'active' | 'ended';
    voteTitle: string;
    voteItems: VoteItem[];
    voteMode: 'numeric' | 'donation';
    voteTimer: number;
    voteTimerDuration: number;
    useVoteTimer: boolean;
    allowMultiVote: boolean;
    voteUnit: number; // Donation unit
    isAutoSort: boolean;
    includeZeroVotes: boolean;
    voteWinner: User | null;
    voteExcludeWinners: boolean;
    isVoteSubsOnly: boolean;

    // Roulette State
    rouletteItems: RouletteItem[]; // Setup items
    activeRouletteItems: RouletteItem[]; // Items used for spinning
    isSpinning: boolean;
    rouletteWinner: string | null;
    rouletteRotation: number;
    rouletteTransition: string;

    // Overlay Visibility
    showDrawOverlay: boolean;
    showVoteOverlay: boolean;
    showRouletteOverlay: boolean;

    // TTS & Overlay Settings (Mirrored from LocalStorage or Server in future)
    ttsVolume: number;
    ttsRate: number;
    ttsVoice: string;
    useTTS: boolean;

    // Actions
    connect: (channelId: string) => void;
    disconnect: () => void;
    send: (event: any) => void; // Generic send if needed

    // Draw Actions
    startDrawRecruit: (options: { keyword?: string; subsOnly?: boolean; duration?: number }) => void;
    stopDraw: () => void;
    pickDrawWinner: (count: number) => void;
    resetDraw: () => void;
    undoLastWinner: () => void;

    // Vote Actions
    startVote: (options: { title: string; mode: 'numeric' | 'donation'; items: string[] | VoteItem[]; duration: number; allowMulti: boolean; unit: number }) => void;
    endVote: () => void;
    pickVoteWinner: (itemId: number) => void;
    resetVote: () => void;

    // Roulette Actions
    updateRouletteItems: (items: RouletteItem[]) => void;
    transferVotesToRoulette: () => void;
    spinRoulette: () => void;
    resetRoulette: () => void;

    // Settings
    updateTTSSettings: (settings: { volume: number; rate: number; voice: string; enabled: boolean }) => void;
    updateOverlaySettings: (settings: any) => void;

    // Bridge to Dashboard Socket
    sendFn: ((msg: any) => void) | null;
    handleSync: (payload: any) => void;
    setSendFn: (fn: (msg: any) => void) => void;

    // External Event Handlers (called by Dashboard)
    onChat: (msg: any) => void;
    onDonation: (donation: any) => void;
}

export const useVoteStore = create<VoteState>((set, get) => ({
    isConnected: false,
    channelId: null,
    socket: null,
    isTestMode: false,
    currentTab: 'draw',

    // Defaults
    drawStatus: 'idle',
    drawCandidates: [],
    drawKeyword: '!참여',
    useDrawCommand: true,
    drawSubsOnly: false,
    excludeWinners: false,
    drawTimer: 60,
    drawTimerDuration: 60,
    useDrawTimer: false,
    drawWinner: null,
    previousWinners: [],

    voteStatus: 'idle',
    voteTitle: '',
    voteItems: [],
    voteMode: 'numeric',
    voteTimer: 60,
    voteTimerDuration: 60,
    useVoteTimer: true,
    allowMultiVote: true,
    voteUnit: 1000,
    isAutoSort: true,
    includeZeroVotes: true,
    voteWinner: null,
    voteExcludeWinners: false,
    isVoteSubsOnly: false,

    rouletteItems: [],
    activeRouletteItems: [],
    isSpinning: false,
    rouletteWinner: null,
    rouletteRotation: 0,
    rouletteTransition: 'none',

    showDrawOverlay: true, // Default to true or specific logic
    showVoteOverlay: false,
    showRouletteOverlay: false,

    ttsVolume: 1.0,
    ttsRate: 1.0,
    ttsVoice: '',
    useTTS: true,

    connect: (channelId: string) => {
        if (get().socket) get().socket?.disconnect();

        // Ensure to remove any whitespace from channelId
        const cid = channelId.trim();
        if (!cid) return;

        const socket = io('http://localhost:3000'); // Connect to local server

        socket.on('connect', () => {
            console.log('Connected to server');
            socket.emit('connect-channel', cid);
            set({ isConnected: true, channelId: cid });
        });

        socket.on('chat', (message: any) => {
            handleChat(set, get, message);
        });

        socket.on('donation', (donation: any) => {
            handleDonation(set, get, donation);
        });

        socket.on('disconnect', () => {
            set({ isConnected: false });
        });

        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) socket.disconnect();
        set({ isConnected: false, socket: null });
    },

    send: (event: any) => {
        // Use bridge if available
        const s = get();
        if (s.sendFn) s.sendFn(event);

        // Generic state updates sent from UI that might need handling
        // For now, update local state
        if (event.type === 'updateDraw') {
            set(state => ({
                ...state,
                drawKeyword: event.keyword !== undefined ? event.keyword : state.drawKeyword,
                useDrawCommand: event.useCommand !== undefined ? event.useCommand : state.useDrawCommand,
                drawSubsOnly: event.subsOnly !== undefined ? event.subsOnly : state.drawSubsOnly,
                excludeWinners: event.excludeWinners !== undefined ? event.excludeWinners : state.excludeWinners
            }));
        }
        if (event.type === 'updateVoteSettings') {
            set(state => ({
                ...state,
                voteTitle: event.title !== undefined ? event.title : state.voteTitle,
                isAutoSort: event.autoSort !== undefined ? event.autoSort : state.isAutoSort,
                includeZeroVotes: event.includeZeroVotes !== undefined ? event.includeZeroVotes : state.includeZeroVotes,
                allowMultiVote: event.allowMulti !== undefined ? event.allowMulti : state.allowMultiVote
            }));
        }
    },

    startDrawRecruit: (options) => {
        set({
            drawStatus: 'recruiting',
            drawCandidates: [],
            drawWinner: null,
            drawKeyword: options.keyword || '!참여',
            drawSubsOnly: !!options.subsOnly,
            drawTimer: options.duration || 60,
            useDrawTimer: !!options.duration // Enable timer if duration provided
        });

        // Timer Logic
        if (options.duration) {
            const timer = setInterval(() => {
                const { drawTimer, drawStatus } = get();
                if (drawStatus !== 'recruiting') {
                    clearInterval(timer);
                    return;
                }
                if (drawTimer <= 0) {
                    clearInterval(timer);
                    set({ drawStatus: 'idle' });
                    // Optional: TTS "Recruitment Ended"
                } else {
                    set({ drawTimer: drawTimer - 1 });
                }
            }, 1000);
        }
    },

    stopDraw: () => {
        set({ drawStatus: 'idle' });
    },

    pickDrawWinner: (count) => {
        const { drawCandidates, excludeWinners, previousWinners, isTestMode } = get();
        let pool = [...drawCandidates];

        if (excludeWinners) {
            pool = pool.filter(p => !previousWinners.includes(p.name));
        }

        if (pool.length === 0) {
            if (isTestMode) {
                // Mock Winners
                pool = Array.from({ length: 5 }, (_, i) => ({ name: `TestUser${i}`, role: '팬' }));
            } else {
                return alert('추첨할 대상이 없습니다.');
            }
        }

        const winner = pool[Math.floor(Math.random() * pool.length)];
        set(state => ({
            drawWinner: winner,
            previousWinners: [...state.previousWinners, winner.name]
        }));
    },

    resetDraw: () => {
        set({ drawCandidates: [], drawWinner: null, drawStatus: 'idle' });
    },

    undoLastWinner: () => {
        // Simple undo: just clear current winner
        set({ drawWinner: null });
    },

    startVote: (options) => {
        const items = options.items.map((item: any, idx) => {
            if (typeof item === 'string') return { id: idx + 1, name: item, count: 0, voters: [] };
            return item;
        });

        set({
            voteStatus: 'active',
            voteMode: options.mode,
            voteTitle: options.title,
            voteItems: items,
            voteTimer: options.duration || 60,
            useVoteTimer: !!options.duration,
            allowMultiVote: options.allowMulti,
            voteUnit: options.unit,
            voteWinner: null
        });

        if (options.duration) {
            const timer = setInterval(() => {
                const { voteTimer, voteStatus } = get();
                if (voteStatus !== 'active') {
                    clearInterval(timer);
                    return;
                }
                if (voteTimer <= 0) {
                    clearInterval(timer);
                    set({ voteStatus: 'ended' });
                } else {
                    set({ voteTimer: voteTimer - 1 });
                }
            }, 1000);
        }
    },

    endVote: () => set({ voteStatus: 'ended' }),

    pickVoteWinner: (itemId) => {
        const { voteItems, voteExcludeWinners, previousWinners } = get();
        const item = voteItems.find(i => i.id === itemId);
        if (!item || item.voters.length === 0) return alert('참여자가 없습니다.');

        let candidates = item.voters;
        /* Note: Add voteExcludeWinners logic if needed */
        if (voteExcludeWinners) {
            candidates = candidates.filter(c => !previousWinners.includes(c.name));
        }

        if (candidates.length === 0) return alert('추첨 대상이 없습니다.');

        const winner = candidates[Math.floor(Math.random() * candidates.length)];
        set({ voteWinner: winner });
    },

    resetVote: () => set({ voteItems: [], voteStatus: 'idle', voteWinner: null }),

    updateRouletteItems: (items) => set({ rouletteItems: items, activeRouletteItems: [] }),

    transferVotesToRoulette: () => {
        const { voteItems, includeZeroVotes } = get();

        let rItems = voteItems.map(v => ({
            name: v.name,
            weight: v.count
        }));

        if (!includeZeroVotes) {
            rItems = rItems.filter(i => i.weight > 0);
        } else {
            // Give at least minimal weight if 0? Or just keep 0?
            // If total weight is 0, roulette breaks.
            // Let's assume 0 weight items just have 0 angle (invisible) or handled by display.
        }

        if (rItems.length === 0) return alert('전환할 투표 결과가 없습니다.');

        set({
            rouletteItems: rItems,
            activeRouletteItems: rItems,
            currentTab: 'roulette'
        });
    },

    spinRoulette: () => {
        const { rouletteItems, activeRouletteItems } = get();
        const items = activeRouletteItems.length > 0 ? activeRouletteItems : rouletteItems;
        if (items.length === 0) return;

        set({ isSpinning: true, rouletteWinner: null, rouletteTransition: 'none', rouletteRotation: 0 });

        // Random spin logic
        const spinDuration = 5000; // 5s
        const totalRotation = 360 * 5 + Math.random() * 360; // At least 5 spins

        // Calculate winner based on weights
        const totalWeight = items.reduce((a, b) => a + Number(b.weight), 0);
        let randomWeight = Math.random() * totalWeight;
        let winnerIndex = 0;
        for (let i = 0; i < items.length; i++) {
            randomWeight -= items[i].weight;
            if (randomWeight <= 0) {
                winnerIndex = i;
                break;
            }
        }
        const winner = items[winnerIndex];

        // Adjust rotation to land on winner
        // Winner is at index, we need to calculate angle
        // ... (Simplified: Just rotate random for visual, showing result is what matters)

        requestAnimationFrame(() => {
            set({
                rouletteTransition: `transform ${spinDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
                rouletteRotation: totalRotation
            });
        });

        setTimeout(() => {
            set({ isSpinning: false, rouletteWinner: winner.name });
        }, spinDuration);
    },

    resetRoulette: () => set({ rouletteItems: [], activeRouletteItems: [], rouletteWinner: null }),

    updateTTSSettings: (settings) => set({ ttsVolume: settings.volume, ttsRate: settings.rate, ttsVoice: settings.voice, useTTS: settings.enabled }),
    updateOverlaySettings: (settings) => {
        // Would emit to socket for overlay sync
        console.log('Update Overlay', settings);
    },

    // Bridge Implementation
    sendFn: null,
    handleSync: (payload) => set((state) => ({ ...state, ...payload })),
    setSendFn: (fn) => set({ sendFn: fn }),

    onChat: (msg) => handleChat(set, get, msg),
    onDonation: (donation) => handleDonation(set, get, donation)
}));


function handleChat(set: any, get: () => VoteState, msg: any) {
    const state = get();
    // msg: { profile: { nickname }, message: string, extras: { role } }

    // Safety check for msg structure
    if (!msg || !msg.message) return;

    const nickname = msg.profile?.nickname || 'Unknown';
    const message = msg.message;
    const role = msg.extras?.role || '팬'; // '구독자', '시스템', etc

    // TTS Logic
    if (state.useTTS) {
        // Queue TTS (Simplified directly speaking here, usually use queue)
        // window.speechSynthesis... (Handled in component usually or a dedicated manager)
    }

    // DRAW LOGIC
    if (state.drawStatus === 'recruiting') {
        // [FIX] Correct Command Logic:
        // If Command Mode is ON, verify keyword.
        // If Command Mode is OFF, Accept ALL (unless other filters apply)
        if (state.useDrawCommand) {
            if (state.drawKeyword && !message.startsWith(state.drawKeyword)) return;
        }

        if (state.drawSubsOnly && role !== '구독자' && role !== '계정주') return;

        // Add to candidates if not exists
        if (!state.drawCandidates.find(u => u.name === nickname)) {
            set((prev: VoteState) => ({
                drawCandidates: [...prev.drawCandidates, { name: nickname, role, lastMessage: message }]
            }));
        }
    }

    // VOTE LOGIC (Numeric)
    if (state.voteStatus === 'active' && state.voteMode === 'numeric') {
        const msg = message.trim();
        // Check "1" or "!투표 1"
        let voteId = -1;

        const cmdMatch = msg.match(/^!투표\s*(\d+)$/);
        if (cmdMatch) {
            voteId = parseInt(cmdMatch[1]);
        } else if (/^\d+$/.test(msg)) {
            voteId = parseInt(msg);
        }

        if (voteId !== -1) {
            const itemIndex = state.voteItems.findIndex(i => i.id === voteId);
            if (itemIndex !== -1) {
                // Check Multivote
                const alreadyVoted = state.voteItems.some(i => i.voters.some(v => v.name === nickname));
                if (!state.allowMultiVote && alreadyVoted) return;

                set((prev: VoteState) => {
                    const newItems = [...prev.voteItems];
                    const voter = { name: nickname, role };

                    // Add vote
                    newItems[itemIndex] = {
                        ...newItems[itemIndex],
                        count: newItems[itemIndex].count + 1,
                        voters: [...newItems[itemIndex].voters, voter]
                    };
                    return { voteItems: newItems };
                });
            }
        }
    }
}

function handleDonation(set: any, get: () => VoteState, donation: any) {
    const state = get();
    // donation: { nickname, amount, message }

    if (state.voteStatus === 'active') {
        const message = donation.message || '';

        // Vote Command Parsing: !투표 1 or just containing number?
        // Legacy: "!투표 [번호]"
        const match = message.match(/!투표\s*(\d+)/);
        if (match) {
            const voteId = parseInt(match[1]);
            const itemIndex = state.voteItems.findIndex(i => i.id === voteId);

            if (itemIndex !== -1) {
                // Numeric Vote: 1 person 1 vote usually? Or weight by amount?
                // Legacy Donate Vote: "Amount / Unit" = Votes
                if (state.voteMode === 'donation') {
                    const votes = Math.floor(donation.amount / state.voteUnit);
                    if (votes > 0) {
                        set((prev: VoteState) => {
                            const newItems = [...prev.voteItems];
                            newItems[itemIndex] = {
                                ...newItems[itemIndex],
                                count: newItems[itemIndex].count + votes,
                                voters: [...newItems[itemIndex].voters, { name: donation.nickname, role: '후원자', amount: donation.amount }]
                            };
                            return { voteItems: newItems };
                        });
                    }
                }
            }
        }
    }
}
