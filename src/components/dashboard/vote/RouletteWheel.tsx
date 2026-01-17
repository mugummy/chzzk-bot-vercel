'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface RouletteItem {
  id: string;
  name: string;
  weight: number;
  color: string;
}

interface RouletteWheelProps {
  items: RouletteItem[];
  spinning: boolean;
  targetRotation: number;
  onSpinComplete: () => void;
}

const COLORS = [
  '#ff6b6b', '#4ecdc4', '#ffe66d', '#00ff80',
  '#ff9f43', '#a55eea', '#26de81', '#fd79a8',
  '#0984e3', '#6c5ce7', '#00b894', '#e17055'
];

export default function RouletteWheel({
  items,
  spinning,
  targetRotation,
  onSpinComplete
}: RouletteWheelProps) {
  const [currentRotation, setCurrentRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  // 총 가중치 계산
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  // 각 섹션의 각도 계산
  const sections = items.map((item, index) => {
    const startAngle = items
      .slice(0, index)
      .reduce((sum, i) => sum + (i.weight / totalWeight) * 360, 0);
    const angle = (item.weight / totalWeight) * 360;

    return {
      ...item,
      startAngle,
      angle,
      color: item.color || COLORS[index % COLORS.length]
    };
  });

  useEffect(() => {
    if (spinning && targetRotation > 0) {
      setCurrentRotation(targetRotation);
    }
  }, [spinning, targetRotation]);

  // SVG 호(arc) 경로 생성
  const createArcPath = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', centerX, centerY,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ');
  };

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  // 텍스트 위치 계산
  const getTextPosition = (startAngle: number, angle: number, radius: number) => {
    const midAngle = startAngle + angle / 2;
    const textRadius = radius * 0.65;
    return polarToCartesian(150, 150, textRadius, midAngle);
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* 외부 글로우 */}
      <div
        className="absolute w-[340px] h-[340px] rounded-full"
        style={{
          background: spinning
            ? 'radial-gradient(circle, rgba(255, 107, 107, 0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255, 107, 107, 0.1) 0%, transparent 70%)',
          filter: 'blur(20px)'
        }}
      />

      {/* 룰렛 휠 */}
      <motion.div
        ref={wheelRef}
        className="relative"
        animate={{ rotate: currentRotation }}
        transition={{
          duration: spinning ? 5 : 0,
          ease: [0.25, 0.1, 0.25, 1], // 커스텀 이징
          onComplete: spinning ? onSpinComplete : undefined
        }}
        onAnimationComplete={() => {
          if (spinning) {
            onSpinComplete();
          }
        }}
      >
        <svg width="300" height="300" viewBox="0 0 300 300">
          {/* 배경 원 */}
          <circle
            cx="150"
            cy="150"
            r="148"
            fill="#111"
            stroke="#333"
            strokeWidth="4"
          />

          {/* 섹션들 */}
          {sections.map((section, index) => (
            <g key={section.id}>
              {/* 섹션 배경 */}
              <path
                d={createArcPath(
                  150,
                  150,
                  140,
                  section.startAngle,
                  section.startAngle + section.angle
                )}
                fill={section.color}
                stroke="#000"
                strokeWidth="2"
                style={{
                  filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))'
                }}
              />

              {/* 섹션 텍스트 */}
              {section.angle > 15 && (
                <text
                  x={getTextPosition(section.startAngle, section.angle, 140).x}
                  y={getTextPosition(section.startAngle, section.angle, 140).y}
                  fill="#fff"
                  fontSize={section.angle > 30 ? '12' : '10'}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${section.startAngle + section.angle / 2}, ${
                    getTextPosition(section.startAngle, section.angle, 140).x
                  }, ${getTextPosition(section.startAngle, section.angle, 140).y})`}
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    pointerEvents: 'none'
                  }}
                >
                  {section.name.length > 8
                    ? section.name.slice(0, 8) + '...'
                    : section.name}
                </text>
              )}
            </g>
          ))}

          {/* 중앙 원 */}
          <circle
            cx="150"
            cy="150"
            r="25"
            fill="#1a1a1a"
            stroke="#ff6b6b"
            strokeWidth="3"
          />
          <circle
            cx="150"
            cy="150"
            r="15"
            fill="#ff6b6b"
          />
        </svg>
      </motion.div>

      {/* 포인터 (화살표) */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
        <motion.div
          animate={spinning ? { y: [0, 5, 0] } : {}}
          transition={{ duration: 0.3, repeat: spinning ? Infinity : 0 }}
        >
          <svg width="40" height="50" viewBox="0 0 40 50">
            <defs>
              <filter id="pointer-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#ff6b6b" floodOpacity="0.5" />
              </filter>
            </defs>
            <path
              d="M20 45 L5 15 L20 25 L35 15 Z"
              fill="#ff6b6b"
              stroke="#fff"
              strokeWidth="2"
              filter="url(#pointer-shadow)"
            />
          </svg>
        </motion.div>
      </div>

      {/* 스피닝 이펙트 */}
      {spinning && (
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: '2px solid rgba(255, 107, 107, 0.5)'
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity
            }}
          />
        </div>
      )}

      {/* 항목이 없을 때 */}
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="300" height="300" viewBox="0 0 300 300">
            <circle
              cx="150"
              cy="150"
              r="140"
              fill="#1a1a1a"
              stroke="#333"
              strokeWidth="4"
            />
            <text
              x="150"
              y="150"
              fill="#666"
              fontSize="14"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              항목을 추가해주세요
            </text>
          </svg>
        </div>
      )}
    </div>
  );
}
