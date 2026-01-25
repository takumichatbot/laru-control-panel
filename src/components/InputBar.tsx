'use client';
import React, { useState } from 'react';
import { ChevronRight, Settings } from 'lucide-react';
import { sfx } from '@/lib/audio';

interface InputBarProps {
  onSendMessage: (text: string) => void;
  onToggleSettings: () => void;
  isProcessing: boolean;
}

export const InputBar = ({ 
  onSendMessage, 
  onToggleSettings, 
  isProcessing
}: InputBarProps) => {
  const [input, setInput] = useState('');

  const handleManualSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
    sfx.playSFX('enter');
  };

  return (
    <div className="shrink-0 border-t border-white/10 bg-black/80 backdrop-blur-xl p-4 pb-10 z-50 relative">
      
      {/* --- 入力バー本体 --- */}
      <div className="mx-auto max-w-4xl flex items-center gap-3 relative z-10">
        
        {/* 設定ボタン */}
        <button 
          onClick={() => { sfx.playSFX('click'); onToggleSettings(); }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-cyan-400 active:scale-95 transition-all"
        >
          <Settings size={20} />
        </button>

        {/* テキスト入力 */}
        <div className="relative flex-1">
          <input
            className="w-full h-12 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-cyan-500/50 px-5 text-white placeholder-zinc-700 outline-none transition-all font-sans"
            placeholder="COMMAND入力..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleManualSend();
            }}
            disabled={isProcessing}
          />
          <button 
            onClick={handleManualSend}
            disabled={isProcessing || !input.trim()}
            className="absolute right-2 top-2 h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-cyan-600 hover:text-white transition-colors disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}