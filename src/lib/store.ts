import { create } from 'zustand';
import { BotState, BotSettings, CommandItem, SongItem } from '@/types/bot';

/**
 * BotStore: 프론트엔드의 유일한 진실 공급원 (Single Source of Truth)
 * 서버에서 오는 모든 데이터를 여기에 담아 각 컴포넌트로 분배합니다.
 */
interface BotStore extends BotState {
  setAuth: (user: any) => void;
  setBotStatus: (connected: boolean, reconnecting?: boolean) => void;
  setStreamInfo: (info: any, live: any) => void;
  updateSettings: (settings: Partial<BotSettings>) => void;
  updateCommands: (cmds: CommandItem[]) => void;
  updateCounters: (counters: any[]) => void;
  updateMacros: (macros: any[]) => void;
  updateVotes: (payload: any) => void;
  updateSongs: (payload: any) => void;
  updateParticipation: (payload: any) => void;
  updateParticipationRanking: (ranking: any[]) => void;
  updateGreet: (payload: any) => void;
  addChat: (chat: any) => void;
}

export const useBotStore = create<BotStore>((set) => ({
  // States
  isConnected: false,
  isReconnecting: false,
  currentUser: null,
  channelInfo: null,
  liveStatus: null,
  settings: null,
  commands: [],
  counters: [],
  macros: [],
  votes: [],
  songs: { queue: [], current: null },
  participation: { queue: [], active: [], isActive: false, max: 10, ranking: [] },
  greet: { settings: { enabled: true, type: 1, message: "반갑습니다!" }, historyCount: 0 },
  points: {},
  chatHistory: [],

  // Actions
  setAuth: (user) => set({ currentUser: user }),
  setBotStatus: (connected, reconnecting = false) => set({ isConnected: connected, isReconnecting: reconnecting }),
  setStreamInfo: (info, live) => set({ channelInfo: info, liveStatus: live }),
  updateSettings: (newSettings) => set((state) => ({ 
    settings: state.settings ? { ...state.settings, ...newSettings } : (newSettings as BotSettings)
  })),
  updateCommands: (cmds) => set({ commands: cmds }),
  updateCounters: (counters) => set({ counters }),
  updateMacros: (macros) => set({ macros }),
  updateVotes: (payload) => set({ votes: payload.currentVote ? [payload.currentVote] : [] }),
  updateSongs: (payload) => set({ songs: { queue: payload.queue, current: payload.currentSong } }),
  updateParticipation: (payload) => set((state) => ({ 
    participation: { ...state.participation, queue: payload.queue, active: payload.participants, isActive: payload.isParticipationActive, max: payload.maxParticipants }
  })),
  updateParticipationRanking: (ranking) => set((state) => ({ 
    participation: { ...state.participation, ranking }
  })),
  updateGreet: (payload) => set({ greet: { settings: payload.settings, historyCount: payload.historyCount } }),
  addChat: (chat) => set((state) => ({ 
    chatHistory: [chat, ...state.chatHistory].slice(0, 50) 
  })),
}));