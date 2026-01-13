import { create } from 'zustand';
import { BotState, BotSettings, CommandItem, VoteSession, SongItem } from '@/types/bot';

/**
 * Final Bot Store: 서버(Supabase)와 클라이언트(React)를 잇는 단 하나의 데이터 터미널입니다.
 */
interface BotStore extends BotState {
  // [1] 데이터 수신 액션
  setAuth: (user: any) => void;
  setBotStatus: (connected: boolean, reconnecting?: boolean) => void;
  setStreamInfo: (info: any, live: any) => void;
  updateSettings: (settings: Partial<BotSettings>) => void;
  updateCommands: (cmds: CommandItem[]) => void;
  updateCounters: (counters: any[]) => void;
  updateMacros: (macros: any[]) => void;
  updateVotes: (payload: any) => void;
  updateSongs: (payload: any) => void;
  updateDraw: (payload: any) => void;
  updateRoulette: (payload: any) => void;
  updateParticipation: (payload: any) => void;
  updateParticipationRanking: (ranking: any[]) => void;
  updateGreet: (payload: any) => void;
  addChat: (chat: any) => void;
}

export const useBotStore = create<BotStore>((set) => ({
  // [2] 초기 상태 (서버 로드 전 기본값)
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

  // [3] 원자적 업데이트 로직
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
  
  updateDraw: (payload) => set((state) => ({
    participation: { ...state.participation, currentDraw: payload.currentSession }
  })),
  
  updateRoulette: (payload) => set((state) => ({
    participation: { ...state.participation, currentRoulette: payload.currentSession }
  })),

  updateSongs: (payload) => set({ songs: { queue: payload.queue, current: payload.currentSong } }),
  
  updateParticipation: (payload) => set((state) => ({ 
    participation: { 
      ...state.participation, 
      queue: payload.queue, 
      active: payload.participants, 
      isActive: payload.isParticipationActive, 
      max: payload.maxParticipants 
    }
  })),
  
  updateParticipationRanking: (ranking) => set((state) => ({ 
    participation: { ...state.participation, ranking }
  })),
  
  updateGreet: (payload) => set({ greet: { settings: payload.settings, historyCount: payload.historyCount } }),
  
  addChat: (chat) => set((state) => ({ 
    chatHistory: [chat, ...state.chatHistory].slice(0, 50) 
  })),
}));