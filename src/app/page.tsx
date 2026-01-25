'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, Code, Shield, Globe, Cpu, ArrowRight, 
  Terminal, LayoutGrid, Lock, Zap
} from 'lucide-react';

export default function NexusPortal() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // ■ あなたのRenderのURL (開発環境)
  const RENDER_DEV_URL = "https://laru-control-panellaru-core-nexus-alaru.onrender.com";

  const projects = [
    { 
      id: 'larubot', 
      name: 'LARU_BOT', 
      role: 'AI CHAT SERVICE', 
      icon: <Terminal size={18}/>, 
      status: 'ONLINE',
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/5',
      hover: 'group-hover:border-cyan-500/80 group-hover:bg-cyan-500/10'
    },
    { 
      id: 'flastal', 
      name: 'FLASTAL', 
      role: 'CLIENT WORK', 
      icon: <Globe size={18}/>, 
      status: 'DEV_MODE',
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/5',
      hover: 'group-hover:border-purple-500/80 group-hover:bg-purple-500/10'
    },
    { 
      id: 'laruvisona', 
      name: 'LARU_VISONA', 
      role: 'IMAGE GENERATION', 
      icon: <LayoutGrid size={18}/>, 
      status: 'STABLE',
      color: 'text-pink-400',
      border: 'border-pink-500/30',
      bg: 'bg-pink-500/5',
      hover: 'group-hover:border-pink-500/80 group-hover:bg-pink-500/10'
    },
    { 
      id: 'larunexus', 
      name: 'LARU_NEXUS', 
      role: 'CORE SYSTEM', 
      icon: <Shield size={18}/>, 
      status: 'SYSTEM_ALL_GREEN',
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/5',
      hover: 'group-hover:border-emerald-500/80 group-hover:bg-emerald-500/10'
    },
  ];

  if (!mounted) return <div className="h-screen bg-black" />;

  return (
    <div className="min-h-[100dvh] bg-black text-white font-mono selection:bg-cyan-500/30 overflow-x-hidden flex flex-col items-center justify-center relative touch-manipulation">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,30,30,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,30,30,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[10px] w-full animate-scanline" />
        <div className="absolute inset-0 bg-radial-gradient(circle_at_center,transparent_0%,black_100%)" />
      </div>

      {/* --- MAIN CONTAINER --- */}
      <div className="z-10 w-full max-w-5xl px-4 md:px-6 py-8 flex flex-col gap-8 md:gap-12 animate-in fade-in zoom-in-95 duration-700">
        
        {/* HEADER */}
        <div className="flex flex-col items-center gap-4">
           <div className="relative flex items-center gap-3 mb-1">
             <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
             <div className="relative p-2 md:p-3 bg-black/80 border border-cyan-500/50 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]">
               <Cpu size={24} className="text-cyan-400 md:w-8 md:h-8" />
             </div>
             <h1 className="text-3xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-zinc-500 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
               LARU_NEXUS
             </h1>
           </div>
           <div className="flex flex-col items-center gap-1">
             <div className="h-px w-32 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
             <p className="text-zinc-500 text-[10px] md:text-sm tracking-[0.3em] font-bold text-center uppercase">
               Holdings Integrated Command Center
             </p>
           </div>
        </div>

        {/* --- DIVISION SELECTOR --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
          
          {/* 1. TRADING DIVISION (Local) */}
          <Link href="/trading" className="group relative block transition-all duration-300 active:scale-[0.99]">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
            <div className="relative h-full bg-zinc-900/30 backdrop-blur-md border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 shadow-lg group-hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
               <div>
                 <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-black/50 rounded-lg border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <Activity size={28} className="md:w-8 md:h-8" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-500/30 text-emerald-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      MARKET_LIVE
                    </div>
                 </div>
                 <h2 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                   ASSET MANAGEMENT
                 </h2>
                 <p className="text-zinc-500 text-xs leading-relaxed font-medium">
                   HYPE/USDC 高頻度自動取引システム。<br className="hidden md:block"/>
                   第3世代AIエンジン、MTF分析、Discord通知連携済み。
                 </p>
               </div>
               
               <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4">
                 <span className="text-xs md:text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">LAUNCH TERMINAL</span>
                 <ArrowRight size={16} className="text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-transform"/>
               </div>
            </div>
          </Link>

          {/* 2. R&D DIVISION (Cloud/Render) */}
          <div className="flex flex-col h-full gap-4">
             <div className="bg-zinc-900/30 backdrop-blur-md border border-zinc-800 rounded-xl p-5 md:p-6 flex flex-col gap-4 flex-1">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                     <Code size={18} className="text-zinc-400"/>
                     <span className="font-bold text-zinc-300 text-sm tracking-wider">ACTIVE PROJECTS</span>
                   </div>
                   <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  {projects.map((p) => (
                    <div key={p.id} className={`group/card relative p-3 md:p-4 rounded-lg border transition-all cursor-pointer active:scale-[0.98] bg-black/20 ${p.border} ${p.hover}`}>
                       <div className="flex justify-between items-start mb-2">
                          <div className={`${p.color} opacity-80 group-hover/card:opacity-100 transition-opacity`}>{p.icon}</div>
                          <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-black border border-white/10 ${p.color}`}>
                            {p.status}
                          </div>
                       </div>
                       <div className="font-bold text-xs md:text-sm text-zinc-300 group-hover/card:text-white transition-colors">{p.name}</div>
                       <div className="text-[9px] text-zinc-600 font-bold mt-0.5 group-hover/card:text-zinc-500">{p.role}</div>
                    </div>
                  ))}
                </div>
                
                {/* ★ここを修正しました: Renderへの外部リンクに変更 */}
                <a href={RENDER_DEV_URL} target="_blank" rel="noopener noreferrer" className="mt-auto w-full pt-2">
                  <button className="group w-full py-3 bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 border border-zinc-700 rounded-lg text-[10px] md:text-xs font-bold text-zinc-300 flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-lg">
                    <Lock size={12} className="group-hover:hidden"/>
                    <Zap size={12} className="hidden group-hover:block text-yellow-400"/>
                    ACCESS DEV CONSOLE (CLOUD)
                  </button>
                </a>
             </div>
          </div>

        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-[9px] md:text-[10px] text-zinc-600 font-mono border-t border-white/5 pt-6 w-full gap-2">
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
             SYSTEM_ID: GENESIS_V3.0.1
           </div>
           <div className="flex gap-4 tracking-wider">
             <span>CPU: <span className="text-zinc-400">NORMAL</span></span>
             <span>MEM: <span className="text-zinc-400">OPTIMIZED</span></span>
             <span className="text-emerald-500 font-bold flex items-center gap-1">
               <Shield size={10}/> SECURE
             </span>
           </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .animate-scanline {
          animation: scanline 8s linear infinite;
        }
      `}</style>
    </div>
  );
}