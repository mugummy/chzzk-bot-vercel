import { create } from 'zustand';

// Types
export type GameMode = 'viewer-draw' | 'number-vote' | 'donation-vote' | 'roulette';
export type GameStatus = 'idle' | 'recruiting' | 'active' | 'picking' | 'spinning' | 'result';
export type AudioOutput = 'dashboard' | 'overlay' | 'both';

export interface VoteItem {
  id: string;
  label: string;
  votes: number;
  color: string;
}

export interface RouletteItem {
  id: string;
  label: string;
  weight: number;
  color: string;
}

export interface Participant {
  id: string;
  nickname: string;
  amount?: number;
  timestamp: number;
}

export interface Winner {
  id: string;
  nickname: string;
  amount?: number;
}

interface VoteGameState {
  // Current Mode
  mode: GameMode;
  status: GameStatus;

  // Viewer Draw State
  draw: {
    participants: Participant[];
    excludePreviousWinners: boolean;
    winnersHistory: Winner[];
    currentWinner: Winner | null;
    winnerCount: number;
    command: string;
    useCommand: boolean;
    subscriberOnly: boolean;
  };

  // Number Vote State
  numberVote: {
    title: string;
    items: VoteItem[];
    sortByRank: boolean;
    showPercentage: boolean;
    allowTransferToRoulette: boolean;
  };

  // Donation Vote State
  donationVote: {
    title: string;
    items: VoteItem[];
    unitAmount: number;
    allowMultipleVotes: boolean;
    totalAmount: number;
  };

  // Roulette State
  roulette: {
    items: RouletteItem[];
    currentWinner: RouletteItem | null;
    spinDuration: number;
    rotation: number;
  };

  // Audio Settings
  audio: {
    enabled: boolean;
    output: AudioOutput;
    ttsEnabled: boolean;
    volume: number;
  };

  // Overlay Sync
  overlay: {
    isVisible: boolean;
    syncEnabled: boolean;
  };
}

interface VoteGameActions {
  // Mode Actions
  setMode: (mode: GameMode) => void;
  setStatus: (status: GameStatus) => void;

  // Draw Actions
  startRecruiting: () => void;
  stopRecruiting: () => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (id: string) => void;
  clearParticipants: () => void;
  pickWinner: () => Winner | null;
  setDrawSettings: (settings: Partial<VoteGameState['draw']>) => void;
  addToWinnersHistory: (winner: Winner) => void;
  clearWinnersHistory: () => void;

  // Number Vote Actions
  setVoteTitle: (title: string) => void;
  addVoteItem: (label: string) => void;
  removeVoteItem: (id: string) => void;
  updateVoteItem: (id: string, updates: Partial<VoteItem>) => void;
  addVote: (itemId: string, count?: number) => void;
  clearVotes: () => void;
  setVoteSettings: (settings: Partial<VoteGameState['numberVote']>) => void;
  transferToRoulette: () => void;

  // Donation Vote Actions
  setDonationVoteTitle: (title: string) => void;
  addDonationVoteItem: (label: string) => void;
  removeDonationVoteItem: (id: string) => void;
  addDonation: (itemId: string, amount: number, nickname: string) => void;
  setDonationSettings: (settings: Partial<VoteGameState['donationVote']>) => void;

  // Roulette Actions
  addRouletteItem: (label: string, weight?: number) => void;
  removeRouletteItem: (id: string) => void;
  updateRouletteItem: (id: string, updates: Partial<RouletteItem>) => void;
  spinRoulette: () => RouletteItem | null;
  setRouletteRotation: (rotation: number) => void;
  clearRouletteItems: () => void;

  // Audio Actions
  setAudioSettings: (settings: Partial<VoteGameState['audio']>) => void;
  playSound: (type: 'spin' | 'win' | 'tick' | 'start') => void;

  // Overlay Actions
  setOverlayVisible: (visible: boolean) => void;
  toggleOverlaySync: (enabled: boolean) => void;

  // Reset
  resetAll: () => void;
  resetCurrentMode: () => void;
}

const COLORS = [
  '#00ff80', '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3',
  '#f38181', '#aa96da', '#fcbad3', '#a8d8ea', '#ff9a76',
  '#c4e538', '#12cbc4', '#ed4c67', '#ffc048', '#9b59b6'
];

const getRandomColor = (index: number) => COLORS[index % COLORS.length];

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const initialState: VoteGameState = {
  mode: 'viewer-draw',
  status: 'idle',

  draw: {
    participants: [],
    excludePreviousWinners: false,
    winnersHistory: [],
    currentWinner: null,
    winnerCount: 1,
    command: '!참여',
    useCommand: true,
    subscriberOnly: false,
  },

  numberVote: {
    title: '',
    items: [],
    sortByRank: true,
    showPercentage: true,
    allowTransferToRoulette: true,
  },

  donationVote: {
    title: '',
    items: [],
    unitAmount: 1000,
    allowMultipleVotes: true,
    totalAmount: 0,
  },

  roulette: {
    items: [],
    currentWinner: null,
    spinDuration: 4000,
    rotation: 0,
  },

  audio: {
    enabled: true,
    output: 'both',
    ttsEnabled: false,
    volume: 0.7,
  },

  overlay: {
    isVisible: true,
    syncEnabled: true,
  },
};

