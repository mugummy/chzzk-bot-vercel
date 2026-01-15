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

export interface Participant {
  userIdHash: string;
  nickname: string;
  joinedAt: number;
}

export interface BotState {
  isConnected: boolean;
  isReconnecting: boolean;
  currentUser: {
    channelId: string;
    channelName: string;
    channelImageUrl: string;
  } | null;
  channelInfo: {
    channelId: string;
    channelName: string;
    channelImageUrl: string;
    followerCount: number;
  } | null;
  liveStatus: {
    liveTitle: string;
    status: 'OPEN' | 'CLOSE';
    concurrentUserCount: number;
    category: string;
  } | null;
  settings: BotSettings | null;
  commands: CommandItem[];
  counters: any[];
  macros: any[];
  songs: {
    queue: SongItem[];
    current: SongItem | null;
    isPlaying: boolean;
  };
  participation: {
    queue: Participant[];
    active: Participant[];
    isActive: boolean;
    max: number;
    ranking: any[];
  };
  greet: {
    settings: any;
    historyCount: number;
  };
  points: { [userIdHash: string]: { nickname: string; points: number; lastMessageTime: number } };
  chatHistory: any[];
}
