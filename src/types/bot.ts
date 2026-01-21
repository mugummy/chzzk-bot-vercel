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
    percent: string;
    barPercent: number;
    voters: Array<{ odHash: string; nickname: string; weight: number; }>;
}

export interface VoteState {
    currentVote: {
        id: string;
        title: string;
        options: VoteOption[];
        status: 'pending' | 'active' | 'ended';
        totalVotes: number;
        mode: 'chat' | 'donation';
        allowMultiple: boolean;
        minDonation: number;
        timerSeconds: number | null;
    } | null;
    remainingSeconds: number;
}

export interface DrawParticipant {
    id: string;
    userIdHash: string;
    nickname: string;
    role: string;
}

export interface DrawState {
    isRecruiting: boolean;
    status: 'idle' | 'recruiting' | 'pending' | 'picking' | 'ended';
    participantCount: number;
    participants: DrawParticipant[];
    keyword: string | null;
    subsOnly: boolean;
    excludeWinners: boolean;
    previousWinnersCount: number;
    winner: DrawParticipant | null;
}

export interface RouletteItem {
    id: string;
    label: string;
    weight: number;
    color?: string;
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
    // [Fix] overlay 타입 추가
    overlay: {
        isVisible: boolean;
        currentView: 'none' | 'vote' | 'draw' | 'roulette';
    };
}