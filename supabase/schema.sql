-- Supabase Schema for Chzzk Bot
-- 이 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USERS ====================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chzzk_id VARCHAR(255) UNIQUE NOT NULL,
    channel_id VARCHAR(255) UNIQUE NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    profile_image TEXT,
    nid_auth TEXT,  -- 암호화된 치지직 인증 정보
    nid_session TEXT,  -- 암호화된 치지직 세션
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== BOT SETTINGS ====================
CREATE TABLE bot_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    prefix VARCHAR(10) DEFAULT '!',
    points_enabled BOOLEAN DEFAULT true,
    points_per_chat INTEGER DEFAULT 10,
    points_name VARCHAR(50) DEFAULT '포인트',
    song_request_enabled BOOLEAN DEFAULT true,
    song_max_duration INTEGER DEFAULT 600,  -- 최대 10분
    song_max_queue INTEGER DEFAULT 50,
    participation_keyword VARCHAR(50) DEFAULT '!시참',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== COMMANDS ====================
CREATE TABLE commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    triggers TEXT[] NOT NULL,  -- ['!핑', '!pong']
    response TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    total_count INTEGER DEFAULT 0,
    user_counts JSONB DEFAULT '{}',  -- {"userHash": count}
    editor_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 명령어 빠른 조회를 위한 인덱스
CREATE INDEX idx_commands_user_id ON commands(user_id);
CREATE INDEX idx_commands_triggers ON commands USING GIN(triggers);

-- ==================== COUNTERS ====================
CREATE TABLE counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trigger VARCHAR(255) NOT NULL,
    response TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    total_count INTEGER DEFAULT 0,
    user_counts JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, trigger)
);

CREATE INDEX idx_counters_user_trigger ON counters(user_id, trigger);

-- ==================== VIEWER POINTS ====================
CREATE TABLE viewer_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewer_hash VARCHAR(255) NOT NULL,
    viewer_nickname VARCHAR(255) NOT NULL,
    points INTEGER DEFAULT 0,
    last_chat_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, viewer_hash)
);

CREATE INDEX idx_viewer_points_user_id ON viewer_points(user_id);
CREATE INDEX idx_viewer_points_ranking ON viewer_points(user_id, points DESC);

-- ==================== VOTES ====================
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,  -- [{"id": "1", "text": "옵션1"}, ...]
    results JSONB DEFAULT '{}',  -- {"1": 10, "2": 5}
    voter_choices JSONB DEFAULT '[]',  -- [{"userHash": "...", "optionId": "1", "nickname": "..."}]
    is_active BOOLEAN DEFAULT false,
    duration_seconds INTEGER DEFAULT 60,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    voters TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_active ON votes(user_id, is_active);

-- ==================== SONG QUEUE ====================
CREATE TABLE song_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    video_id VARCHAR(20) NOT NULL,
    title TEXT NOT NULL,
    duration INTEGER NOT NULL,
    thumbnail TEXT,
    requester_nickname VARCHAR(255) NOT NULL,
    requester_hash VARCHAR(255) NOT NULL,
    is_played BOOLEAN DEFAULT false,
    position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_song_queue_user_id ON song_queue(user_id, is_played, position);

-- ==================== BOT SESSIONS ====================
-- 봇 실행 상태 추적
CREATE TABLE bot_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    is_active BOOLEAN DEFAULT false,
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== MACROS ====================
CREATE TABLE macros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    interval_seconds INTEGER NOT NULL,
    enabled BOOLEAN DEFAULT false,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_macros_user_id ON macros(user_id);

-- ==================== DRAW SESSIONS ====================
-- 시청자 추첨
CREATE TABLE draw_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    keyword VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'collecting',  -- collecting, stopped, completed
    participants JSONB DEFAULT '[]',
    winners JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX idx_draw_sessions_user_id ON draw_sessions(user_id);

-- ==================== ROW LEVEL SECURITY ====================
-- 사용자별 데이터 자동 분리

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewer_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE macros ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (사용자는 자신의 데이터만 접근 가능)
CREATE POLICY "Users can view own data" ON users
    FOR ALL USING (auth.uid()::text = chzzk_id);

CREATE POLICY "Users can manage own settings" ON bot_settings
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE chzzk_id = auth.uid()::text));

CREATE POLICY "Users can manage own commands" ON commands
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE chzzk_id = auth.uid()::text));

CREATE POLICY "Users can manage own counters" ON counters
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE chzzk_id = auth.uid()::text));

CREATE POLICY "Users can manage own points" ON viewer_points
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE chzzk_id = auth.uid()::text));

CREATE POLICY "Users can manage own votes" ON votes
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE chzzk_id = auth.uid()::text));

CREATE POLICY "Users can manage own songs" ON song_queue
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE chzzk_id = auth.uid()::text));

CREATE POLICY "Users can manage own sessions" ON bot_sessions
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE chzzk_id = auth.uid()::text));

CREATE POLICY "Users can manage own macros" ON macros
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE chzzk_id = auth.uid()::text));

CREATE POLICY "Users can manage own draws" ON draw_sessions
    FOR ALL USING (user_id IN (SELECT id FROM users WHERE chzzk_id = auth.uid()::text));

-- ==================== FUNCTIONS ====================

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bot_settings_updated_at BEFORE UPDATE ON bot_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_commands_updated_at BEFORE UPDATE ON commands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_counters_updated_at BEFORE UPDATE ON counters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_viewer_points_updated_at BEFORE UPDATE ON viewer_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_macros_updated_at BEFORE UPDATE ON macros
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==================== REALTIME ====================
-- Supabase Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE commands;
ALTER PUBLICATION supabase_realtime ADD TABLE counters;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
ALTER PUBLICATION supabase_realtime ADD TABLE song_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE bot_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE draw_sessions;
