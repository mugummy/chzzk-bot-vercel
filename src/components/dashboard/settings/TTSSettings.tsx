'use client';

import React, { useState, useEffect } from 'react';
import { useVoteStore } from '@/stores/useVoteStore';
import Toggle from '@/components/ui/Toggle';
import { Volume2, Mic, Save, VolumeX } from 'lucide-react';

export default function TTSSettings() {
    const store = useVoteStore();
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState(store.ttsVoice);
    const [previewing, setPreviewing] = useState<string | null>(null);

    // Sync local selection with store initially
    useEffect(() => {
        setSelectedVoice(store.ttsVoice);
    }, [store.ttsVoice]);

    // Load Voices
    useEffect(() => {
        const loadVoices = () => {
            const v = window.speechSynthesis.getVoices();
            if (v.length > 0) {
                setVoices(v);
                // Auto-select Korean if not set
                if (!store.ttsVoice) {
                    const ko = v.find(voice => voice.lang.includes('ko'));
                    if (ko) setSelectedVoice(ko.name);
                }
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const handleSave = () => {
        store.updateTTSSettings({
            ...store, // actually store.updateTTSSettings takes object with specific keys
            volume: store.ttsVolume,
            rate: store.ttsRate,
            voice: selectedVoice,
            enabled: store.useTTS
        } as any);

        // Visual feedback
        alert('설정이 저장되었습니다.');
    };

    const handlePreview = (voice: SpeechSynthesisVoice, e: React.MouseEvent) => {
        e.stopPropagation();
        if (previewing) window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance("치지직 봇 테스트 메시지입니다.");
        utterance.voice = voice;
        utterance.volume = store.ttsVolume;
        utterance.rate = store.ttsRate;
        utterance.onend = () => setPreviewing(null);

        setPreviewing(voice.name);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="flex flex-col h-full p-8 overflow-y-auto custom-scroll animate-fadeIn relative">
            <h2 className="text-3xl font-black text-white mb-8 border-b border-white/10 pb-4 flex items-center gap-3">
                <Mic className="text-[#00ff80]" size={32} />
                <span className="text-[#00ff80]">TTS</span> SETTINGS
            </h2>

            <div className="max-w-6xl mx-auto w-full space-y-8 pb-20">
                {/* 1. Top Controls: Toggle & Volume */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Toggle Card */}
                    <div className="bg-[#262626] p-6 rounded-2xl border border-[#333] flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${store.useTTS ? 'bg-[#00ff80] text-black' : 'bg-[#333] text-gray-500'}`}>
                                {store.useTTS ? <Volume2 size={24} /> : <VolumeX size={24} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">TTS 사용</h3>
                                <p className="text-xs text-gray-400">채팅 및 알림 읽기</p>
                            </div>
                        </div>
                        <Toggle
                            checked={store.useTTS}
                            onChange={() => store.updateTTSSettings({ ...store, enabled: !store.useTTS, voice: selectedVoice } as any)}
                        />
                    </div>

                    {/* Volume Card */}
                    <div className="bg-[#262626] p-6 rounded-2xl border border-[#333] flex flex-col justify-center gap-2 shadow-lg">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-gray-300 flex items-center gap-2"><Volume2 size={16} /> 음량</span>
                            <span className="text-[#00ff80] font-bold font-mono">{Math.round(store.ttsVolume * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="1" step="0.05"
                            value={store.ttsVolume}
                            onChange={(e) => store.updateTTSSettings({ ...store, enabled: store.useTTS, volume: Number(e.target.value), voice: selectedVoice } as any)}
                            className="w-full h-3 bg-[#111] rounded-lg appearance-none cursor-pointer accent-[#00ff80]"
                        />
                    </div>
                </div>

                {/* 2. Voice Grid */}
                <div className="space-y-4">
                    <div className="flex items-end justify-between">
                        <h3 className="text-xl font-bold text-white">TTS를 읽을 음성을 선택하세요</h3>
                        <span className="text-xs text-gray-500">목소리가 보이지 않으면 브라우저 설정을 확인하세요</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {voices.map((voice) => {
                            const isSelected = selectedVoice === voice.name;
                            const isKorean = voice.lang.includes('ko') || voice.lang.includes('KO');

                            return (
                                <div
                                    key={voice.name}
                                    onClick={() => setSelectedVoice(voice.name)}
                                    className={`
                                        relative p-5 rounded-xl border-2 cursor-pointer transition-all group overflow-hidden
                                        ${isSelected
                                            ? 'bg-[#00ff80]/10 border-[#00ff80] shadow-[0_0_15px_rgba(0,255,128,0.2)]'
                                            : 'bg-[#262626] border-transparent hover:border-[#444] hover:bg-[#2f2f2f]'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold mb-1 uppercase ${isSelected ? 'text-[#00ff80]' : 'text-gray-500'}`}>
                                                {voice.lang}
                                            </span>
                                            <span className={`font-bold text-sm leading-tight ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                                {voice.name}
                                            </span>
                                        </div>
                                        {isKorean && <span className="text-[10px] bg-[#333] text-[#00ff80] px-1.5 py-0.5 rounded border border-[#00ff80]/30">KR</span>}
                                    </div>

                                    <button
                                        onClick={(e) => handlePreview(voice, e)}
                                        className={`absolute bottom-3 right-3 p-2 rounded-full transition-all z-20 ${previewing === voice.name ? 'text-[#00ff80] bg-white/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Volume2 size={16} className={previewing === voice.name ? 'animate-pulse' : ''} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Save Button (Floating) */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-[#00ff80] text-black font-black text-lg px-8 py-4 rounded-full shadow-[0_5px_20px_rgba(0,255,128,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                    <Save size={20} /> 저장하기
                </button>
            </div>
        </div>
    );
}
