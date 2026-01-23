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
    drawStatus: 'idle' | 'recruiting' | 'ready' | 'picking';
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

    // Chat & History
    chatHistory: { nickname: string; message: string; timestamp: number }[];

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
    isVotePicking: boolean;

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
    resetVoteWinner: () => void;
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
    chatHistory: [],

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
    isVotePicking: false,

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
                useDrawTimer: event.useTimer !== undefined ? event.useTimer : state.useDrawTimer,
                excludeWinners: event.excludeWinners !== undefined ? event.excludeWinners : state.excludeWinners
            }));
        }
        if (event.type === 'updateVoteSettings') {
            set(state => ({
                ...state,
                voteTitle: event.title !== undefined ? event.title : state.voteTitle,
                isAutoSort: event.autoSort !== undefined ? event.autoSort : state.isAutoSort,
                includeZeroVotes: event.includeZeroVotes !== undefined ? event.includeZeroVotes : state.includeZeroVotes,
                allowMultiVote: event.allowMulti !== undefined ? event.allowMulti : state.allowMultiVote,
                // Added missing fields
                voteUnit: event.unit !== undefined ? event.unit : state.voteUnit,
                useVoteTimer: event.useTimer !== undefined ? event.useTimer : state.useVoteTimer,
                voteTimerDuration: event.duration !== undefined ? event.duration : state.voteTimerDuration,
                voteExcludeWinners: event.voteExcludeWinners !== undefined ? event.voteExcludeWinners : state.voteExcludeWinners
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
        set({ drawStatus: 'ready' }); // Go to Ready state to review list
    },

    pickDrawWinner: (count) => {
        const { drawCandidates, excludeWinners, previousWinners, isTestMode } = get();

        // 1. Validation
        let pool = [...drawCandidates];
        if (excludeWinners) {
            pool = pool.filter(p => !previousWinners.includes(p.name));
        }

        if (pool.length === 0) {
            if (isTestMode) {
                pool = Array.from({ length: 5 }, (_, i) => ({ name: `ТеstUser${i}`, role: '팬', lastMessage: '테스트 메시지입니다.' }));
            } else {
                return alert('참여자가 부족하여 추첨할 수 없습니다.');
            }
        }

        // 2. Start Animation (Picking State)
        set({ drawStatus: 'picking', drawWinner: null });

        // 3. Delay & Pick
        setTimeout(() => {
            const winner = pool[Math.floor(Math.random() * pool.length)];
            set(state => ({
                drawStatus: 'idle',
                drawWinner: winner,
                previousWinners: [...state.previousWinners, winner.name]
            }));
        }, 3000); // 3 seconds spin
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

        // Animation Start
        set({ isVotePicking: true, voteWinner: null });

        setTimeout(() => {
            const winner = candidates[Math.floor(Math.random() * candidates.length)];
            set({ voteWinner: winner, isVotePicking: false });
        }, 3000);
    },

    resetVoteWinner: () => set({ voteWinner: null, isVotePicking: false }),

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
        }

        if (rItems.length === 0) return alert('전환할 투표 결과가 없습니다.');

        set({
            rouletteItems: rItems,
            activeRouletteItems: rItems,
            currentTab: 'roulette'
        });
    },

    spinRoulette: () => {
        const { rouletteItems, activeRouletteItems, rouletteRotation } = get();
        const items = activeRouletteItems.length > 0 ? activeRouletteItems : rouletteItems;
        if (items.length === 0) return;

        // 1. Calculate Winner based on Weights
        const totalWeight = items.reduce((a, b) => a + Number(b.weight), 0);
        let randomWeight = Math.random() * totalWeight;
        let winnerIndex = 0;
        let accumulatedWeight = 0;

        for (let i = 0; i < items.length; i++) {
            accumulatedWeight += items[i].weight;
            if (randomWeight <= accumulatedWeight) {
                winnerIndex = i;
                break;
            }
        }
        const winner = items[winnerIndex];

        // 2. Calculate Visual Target Angle
        // We want to land on the winner's segment.
        // The wheel spins CLOCKWISE (increasing degrees).
        // The pointer is at the TOP (0 degrees visual, or -90 offset depending on CSS).
        // Let's assume standard CSS: 0deg is top, 90deg is right.
        // Wait, standard CSS rotation: 0deg is usually "12 o'clock" if we built it that way.
        // In RouletteDisplay, segments are placed with `transform: rotate(...)`
        // getSegmentRotation calculates center of wedge.
        // Let's recalculate precise start/end angles for the winner.

        let previousWeight = 0;
        for (let i = 0; i < winnerIndex; i++) previousWeight += items[i].weight;

        // Start angle of the wedge (relative to 0)
        const startAngle = (previousWeight / totalWeight) * 360;
        // Size of the wedge
        const wedgeSize = (items[winnerIndex].weight / totalWeight) * 360;

        // Random landing spot within the wedge (cushioned by 5% padding to avoid edge cases)
        const padding = wedgeSize * 0.05;
        const randomOffset = padding + Math.random() * (wedgeSize - 2 * padding);
        const targetWedgeAngle = startAngle + randomOffset;

        // To land on 'targetWedgeAngle' at the TOP (0deg indicator), 
        // the wheel must rotate such that 'targetWedgeAngle' ends up at -90deg? 
        // No, typically indicator is at top. If wedge is at 10deg, we rotate wheel -10deg to bring it to 0.
        // So target rotation should align the target angle to the indicator.
        // Let's say indicator is at 0 degrees.
        // Rotation Required = (Current Rotation) + (Spins) - (Target Angle relative to start of wheel)
        // But we want to spin forward.
        // Target Rotation = (Current rounded to 360) + (5 * 360) + (360 - targetWedgeAngle).
        // Actually simpler: 
        // Total rotations so far: currentRotation.
        // Determine "Angle Mod 360" of current position? No, just keep adding.

        const extraSpins = (10 + Math.floor(Math.random() * 5)) * 360; // 10-15 spins for heavier feel
        // We want final position % 360 to be such that targetWedgeAngle is at top.
        // Position of wedge `w` at rotation `R` is `(w + R) % 360`.
        // We want `(targetWedgeAngle + FinalR) % 360 = 0` (assuming indicator is at 0/Top).
        // FinalR = -targetWedgeAngle (+ k*360).
        // Since we spin clockwise (positive R), we want to reach a high positive number.

        // The logic in display: pointer is static Top. Wheel rotates.
        // We need the wheel to rotate such that the *winner segment* is under the pointer.
        // If segment is at `StartAngle`..`EndAngle` on the static wheel map.
        // We need Rotation `R` such that `(StartAngle + R) % 360` corresponds to "Top".
        // Actually, CSS rotation rotates the whole coordinate system.
        // If segment is at 10deg, and we rotate +350deg, segment ends up at 360=0deg (Top).
        // So FinalRotation % 360 should ideally be (360 - targetWedgeAngle).

        const currentRotationMod = rouletteRotation % 360; // Current normalized
        const desiredFinalMod = (360 - targetWedgeAngle) % 360;

        let delta = desiredFinalMod - currentRotationMod;
        if (delta < 0) delta += 360; // Ensure positive forward movement to alignment

        const totalScan = extraSpins + delta;
        const targetRotation = rouletteRotation + totalScan;


        // 3. Animation Sequence with Recoil
        // Step A: Recoil (Rotate backward 20deg)
        set({
            isSpinning: true,
            rouletteWinner: null,
            rouletteTransition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Ease Out Back-ish
            rouletteRotation: rouletteRotation - 20
        });

        // Step B: Spin Forward (after recoil delay)
        setTimeout(() => {
            // Random Duration 4s - 5s
            const spinDuration = 4000 + Math.random() * 1000;
            set({
                rouletteTransition: `transform ${spinDuration}ms cubic-bezier(0.15, 0.85, 0.35, 1)`, // Soft stop custom bezier
                rouletteRotation: targetRotation
            });

            // Step C: Finish
            setTimeout(() => {
                set({ isSpinning: false, rouletteWinner: winner.name });
            }, spinDuration);
        }, 400); // Wait for recoil
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
        try {
            // Cancel previous if spamming (optional, or queue) - Simple approach: Speak immediately
            // For better UX, maybe cancel previous?
            // window.speechSynthesis.cancel(); // Uncomment if you want to cut off previous

            const utterance = new SpeechSynthesisUtterance(message);
            utterance.volume = state.ttsVolume;
            utterance.rate = state.ttsRate;

            if (state.ttsVoice) {
                const voices = window.speechSynthesis.getVoices();
                const selected = voices.find(v => v.name === state.ttsVoice);
                if (selected) utterance.voice = selected;
            }

            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error('TTS Error:', e);
        }
    }

    // Add to History (Keep last 50)
    set((prev: VoteState) => ({
        chatHistory: [...prev.chatHistory.slice(-49), { nickname, message, timestamp: Date.now() }]
    }));

    // DRAW LOGIC
    if (state.drawStatus === 'recruiting') {
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
        const message = (donation.message || '').trim();
        const nickname = donation.nickname || '';

        // 1. Ignore Anonymous
        if (!nickname || nickname === '익명' || nickname === 'Unknown') return;

        const match = message.match(/^!투표\s*(\d+)/);
        if (match) {
            const voteId = parseInt(match[1]);
            const targetItemIndex = state.voteItems.findIndex(i => i.id === voteId);

            if (targetItemIndex !== -1) {
                // Donation Mode Logic
                if (state.voteMode === 'donation') {
                    // Check Minimum Amount
                    if (donation.amount < state.voteUnit) return;

                    // Calculate Votes
                    let voteCountToAdd = Math.floor(donation.amount / state.voteUnit);

                    set((prev: VoteState) => {
                        let newItems = [...prev.voteItems];

                        // Logic: Multi-Vote Disabled
                        if (!prev.allowMultiVote) {
                            // 1. Overwrite Rule: Remove ANY previous vote by this user across ALL items
                            newItems = newItems.map(item => {
                                const userVotedHere = item.voters.some(v => v.name === nickname);
                                if (userVotedHere) {
                                    // Found previous vote, remove it
                                    // In 'No Multi', a user contributes exactly 1 vote.
                                    // So we subtract 1 from count.
                                    // (Assuming logic integrity meant they only had 1 vote previously)
                                    return {
                                        ...item,
                                        count: Math.max(0, item.count - 1),
                                        voters: item.voters.filter(v => v.name !== nickname)
                                    };
                                }
                                return item;
                            });

                            // 2. Fix Vote Count Rule: Always 1 vote if valid
                            voteCountToAdd = 1;
                        }

                        // Add New Vote
                        newItems[targetItemIndex] = {
                            ...newItems[targetItemIndex],
                            count: newItems[targetItemIndex].count + voteCountToAdd,
                            voters: [...newItems[targetItemIndex].voters, { name: nickname, role: '후원자', amount: donation.amount }]
                        };

                        return { voteItems: newItems };
                    });
                }
            }
        }
    }
}
