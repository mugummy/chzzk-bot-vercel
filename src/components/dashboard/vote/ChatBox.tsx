'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';

interface ChatMessage {
  text: string;
  emoji?: string;
}

interface ChatBoxProps {
  visible: boolean;
  messages: ChatMessage[];
  winnerName: string;
}

export default function ChatBox({ visible, messages, winnerName }: ChatBoxProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ maxHeight: 0, opacity: 0, y: -20 }}
          animate={{ maxHeight: 400, opacity: 1, y: 0 }}
          exit={{ maxHeight: 0, opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-b-xl flex flex-col pt-2 pb-4 z-10 -mt-1 shadow-2xl relative overflow-hidden"
          style={{
            background: 'rgba(20, 20, 20, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 -10px 40px -10px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Neon Line */}
          <div
            className="w-full h-[1px] mb-4 opacity-70"
            style={{
              background: 'linear-gradient(to right, transparent, #00ff80, transparent)',
              boxShadow: '0 0 15px #00ff80'
            }}
          />

          <div
            ref={chatContainerRef}
            className="flex flex-col gap-4 w-full px-6 max-h-[350px] overflow-y-auto custom-scrollbar pt-2"
          >
            <AnimatePresence>
              {messages.map((chat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex gap-3 items-start w-full"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center shrink-0 border border-[#00ff80] shadow-md overflow-hidden relative">
                    <div className="absolute inset-0 bg-[#00ff80] opacity-10" />
                    <User className="text-white" size={16} />
                  </div>

                  {/* Bubble */}
                  <div className="flex flex-col max-w-[85%]">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-bold text-[#00ff80] drop-shadow-sm">{winnerName}</span>
                      <span className="text-[10px] text-gray-400">방금 전</span>
                    </div>
                    <div className="relative bg-white/10 backdrop-blur-sm text-white px-4 py-2.5 rounded-2xl rounded-tl-none border border-white/10 shadow-lg text-sm leading-relaxed">
                      {chat.text}
                      {chat.emoji && (
                        <div className="absolute -right-2 -top-2 text-xl animate-bounce">{chat.emoji}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
