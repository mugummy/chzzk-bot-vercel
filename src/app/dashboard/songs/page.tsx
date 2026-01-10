'use client';

import { useState, useEffect } from 'react';

interface Song {
  id: string;
  video_id: string;
  title: string;
  duration: number;
  requester_nickname: string;
  is_played: boolean;
  created_at: string;
}

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const res = await fetch('/api/songs');
      if (res.ok) {
        const data = await res.json();
        setSongs(data.queue || []);
        setCurrentSong(data.current || null);
      }
    } catch (error) {
      console.error('Failed to fetch songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await fetch('/api/songs/skip', { method: 'POST' });
      fetchSongs();
    } catch (error) {
      console.error('Failed to skip song:', error);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/songs/${id}`, { method: 'DELETE' });
      fetchSongs();
    } catch (error) {
      console.error('Failed to remove song:', error);
    }
  };

  const handleClearQueue = async () => {
    if (!confirm('대기열을 모두 삭제하시겠습니까?')) return;

    try {
      await fetch('/api/songs/clear', { method: 'POST' });
      fetchSongs();
    } catch (error) {
      console.error('Failed to clear queue:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">노래 신청</h1>
          <p className="text-gray-400">신청된 노래 목록을 관리합니다</p>
        </div>
        <button
          onClick={handleClearQueue}
          disabled={songs.length === 0}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition"
        >
          대기열 비우기
        </button>
      </div>

      {/* Now Playing */}
      {currentSong && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm text-white">
              현재 재생 중
            </span>
            <button
              onClick={handleSkip}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-1 rounded-lg transition text-sm"
            >
              스킵
            </button>
          </div>
          <div className="flex items-center gap-4">
            <img
              src={`https://i.ytimg.com/vi/${currentSong.video_id}/mqdefault.jpg`}
              alt={currentSong.title}
              className="w-32 h-20 object-cover rounded-lg"
            />
            <div>
              <h3 className="text-lg font-semibold text-white line-clamp-1">
                {currentSong.title}
              </h3>
              <p className="text-white/80 text-sm">
                신청: {currentSong.requester_nickname} • {formatDuration(currentSong.duration)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Queue */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white">
            대기열 ({songs.length}곡)
          </h2>
        </div>

        {songs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              대기열이 비어있습니다
            </h3>
            <p className="text-gray-400">
              시청자가 !노래 명령어로 노래를 신청할 수 있습니다
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {songs.map((song, index) => (
              <div
                key={song.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-gray-700/50"
              >
                <span className="text-gray-500 w-6 text-center">{index + 1}</span>
                <img
                  src={`https://i.ytimg.com/vi/${song.video_id}/default.jpg`}
                  alt={song.title}
                  className="w-20 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{song.title}</h4>
                  <p className="text-sm text-gray-400">
                    신청: {song.requester_nickname} • {formatDuration(song.duration)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(song.id)}
                  className="text-gray-400 hover:text-red-400 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <h4 className="font-medium text-gray-300 mb-2">채팅 명령어</h4>
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          <div className="flex gap-2">
            <span className="text-purple-400">!노래 [URL]</span>
            <span className="text-gray-500">- 노래 신청</span>
          </div>
          <div className="flex gap-2">
            <span className="text-purple-400">!대기열</span>
            <span className="text-gray-500">- 대기열 확인</span>
          </div>
          <div className="flex gap-2">
            <span className="text-purple-400">!현재노래</span>
            <span className="text-gray-500">- 현재 곡 정보</span>
          </div>
          <div className="flex gap-2">
            <span className="text-purple-400">!스킵</span>
            <span className="text-gray-500">- 스킵 (매니저 전용)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