export const useVoteGameStore = create<VoteGameState & VoteGameActions>((set, get) => ({
  ...initialState,

  // Mode Actions
  setMode: (mode) => set({ mode, status: 'idle' }),
  setStatus: (status) => set({ status }),

  // Draw Actions
  startRecruiting: () => set({ status: 'recruiting' }),
  stopRecruiting: () => set({ status: 'idle' }),

  addParticipant: (participant) => set((state) => {
    const { excludePreviousWinners, winnersHistory, participants } = state.draw;

    // Check if already exists
    if (participants.some(p => p.nickname === participant.nickname)) {
      return state;
    }

    // Check if excluded
    if (excludePreviousWinners && winnersHistory.some(w => w.nickname === participant.nickname)) {
      return state;
    }

    return {
      draw: {
        ...state.draw,
        participants: [...state.draw.participants, participant],
      },
    };
  }),

  removeParticipant: (id) => set((state) => ({
    draw: {
      ...state.draw,
      participants: state.draw.participants.filter(p => p.id !== id),
    },
  })),

  clearParticipants: () => set((state) => ({
    draw: { ...state.draw, participants: [], currentWinner: null },
  })),

  pickWinner: () => {
    const state = get();
    const { participants, winnerCount } = state.draw;

    if (participants.length === 0) return null;

    const winners: Winner[] = [];
    const availableParticipants = [...participants];

    for (let i = 0; i < Math.min(winnerCount, availableParticipants.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableParticipants.length);
      const selected = availableParticipants.splice(randomIndex, 1)[0];
      winners.push({
        id: selected.id,
        nickname: selected.nickname,
        amount: selected.amount,
      });
    }

    const winner = winners[0] || null;

    set({
      status: 'picking',
      draw: { ...state.draw, currentWinner: winner },
    });

    return winner;
  },

  setDrawSettings: (settings) => set((state) => ({
    draw: { ...state.draw, ...settings },
  })),

  addToWinnersHistory: (winner) => set((state) => ({
    draw: {
      ...state.draw,
      winnersHistory: [...state.draw.winnersHistory, winner],
    },
  })),

  clearWinnersHistory: () => set((state) => ({
    draw: { ...state.draw, winnersHistory: [] },
  })),

  // Number Vote Actions
  setVoteTitle: (title) => set((state) => ({
    numberVote: { ...state.numberVote, title },
  })),

  addVoteItem: (label) => set((state) => ({
    numberVote: {
      ...state.numberVote,
      items: [
        ...state.numberVote.items,
        {
          id: generateId(),
          label,
          votes: 0,
          color: getRandomColor(state.numberVote.items.length),
        },
      ],
    },
  })),

  removeVoteItem: (id) => set((state) => ({
    numberVote: {
      ...state.numberVote,
      items: state.numberVote.items.filter(item => item.id !== id),
    },
  })),

  updateVoteItem: (id, updates) => set((state) => ({
    numberVote: {
      ...state.numberVote,
      items: state.numberVote.items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    },
  })),

  addVote: (itemId, count = 1) => set((state) => ({
    numberVote: {
      ...state.numberVote,
      items: state.numberVote.items.map(item =>
        item.id === itemId ? { ...item, votes: item.votes + count } : item
      ),
    },
  })),

  clearVotes: () => set((state) => ({
    numberVote: {
      ...state.numberVote,
      items: state.numberVote.items.map(item => ({ ...item, votes: 0 })),
    },
  })),

  setVoteSettings: (settings) => set((state) => ({
    numberVote: { ...state.numberVote, ...settings },
  })),

  transferToRoulette: () => {
    const state = get();
    const { items } = state.numberVote;
    const totalVotes = items.reduce((sum, item) => sum + item.votes, 0);

    if (totalVotes === 0) return;

    const rouletteItems: RouletteItem[] = items
      .filter(item => item.votes > 0)
      .map(item => ({
        id: generateId(),
        label: item.label,
        weight: Math.round((item.votes / totalVotes) * 100),
        color: item.color,
      }));

    set({
      mode: 'roulette',
      status: 'idle',
      roulette: {
        ...state.roulette,
        items: rouletteItems,
        currentWinner: null,
        rotation: 0,
      },
    });
  },

  // Donation Vote Actions
  setDonationVoteTitle: (title) => set((state) => ({
    donationVote: { ...state.donationVote, title },
  })),

  addDonationVoteItem: (label) => set((state) => ({
    donationVote: {
      ...state.donationVote,
      items: [
        ...state.donationVote.items,
        {
          id: generateId(),
          label,
          votes: 0,
          color: getRandomColor(state.donationVote.items.length),
        },
      ],
    },
  })),

  removeDonationVoteItem: (id) => set((state) => ({
    donationVote: {
      ...state.donationVote,
      items: state.donationVote.items.filter(item => item.id !== id),
    },
  })),

  addDonation: (itemId, amount, nickname) => set((state) => {
    const { unitAmount, allowMultipleVotes } = state.donationVote;
    const voteCount = allowMultipleVotes ? Math.floor(amount / unitAmount) : 1;

    return {
      donationVote: {
        ...state.donationVote,
        totalAmount: state.donationVote.totalAmount + amount,
        items: state.donationVote.items.map(item =>
          item.id === itemId ? { ...item, votes: item.votes + voteCount } : item
        ),
      },
    };
  }),

  setDonationSettings: (settings) => set((state) => ({
    donationVote: { ...state.donationVote, ...settings },
  })),

  // Roulette Actions
  addRouletteItem: (label, weight = 1) => set((state) => ({
    roulette: {
      ...state.roulette,
      items: [
        ...state.roulette.items,
        {
          id: generateId(),
          label,
          weight,
          color: getRandomColor(state.roulette.items.length),
        },
      ],
    },
  })),

  removeRouletteItem: (id) => set((state) => ({
    roulette: {
      ...state.roulette,
      items: state.roulette.items.filter(item => item.id !== id),
    },
  })),

  updateRouletteItem: (id, updates) => set((state) => ({
    roulette: {
      ...state.roulette,
      items: state.roulette.items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    },
  })),

  spinRoulette: () => {
    const state = get();
    const { items } = state.roulette;

    if (items.length < 2) return null;

    // Calculate winner based on weights
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    let winner: RouletteItem | null = null;

    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        winner = item;
        break;
      }
    }

    if (!winner) winner = items[items.length - 1];

    // Calculate rotation angle
    const winnerIndex = items.findIndex(i => i.id === winner!.id);
    const segmentAngle = 360 / items.length;
    const baseRotations = 360 * 5; // 5 full rotations
    const targetAngle = baseRotations + (360 - (winnerIndex * segmentAngle) - segmentAngle / 2);

    set({
      status: 'spinning',
      roulette: {
        ...state.roulette,
        currentWinner: winner,
        rotation: state.roulette.rotation + targetAngle,
      },
    });

    return winner;
  },

  setRouletteRotation: (rotation) => set((state) => ({
    roulette: { ...state.roulette, rotation },
  })),

  clearRouletteItems: () => set((state) => ({
    roulette: { ...state.roulette, items: [], currentWinner: null, rotation: 0 },
  })),

  // Audio Actions
  setAudioSettings: (settings) => set((state) => ({
    audio: { ...state.audio, ...settings },
  })),

  playSound: (type) => {
    const state = get();
    if (!state.audio.enabled) return;

    // Check if should play based on output setting
    const isOverlay = typeof window !== 'undefined' && window.location.pathname.includes('overlay');
    const { output } = state.audio;

    const shouldPlay =
      output === 'both' ||
      (output === 'dashboard' && !isOverlay) ||
      (output === 'overlay' && isOverlay);

    if (!shouldPlay) return;

    // Sound URLs would be defined here
    // For now, we'll use Web Audio API beeps
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const frequencies: Record<string, number> = {
        spin: 400,
        win: 800,
        tick: 600,
        start: 500,
      };

      oscillator.frequency.value = frequencies[type] || 440;
      gainNode.gain.value = state.audio.volume * 0.3;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio context not available
    }
  },

  // Overlay Actions
  setOverlayVisible: (visible) => set((state) => ({
    overlay: { ...state.overlay, isVisible: visible },
  })),

  toggleOverlaySync: (enabled) => set((state) => ({
    overlay: { ...state.overlay, syncEnabled: enabled },
  })),

  // Reset
  resetAll: () => set(initialState),

  resetCurrentMode: () => {
    const state = get();
    switch (state.mode) {
      case 'viewer-draw':
        set({
          status: 'idle',
          draw: { ...initialState.draw, winnersHistory: state.draw.winnersHistory },
        });
        break;
      case 'number-vote':
        set({
          status: 'idle',
          numberVote: { ...state.numberVote, items: state.numberVote.items.map(i => ({ ...i, votes: 0 })) },
        });
        break;
      case 'donation-vote':
        set({
          status: 'idle',
          donationVote: { ...state.donationVote, items: state.donationVote.items.map(i => ({ ...i, votes: 0 })), totalAmount: 0 },
        });
        break;
      case 'roulette':
        set({
          status: 'idle',
          roulette: { ...state.roulette, currentWinner: null, rotation: 0 },
        });
        break;
    }
  },
}));
