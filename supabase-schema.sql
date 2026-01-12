-- Supabase 데이터베이스 스키마
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chzzk_id TEXT UNIQUE NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 봇 설정 테이블
CREATE TABLE IF NOT EXISTS bot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  prefix TEXT DEFAULT '!',
  points_enabled BOOLEAN DEFAULT TRUE,
  points_per_chat INTEGER DEFAULT 10,
  points_name TEXT DEFAULT '포인트',
  points_cooldown INTEGER DEFAULT 60,
  song_request_enabled BOOLEAN DEFAULT TRUE,
  song_request_mode TEXT DEFAULT 'cooldown',
  song_request_cooldown INTEGER DEFAULT 300,
  song_request_min_donation INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 봇 세션 테이블 (활성화/비활성화 관리)
CREATE TABLE IF NOT EXISTS bot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 명령어 테이블
CREATE TABLE IF NOT EXISTS commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  triggers TEXT[] NOT NULL,
  response TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  total_count INTEGER DEFAULT 0,
  editor_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 카운터 테이블
CREATE TABLE IF NOT EXISTS counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trigger TEXT NOT NULL,
  response TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시청자 포인트 테이블
CREATE TABLE IF NOT EXISTS viewer_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  viewer_hash TEXT NOT NULL,
  viewer_nickname TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  last_chat_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, viewer_hash)
);

-- 노래 대기열 테이블
CREATE TABLE IF NOT EXISTS song_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  requester_nickname TEXT NOT NULL,
  requester_hash TEXT NOT NULL,
  is_played BOOLEAN DEFAULT FALSE,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_commands_user_id ON commands(user_id);
CREATE INDEX IF NOT EXISTS idx_counters_user_id ON counters(user_id);
CREATE INDEX IF NOT EXISTS idx_viewer_points_user_id ON viewer_points(user_id);
CREATE INDEX IF NOT EXISTS idx_viewer_points_points ON viewer_points(points DESC);
CREATE INDEX IF NOT EXISTS idx_song_queue_user_id ON song_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_is_active ON bot_sessions(is_active);

-- RLS (Row Level Security) 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewer_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_queue ENABLE ROW LEVEL SECURITY;

-- Service Role은 모든 작업 가능 (서버에서 사용)
-- 실제 배포 시 더 세밀한 정책 필요

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bot_settings_updated_at
  BEFORE UPDATE ON bot_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commands_updated_at
  BEFORE UPDATE ON commands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_counters_updated_at
  BEFORE UPDATE ON counters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Realtime 활성화 (대시보드 실시간 업데이트용)
ALTER PUBLICATION supabase_realtime ADD TABLE commands;
ALTER PUBLICATION supabase_realtime ADD TABLE counters;
ALTER PUBLICATION supabase_realtime ADD TABLE viewer_points;
ALTER PUBLICATION supabase_realtime ADD TABLE bot_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE bot_settings;
