'use client';

import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface RouletteItem {
  id: string;
  text: string;
  weight: number;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
];

export default function RoulettePage() {
  const { botConnected, rouletteState, send, on } = useWebSocket();
  const [items, setItems] = useState<RouletteItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [result, setResult] = useState<{ text: string } | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // 룰렛 상태 동기화
  useEffect(() => {
    if (rouletteState?.items) {
      setItems(rouletteState.items);
    }
  }, [rouletteState]);

  // 스핀 결과 수신
  useEffect(() => {
    const unsub = on('rouletteSpinResult', (data: any) => {
      if (data.success && data.payload) {
        const { result, spinDegree, animationDuration } = data.payload;

        setIsSpinning(true);

        // 휠 회전 애니메이션
        if (wheelRef.current) {
          wheelRef.current.style.transition = 'none';
          wheelRef.current.style.transform = `rotate(${currentRotation}deg)`;
          // Force reflow
          wheelRef.current.offsetHeight;
          wheelRef.current.style.transition = `transform ${animationDuration / 1000}s cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
          wheelRef.current.style.transform = `rotate(${spinDegree}deg)`;

          setCurrentRotation(spinDegree % 360);
        }

        // 애니메이션 끝나면 결과 표시
        setTimeout(() => {
          setIsSpinning(false);
          setResult(result);
        }, animationDuration);
      }
    });

    return unsub;
  }, [on, currentRotation]);

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    const item: RouletteItem = {
      id: Date.now().toString(),
      text: newItem.trim(),
      weight: 1,
    };
    setItems([...items, item]);
    setNewItem('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateWeight = (id: string, weight: number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, weight: Math.max(1, weight) } : item
    ));
  };

  const handleCreateRoulette = () => {
    if (items.length < 2) {
      alert('최소 2개의 항목이 필요합니다.');
      return;
    }
    send({
      type: 'createRoulette',
      items,
    });
  };

  const handleSpin = () => {
    if (isSpinning) return;
    setResult(null);
    send({ type: 'spinRoulette' });
  };

  const handleReset = () => {
    send({ type: 'resetRoulette' });
    setItems([]);
    setResult(null);
    setCurrentRotation(0);
    if (wheelRef.current) {
      wheelRef.current.style.transition = 'none';
      wheelRef.current.style.transform = 'rotate(0deg)';
    }
  };

  // SVG 룰렛 휠 생성
  const renderWheel = () => {
    if (items.length === 0) return null;

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let currentAngle = 0;

    return (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {items.map((item, index) => {
          const sweepAngle = (item.weight / totalWeight) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + sweepAngle;
          currentAngle = endAngle;

          const startRad = (startAngle - 90) * Math.PI / 180;
          const endRad = (endAngle - 90) * Math.PI / 180;

          const x1 = 100 + 95 * Math.cos(startRad);
          const y1 = 100 + 95 * Math.sin(startRad);
          const x2 = 100 + 95 * Math.cos(endRad);
          const y2 = 100 + 95 * Math.sin(endRad);

          const largeArc = sweepAngle > 180 ? 1 : 0;

          const path = `M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArc} 1 ${x2} ${y2} Z`;

          // 텍스트 위치 (중간 각도)
          const midAngle = (startAngle + endAngle) / 2;
          const midRad = (midAngle - 90) * Math.PI / 180;
          const textX = 100 + 55 * Math.cos(midRad);
          const textY = 100 + 55 * Math.sin(midRad);

          return (
            <g key={item.id}>
              <path
                d={path}
                fill={COLORS[index % COLORS.length]}
                stroke="white"
                strokeWidth="1"
              />
              <text
                x={textX}
                y={textY}
                fill="white"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
              >
                {item.text.length > 8 ? item.text.slice(0, 8) + '...' : item.text}
              </text>
            </g>
          );
        })}
        {/* 중앙 원 */}
        <circle cx="100" cy="100" r="15" fill="#1a1a2e" stroke="white" strokeWidth="2" />
      </svg>
    );
  };

  if (!botConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-6xl mb-4">🤖</div>
        <h2 className="text-xl font-bold text-white mb-2">봇이 연결되지 않았습니다</h2>
        <p className="text-gray-400 mb-4">설정 페이지에서 봇을 먼저 시작해주세요.</p>
        <a
          href="/dashboard/settings"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition"
        >
          설정으로 이동
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">룰렛</h1>
        <p className="text-gray-400">랜덤 선택이 필요할 때 사용하세요</p>
      </div>

      {/* Result Display */}
      {result && (
        <div className="bg-gradient-to-r from-fuchsia-500 to-purple-600 rounded-xl p-8 text-center animate-pulse">
          <div className="text-6xl mb-4">🎊</div>
          <h2 className="text-2xl font-bold text-white mb-2">결과!</h2>
          <p className="text-4xl font-bold text-white">{result.text}</p>
          <button
            onClick={() => setResult(null)}
            className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition"
          >
            닫기
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Wheel */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">룰렛 휠</h3>

          <div className="relative">
            {/* 포인터 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-yellow-400 drop-shadow-lg" />
            </div>

            {/* 휠 */}
            <div
              ref={wheelRef}
              className="w-full aspect-square max-w-[400px] mx-auto"
              style={{ transform: `rotate(${currentRotation}deg)` }}
            >
              {items.length > 0 ? (
                renderWheel()
              ) : (
                <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center">
                  <p className="text-gray-500">항목을 추가해주세요</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6 justify-center">
            <button
              onClick={handleCreateRoulette}
              disabled={items.length < 2}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition"
            >
              룰렛 생성
            </button>
            <button
              onClick={handleSpin}
              disabled={isSpinning || !rouletteState?.items?.length}
              className={`px-6 py-2 rounded-lg text-white font-semibold transition ${
                isSpinning
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isSpinning ? '돌리는 중...' : '돌리기!'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white transition"
            >
              초기화
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">항목 설정</h3>

          {/* Add Item */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="새 항목 입력"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={handleAddItem}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition"
            >
              추가
            </button>
          </div>

          {/* Item List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>항목을 추가해주세요</p>
                <p className="text-sm mt-1">최소 2개 이상 필요합니다</p>
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg"
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="flex-1 text-white truncate">{item.text}</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">가중치:</label>
                    <input
                      type="number"
                      value={item.weight}
                      onChange={(e) => handleUpdateWeight(item.id, parseInt(e.target.value) || 1)}
                      min="1"
                      max="10"
                      className="w-14 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-center text-sm"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-gray-400 hover:text-red-400 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick Add */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-2">빠른 추가</p>
            <div className="flex flex-wrap gap-2">
              {['예', '아니오', '패스', '다시', '1번', '2번', '3번'].map((text) => (
                <button
                  key={text}
                  onClick={() => {
                    const item: RouletteItem = {
                      id: Date.now().toString(),
                      text,
                      weight: 1,
                    };
                    setItems([...items, item]);
                  }}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition"
                >
                  + {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <h4 className="font-medium text-gray-300 mb-2">사용 방법</h4>
        <ul className="text-sm text-gray-500 space-y-1">
          <li>1. 원하는 항목들을 추가합니다</li>
          <li>2. 가중치를 조절하면 해당 항목이 선택될 확률이 변합니다</li>
          <li>3. "룰렛 생성" 버튼을 눌러 룰렛을 만듭니다</li>
          <li>4. "돌리기" 버튼을 눌러 결과를 확인합니다</li>
        </ul>
      </div>
    </div>
  );
}
