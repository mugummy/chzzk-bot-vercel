import { useState, useEffect, useMemo } from 'react';
import { useBotStore } from '@/lib/store';
import { Disc, Plus, Trash2, Play, RotateCcw, Eye, Sparkles, X, Star, Crown, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 축하 파티클 컴포넌트
const Confetti = () => {
  const particles = useMemo(() =>
    Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2,
      size: 8 + Math.random() * 8,
      color: ['#6366f1', '#8b5cf6', '#fbbf24', '#f472b6', '#60a5fa', '#34d399', '#a855f7'][Math.floor(Math.random() * 7)]
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            y: '100vh',
            opacity: [1, 1, 0],
            rotate: 720,
            scale: [1, 1.2, 0.8]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
};

// 반짝이는 별 효과
const StarBurst = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 15 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.5, 0],
          opacity: [0, 1, 0],
          rotate: [0, 180]
        }}
        transition={{
          duration: 1.5,
          delay: Math.random() * 2,
          repeat: Infinity,
          repeatDelay: Math.random() * 2
        }}
      >
        <Star size={20} className="text-yellow-400" fill="currentColor" />
      </motion.div>
    ))}
  </div>
);

interface RouletteItem {
  id: string;
  label: string;
  weight: number;
  color: string;
}

const COLORS = [
  '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6',
  '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#10b981',
  '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444'
];

