'use client';

import { useState, useEffect } from 'react';

interface ViewerPoints {
  id: string;
  viewer_id: string;
  viewer_name: string;
  points: number;
  updated_at: string;
}

export default function PointsPage() {
  const [points, setPoints] = useState<ViewerPoints[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    try {
      const res = await fetch('/api/points?limit=100');
      const data = await res.json();
      setPoints(data.points || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch points:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (viewer: ViewerPoints) => {
    setEditingId(viewer.id);
    setEditValue(viewer.points.toString());
  };

  const handleEditSave = async (viewerId: string) => {
    try {
      await fetch('/api/points', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewerId,
          points: parseInt(editValue),
          action: 'set',
        }),
      });
      setEditingId(null);
      fetchPoints();
    } catch (error) {
      console.error('Failed to update points:', error);
    }
  };

  const filteredPoints = points.filter((p) =>
    p.viewer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-white">포인트 관리</h1>
          <p className="text-gray-400">시청자 포인트를 관리합니다</p>
        </div>
        <div className="text-sm text-gray-400">
          총 {total}명의 시청자
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="시청자 검색..."
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* Points Table */}
      {filteredPoints.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchTerm ? '검색 결과가 없습니다' : '아직 포인트 데이터가 없습니다'}
          </h3>
          <p className="text-gray-400">
            {searchTerm
              ? '다른 검색어를 시도해보세요'
              : '시청자가 채팅에 참여하면 자동으로 포인트가 쌓입니다'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  순위
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  시청자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  포인트
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  최근 활동
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredPoints.map((viewer, index) => (
                <tr key={viewer.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`font-bold ${
                        index === 0
                          ? 'text-yellow-400'
                          : index === 1
                          ? 'text-gray-300'
                          : index === 2
                          ? 'text-amber-600'
                          : 'text-gray-500'
                      }`}
                    >
                      #{index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-white font-medium">
                      {viewer.viewer_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === viewer.id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-24 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white focus:border-purple-500 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="text-purple-400 font-semibold">
                        {viewer.points.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                    {new Date(viewer.updated_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {editingId === viewer.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditSave(viewer.viewer_id)}
                          className="text-green-400 hover:text-green-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditStart(viewer)}
                        className="text-gray-400 hover:text-white"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
