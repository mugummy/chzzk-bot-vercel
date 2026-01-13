// chzzk-bot-v2/src/types/bot.ts - The Absolute Type Authority

export interface BotSettings {
  chatEnabled: boolean;
  songRequestMode: 'all' | 'cooldown' | 'donation' | 'off';
  songRequestCooldown: number;
  minDonationAmount: number;
  pointsPerChat: number;
  pointsCooldown: number;
  pointsName: string;
  participationCommand: string;
  maxParticipants: number;
}

export interface CommandItem {
  id?: string;
  triggers?: string[];
  trigger?: string;
  response: string;
  enabled: boolean;
}

export interface SongItem {
  videoId: string;
  title: string;
  thumbnail: string;
  requester: string;
  requestedAt: number;
}

export interface VoteOption {
  id: string;
  text: string;
}

export interface VoteSession {
  id: string;
  question: string;
  options: VoteOption[];
  results: { [optionId: string]: number };
  isActive: boolean;
  settings: any;
  startTime: number | null;
  totalVotes: number;
}

export interface BotState {
  isConnected: boolean;
  isReconnecting: boolean;
  currentUser: {
    channelId: string;
    channelName: string;
    channelImageUrl: string;
  } | null;
  channelInfo: any | null;
  liveStatus: any | null;
  settings: BotSettings | null;
  commands: CommandItem[];
  counters: any[];
  macros: any[];
  votes: VoteSession[]; // VoteSession 사용 보장
  songs: {
    queue: SongItem[];
    current: SongItem | null;
  };
  participation: {
    queue: any[];
    active: any[];
    isActive: boolean;
    max: number;
    ranking: any[];
  };
  greet: {
    settings: any;
    historyCount: number;
  };
  points: { [userId: string]: any };
  chatHistory: any[];
}