export default function RouletteTab({ onSend }: { onSend: (msg: any) => void }) {
  const { roulette } = useBotStore();

  // 로컬 상태 - 서버 상태와 동기화
  const [localItems, setLocalItems] = useState<RouletteItem[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newWeight, setNewWeight] = useState(1);

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedItem, setSelectedItem] = useState<RouletteItem | null>(null);
  const [showResult, setShowResult] = useState(false);

  // 서버 상태가 변경되면 로컬 상태에 반영
  useEffect(() => {
    if (roulette.items && roulette.items.length > 0) {
      setLocalItems(roulette.items);
    } else if (roulette.items && roulette.items.length === 0) {
      // 서버에서 빈 배열이 오면 로컬도 초기화
      setLocalItems([]);
    }
  }, [roulette.items]);

  // spinRouletteResult 이벤트 리스너
  useEffect(() => {
    const handleSpinResult = (e: CustomEvent<{ selectedItem: RouletteItem }>) => {
      const selected = e.detail.selectedItem;
      if (!selected || localItems.length === 0) return;

      setIsSpinning(true);
      setShowResult(false);

      // 선택된 항목의 인덱스 찾기
      const index = localItems.findIndex(item => item.id === selected.id);
      if (index === -1) return;

      // 룰렛 회전 계산
      const segmentAngle = 360 / localItems.length;
      const baseRotations = 360 * 5; // 5바퀴
      // 상단(12시) 포인터 기준으로 계산
      const targetAngle = baseRotations + (360 - (index * segmentAngle + segmentAngle / 2));

      setRotation(prev => prev + targetAngle);
      setSelectedItem(selected);

      // 스핀 완료 후 결과 표시
      setTimeout(() => {
        setIsSpinning(false);
        setShowResult(true);
      }, 5000);
    };

    window.addEventListener('spinRouletteResult', handleSpinResult as EventListener);
    return () => {
      window.removeEventListener('spinRouletteResult', handleSpinResult as EventListener);
    };
  }, [localItems]);

  const addItem = () => {
    if (!newLabel.trim()) return;

    const newItem: RouletteItem = {
      id: `item_${Date.now()}`,
      label: newLabel.trim(),
      weight: newWeight,
      color: COLORS[localItems.length % COLORS.length]
    };

    const updatedItems = [...localItems, newItem];
    setLocalItems(updatedItems);
    onSend({ type: 'updateRoulette', items: updatedItems });

    setNewLabel('');
    setNewWeight(1);
  };

  const removeItem = (id: string) => {
    const updatedItems = localItems.filter(item => item.id !== id);
    setLocalItems(updatedItems);
    onSend({ type: 'updateRoulette', items: updatedItems });
  };

  const updateItemColor = (id: string, color: string) => {
    const updatedItems = localItems.map(item =>
      item.id === id ? { ...item, color } : item
    );
    setLocalItems(updatedItems);
    onSend({ type: 'updateRoulette', items: updatedItems });
  };

  const spinRoulette = () => {
    if (localItems.length < 2 || isSpinning) return;
    onSend({ type: 'spinRoulette' });
    onSend({ type: 'toggleOverlay', visible: true, view: 'roulette' });
  };

  const resetRoulette = () => {
    if (confirm('룰렛을 초기화하시겠습니까?')) {
      setLocalItems([]);
      setRotation(0);
      setSelectedItem(null);
      setShowResult(false);
      onSend({ type: 'updateRoulette', items: [] });
      onSend({ type: 'resetRoulette' });
    }
  };

  const closeResult = () => {
    setShowResult(false);
    setSelectedItem(null);
  };

  // conic-gradient 문자열 생성
  const conicGradient = useMemo(() => {
    if (localItems.length === 0) return 'transparent';
    return `conic-gradient(${localItems.map((item, i) => {
      const start = (i / localItems.length) * 100;
      const end = ((i + 1) / localItems.length) * 100;
      return `${item.color} ${start}% ${end}%`;
    }).join(', ')})`;
  }, [localItems]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 왼쪽: 항목 관리 */}
      <div className="lg:col-span-5 space-y-6">
        {/* 항목 추가 */}
        <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-black flex items-center gap-2">
              <Disc className="text-indigo-500" size={20} /> 룰렛 항목
            </h3>
            <button
              onClick={resetRoulette}
              className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
              title="초기화"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="항목 이름"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
              onKeyDown={e => e.key === 'Enter' && addItem()}
            />
            <input
              type="number"
              min="1"
              max="10"
              value={newWeight}
              onChange={e => setNewWeight(Math.max(1, Number(e.target.value)))}
              className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white text-center font-bold focus:border-indigo-500 outline-none"
              title="가중치"
            />
            <button
              onClick={addItem}
              disabled={!newLabel.trim()}
              className="px-5 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* 항목 리스트 */}
          <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
            {localItems.length === 0 ? (
              <p className="text-center py-8 text-gray-500 text-sm">항목을 추가해주세요</p>
            ) : (
              localItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5 group hover:border-indigo-500/30 transition-all"
                >
                  {/* 색상 선택 */}
                  <input
                    type="color"
                    value={item.color}
                    onChange={e => updateItemColor(item.id, e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/10 bg-transparent"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1">
                    <p className="font-bold text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">가중치: {item.weight}</p>
                  </div>
                  <span className="text-xs font-mono text-gray-500 bg-black/30 px-2 py-1 rounded">
                    {index + 1}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 액션 버튼 - 시청자가 보기 좋게 */}
        <motion.button
          onClick={spinRoulette}
          disabled={localItems.length < 2 || isSpinning}
          className={`w-full py-5 rounded-xl font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3 ${
            localItems.length < 2 || isSpinning
              ? 'bg-white/5 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-indigo-500/30'
          }`}
          whileHover={localItems.length >= 2 && !isSpinning ? { scale: 1.02, boxShadow: '0 0 40px rgba(99, 102, 241, 0.5)' } : {}}
          whileTap={localItems.length >= 2 && !isSpinning ? { scale: 0.98 } : {}}
          animate={isSpinning ? { boxShadow: ['0 0 20px rgba(99,102,241,0.3)', '0 0 40px rgba(168,85,247,0.5)', '0 0 20px rgba(99,102,241,0.3)'] } : {}}
          transition={{ duration: 1, repeat: isSpinning ? Infinity : 0 }}
        >
          {isSpinning ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Disc size={24} />
              </motion.div>
              돌리는 중...
            </>
          ) : (
            <>
              <Play size={24} fill="currentColor" />
              룰렛 돌리기!
            </>
          )}
        </motion.button>

        {/* 오버레이 버튼 */}
        <motion.button
          onClick={() => onSend({ type: 'toggleOverlay', visible: true, view: 'roulette' })}
          className="w-full py-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl font-bold text-indigo-400 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Eye size={18} /> 오버레이 보기
        </motion.button>
      </div>

      {/* 오른쪽: 룰렛 미리보기 - 시청자가 보기 좋게 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="lg:col-span-7 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900/80 to-black border border-white/10 rounded-2xl p-10 relative overflow-hidden min-h-[500px]"
      >
        {/* 배경 장식 */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        {isSpinning && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}

        <div className="relative z-10">
          {/* 포인터 - 더 눈에 띄게 */}
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2 z-20"
            animate={isSpinning ? { y: [0, 5, 0] } : {}}
            transition={{ duration: 0.2, repeat: Infinity }}
          >
            <div className="w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-t-[50px] border-t-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
          </motion.div>

          {/* 룰렛 본체 - 더 화려하게 */}
          <div className="relative">
            {/* 외곽 글로우 */}
            {localItems.length > 0 && (
              <motion.div
                className="absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-xl"
                animate={{ opacity: isSpinning ? [0.3, 0.6, 0.3] : 0.2 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}

            <motion.div
              className="relative w-80 h-80 md:w-96 md:h-96 rounded-full border-8 border-white/30 shadow-2xl overflow-hidden"
              style={{ background: localItems.length > 0 ? conicGradient : '#1a1a1a' }}
              animate={{ rotate: rotation }}
              transition={{ duration: 5, ease: [0.15, 0, 0.15, 1] }}
            >
              {localItems.length === 0 ? (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center text-gray-600 text-center p-8"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div>
                    <Sparkles size={56} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold text-lg">항목을 추가하면</p>
                    <p className="font-bold text-lg">룰렛이 표시됩니다</p>
                  </div>
                </motion.div>
              ) : (
              <>
                {/* 텍스트 레이블 */}
                {localItems.map((item, i) => {
                  const angle = (i * (360 / localItems.length)) + (360 / localItems.length / 2);
                  return (
                    <div
                      key={item.id}
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-1/2 origin-bottom flex justify-center pt-6 pointer-events-none"
                      style={{ transform: `rotate(${angle}deg)` }}
                    >
                      <span
                        className="font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap uppercase tracking-tight"
                        style={{
                          writingMode: 'vertical-rl',
                          fontSize: localItems.length > 8 ? '12px' : localItems.length > 5 ? '14px' : '18px'
                        }}
                      >
                        {item.label.length > 8 ? item.label.slice(0, 8) + '..' : item.label}
                      </span>
                    </div>
                  );
                })}
                {/* 중앙 원 - 더 화려하게 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-white to-gray-200 rounded-full shadow-2xl flex items-center justify-center border-4 border-white"
                    animate={isSpinning ? { scale: [1, 0.95, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <span className="font-black text-black text-base tracking-wider">SPIN</span>
                  </motion.div>
                </div>
              </>
            )}
            </motion.div>
          </div>
        </div>

        {/* 항목 수 표시 - 더 화려하게 */}
        <motion.div
          className="mt-8 z-10 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10">
            <Disc size={18} className="text-indigo-400" />
            <span className="text-white font-black text-lg">{localItems.length}</span>
            <span className="text-gray-400 font-bold">개 항목</span>
            {localItems.length > 0 && localItems.length < 2 && (
              <motion.span
                className="text-yellow-400 font-bold bg-yellow-400/20 px-3 py-1 rounded-full text-sm"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                최소 2개 필요!
              </motion.span>
            )}
          </div>
          {localItems.length >= 2 && !isSpinning && (
            <motion.p
              className="text-indigo-400 text-sm font-bold mt-3"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              룰렛을 돌려보세요!
            </motion.p>
          )}
        </motion.div>
      </motion.div>

      {/* 결과 모달 */}
      <AnimatePresence>
        {showResult && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
            onClick={closeResult}
          >
            {/* 축하 효과 */}
            <Confetti />
            <StarBurst />

            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative max-w-lg w-full z-10"
              onClick={e => e.stopPropagation()}
            >
              {/* 글로우 효과 */}
              <motion.div
                className="absolute -inset-2 rounded-[2.5rem] blur-2xl opacity-60"
                style={{ backgroundColor: selectedItem.color }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <div
                className="relative bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-12 rounded-[2rem] border-4 shadow-2xl"
                style={{ borderColor: selectedItem.color }}
              >
                <button
                  onClick={closeResult}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>

                <div className="text-center">
                  <motion.p
                    className="text-sm font-black uppercase tracking-[0.5em] text-indigo-400 mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Congratulations!
                  </motion.p>

                  <motion.div
                    className="relative w-32 h-32 mx-auto mb-8"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                  >
                    {/* 외부 글로우 링 */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: selectedItem.color }}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    {/* 메인 원 */}
                    <div
                      className="absolute inset-2 rounded-full flex items-center justify-center shadow-2xl"
                      style={{ backgroundColor: selectedItem.color }}
                    >
                      <Crown size={56} className="text-white drop-shadow-lg" fill="currentColor" />
                    </div>
                  </motion.div>

                  <motion.h2
                    className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-8 break-all"
                    style={{ color: selectedItem.color }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                  >
                    {selectedItem.label}
                  </motion.h2>

                  <motion.div
                    className="flex justify-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.button
                      onClick={closeResult}
                      className="px-8 py-3 bg-white/10 rounded-full font-bold hover:bg-white/20 transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      닫기
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        closeResult();
                        spinRoulette();
                      }}
                      className="px-8 py-3 rounded-full font-black transition-all"
                      style={{ backgroundColor: selectedItem.color }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      다시 돌리기
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
