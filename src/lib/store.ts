import { create } from 'zustand';
import { BotState, BotSettings, CommandItem, VoteSession, SongItem } from '@/types/bot';

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
  songs: { queue: [], current: null },
  participation: { queue: [], active: [], isActive: false, max: 10, ranking: [] },
  greet: { settings: { enabled: true, type: 1, message: "반갑습니다!" }, historyCount: 0 },
  points: {},
  chatHistory: [],

  setAuth: (user) => set({ currentUser: user }),
  setBotStatus: (connected, reconnecting = false) => set({ isConnected: connected, isReconnecting: reconnecting }),
  setStreamInfo: (info, live) => set({ channelInfo: info, liveStatus: live }),
  
  // [핵심] 불변성을 유지하며 새로운 객체 할당 -> 리렌더링 유발
  updateSettings: (newSettings) => set((state) => ({ 
    settings: state.settings ? { ...state.settings, ...newSettings } : (newSettings as BotSettings)
  })),
  
  updateCommands: (cmds) => set({ commands: [...cmds] }), // 배열 복사
  updateCounters: (counters) => set({ counters: [...counters] }),
  updateMacros: (macros) => set({ macros: [...macros] }),
  
  updateVotes: (payload) => set({ votes: payload.currentVote ? [payload.currentVote] : [] }),
  updateSongs: (payload) => set({ songs: { queue: [...payload.queue], current: payload.currentSong } }),
  
  updateParticipation: (payload) => set((state) => ({ 
    participation: { 
      ...state.participation, 
      queue: [...payload.queue], 
      active: [...payload.participants], 
      isActive: payload.isParticipationActive, 
      max: payload.maxParticipants 
    }
  })),
  
  updateParticipationRanking: (ranking) => set((state) => ({ 
    participation: { ...state.participation, ranking: [...ranking] }
  })),
  
  updateGreet: (payload) => set({ greet: { settings: payload.settings, historyCount: payload.historyCount } }),
  
  setChatHistory: (history) => set({ chatHistory: [...history] }),
  
  addChat: (chat) => set((state) => {
    const newHistory = [...state.chatHistory, chat];
    if (newHistory.length > 100) newHistory.shift();
    return { chatHistory: newHistory };
  }),
}));