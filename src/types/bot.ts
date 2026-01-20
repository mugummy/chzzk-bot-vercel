// 기존 타입 확장

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
    id: string;
    triggers: string[];
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
    label: string;
    count: number;
    percent: number;
    barPercent: number;
}

export interface VoteState {
    currentVote: {
        title: string;
        options: VoteOption[];
        status: 'active' | 'ended';
        totalVotes: number;
        mode: 'chat' | 'donation';
    } | null;
}

export interface DrawState {
    isRecruiting: boolean;
    status: 'idle' | 'recruiting' | 'complete';
    participantCount: number;
    participants: Array<{ id: string; nickname: string; }>;
    keyword: string;
    subsOnly: boolean;
    winner: { id: string; nickname: string; } | null;
}

export interface RouletteItem {
    id: string;
    label: string;
    weight: number;
}

export interface RouletteState {
    items: RouletteItem[];
    isSpinning: boolean;
    result: RouletteItem | null;
}

export interface BotState {
    isConnected: boolean;
    isReconnecting: boolean;
    currentUser: any;
    channelInfo: any;
    liveStatus: any;
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
    points: { [key: string]: any };
    chatHistory: any[];
    vote: VoteState;
    draw: DrawState;
    roulette: RouletteState;
}