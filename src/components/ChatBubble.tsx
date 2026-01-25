'use client';
import React from 'react';
import { motion } from 'framer-motion';

interface ChatBubbleProps {
  log: { id: string; type: string; msg: string; time: string; imageUrl?: string | null };
  color: string;
}

export const ChatBubble = ({ log, color }: ChatBubbleProps) => {
  const isAi = log.type === 'gemini';
  const isSys = log.type === 'sys';

  // 【修正】Tailwindの動的クラス指定を安全な形に変更
  const borderColor = color === 'cyan' ? 'border-cyan-500/30' : 'border-emerald-500/30';
  const textColor = color === 'cyan' ? 'text-cyan-400' : 'text-emerald-400';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }} 
      animate={{ opacity: 1, y: 0 }} 
      // 【修正】contain-layout を追加して計算負荷を隔離し、画面外への飛び出しを防ぐ
      className={`flex w-full ${log.type === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
      style={{ contain: 'layout' }} 
    >
      <div className={`
        relative max-w-[85%] md:max-w-[70%] p-5 rounded-2xl text-sm leading-relaxed tracking-wide shadow-2xl border
        ${log.type === 'user' 
          ? 'bg-zinc-900 border-zinc-700 text-white rounded-tr-sm' 
          : isSys
          ? 'bg-red-950/20 border-red-500/30 text-red-300 font-mono text-xs w-full text-center py-2'
          : `bg-black/90 ${borderColor} text-zinc-100 rounded-tl-sm`
        }
      `}>
        {!isSys && (
          <div className="flex items-center gap-3 mb-2 opacity-60 text-[10px] font-bold uppercase tracking-[0.2em]">
            <span className={isAi ? textColor : 'text-zinc-400'}>
              {isAi ? 'AI_CORE' : 'PRESIDENT'}
            </span>
            <span>{log.time}</span>
          </div>
        )}
        
        <div className="whitespace-pre-wrap">{log.msg}</div>

        {log.imageUrl && (
          <div className="mt-4 rounded-lg overflow-hidden border border-white/10">
            <img src={log.imageUrl} alt="captured" className="w-full h-auto object-cover" />
          </div>
        )}
      </div>
    </motion.div>
  );
};