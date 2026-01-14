import { create } from 'zustand';
import { BotState, BotSettings, CommandItem, VoteSession, SongItem, RouletteState } from '@/types/bot';

// BotStore 인터페이스는 BotState를 상속받으며 액션들을 포함합니다.
export interface BotStore extends BotState {
  setAuth: (user: any) => void;
  setBotStatus: (connected: boolean, reconnecting?: boolean) => void;
  setStreamInfo: (info: any, live: any) => void;
  updateSettings: (settings: Partial<BotSettings>) => void;
  updateCommands: (cmds: CommandItem[]) => void;
  updateCounters: (counters: any[]) => void;
  updateMacros: (macros: any[]) => void;
  updateVotes: (payload: any) => void;
  updateRoulette: (payload: any) => void;
  updateSongs: (payload: any) => void;
  updateParticipation: (payload: any) => void;
  updateParticipationRanking: (ranking: any[]) => void;
  updateGreet: (payload: any) => void;
  setChatHistory: (history: any[]) => void;
  addChat: (chat: any) => void;
}

export const useBotStore = create<BotStore>((set) => ({
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
  roulette: { items: [], isSpinning: false, winner: null }, // [확인] 초기값 존재
  songs: { queue: [], current: null, isPlaying: false },
  participation: { queue: [], active: [], isActive: false, max: 10, ranking: [] },
  greet: { settings: { enabled: true, type: 1, message: "반갑습니다!" }, historyCount: 0 },
  points: {},
  chatHistory: [],

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
  updateRoulette: (payload) => set({ roulette: payload }), // [확인] 액션 존재
  
  updateSongs: (payload) => set({ songs: { queue: payload.queue, current: payload.currentSong, isPlaying: payload.isPlaying || false } }),
  
  updateParticipation: (payload) => set((state) => ({ 
    participation: { ...state.participation, queue: payload.queue, active: payload.participants, isActive: payload.isParticipationActive, max: payload.maxParticipants }
  })),
  
  updateParticipationRanking: (ranking) => set((state) => ({ participation: { ...state.participation, ranking } })),
  
  updateGreet: (payload) => set({ greet: { settings: payload.settings, historyCount: payload.historyCount } }),
  
  setChatHistory: (history) => set({ chatHistory: history }),
  
  addChat: (chat) => set((state) => ({ chatHistory: [chat, ...state.chatHistory].slice(0, 50) })),
}));
