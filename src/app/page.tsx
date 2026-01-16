'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { 
  Terminal, Activity, Shield, Cpu, Mic, Search, AlertCircle, 
  CheckCircle, Command, Wifi, Layers, GitBranch, Lock, ChevronRight, Globe, Zap
} from 'lucide-react';

/**
 * ==============================================================================
 * LARU NEXUS v5.0 [ULTIMATE COMMAND] - SINGULARITY EDITION
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President)
 * ARCHITECTURE:
 * - Mobile-First Fluid Interface (Haptic-style feedback)
 * - Multi-Project Specialized Intelligence
 * - Real-time Distributed Monitoring
 * ==============================================================================
 */

// --- 1. Audio & Interface Engine ---
class InterfaceEngine {
  ctx: AudioContext | null = null;
  init() {
    if (typeof window !== 'undefined' && !this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  playTone(freq: number, type: 'sine'|'square'|'sawtooth'|'triangle', duration: number, vol: number = 0.1) {
    if (!this.ctx) this.init(); if (!this.ctx) return; this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + duration);
  }

  // プロフェッショナルな通知音
  playBoot() { this.playTone(110, 'sawtooth', 1.2, 0.05); setTimeout(() => this.playTone(220, 'sine', 0.8, 0.05), 150); }
  playTyping() { this.playTone(1000 + Math.random() * 500, 'square', 0.02, 0.01); }
  playSuccess() { this.playTone(440, 'sine', 0.1, 0.05); setTimeout(() => this.playTone(880, 'sine', 0.2, 0.05), 80); }
  playAlert() { this.playTone(180, 'sawtooth', 0.4, 0.1); }
  playCommand() { this.playTone(1200, 'sine', 0.05, 0.02); }
}
const engine = new InterfaceEngine();

// --- 2. Types & Specialized Data ---
interface LogEntry { id: string; msg: string; type: 'ai'|'user'|'error'|'success'|'system'|'thinking'; time: string; }
interface Project { id: string; name: string; status: 'online'|'building'|'error'; load: number; repo: string; url: string; }

// --- 3. Matrix Text Component ---
const MatrixText = ({ text }: { text: string }) => {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    let i = 0; const chars = "01アイウエオカキクケコ";
    const speed = text.length > 50 ? 5 : 15;
    const interval = setInterval(() => {
      if (Math.random() > 0.8) engine.playTyping();
      setDisplay(text.substring(0, i) + chars[Math.floor(Math.random() * chars.length)]);
      i++;
      if (i > text.length) { clearInterval(interval); setDisplay(text); }
    }, speed);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{display}</span>;
};

const LowPolyHUD = ({ active, level }: { active: boolean, level: number }) => {
  const mouthY = active ? Math.min(10, level / 5) : 0;
  return (
    <svg width="60" height="70" viewBox="0 0 100 120" fill="none" stroke={active ? "#00f2ff" : "#333"} strokeWidth="2" className="transition-all duration-300 drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]">
       <path d="M15,30 L50,5 L85,30 L90,55 L50,110 L10,55 L15,30 Z" className="opacity-80" />
       <circle cx="35" cy="45" r="1.5" fill={active ? "#00f2ff" : "#222"} />
       <circle cx="65" cy="45" r="1.5" fill={active ? "#00f2ff" : "#222"} />
       <path d={`M38,85 Q50,${85 + mouthY} 62,85`} />
    </svg>
  );
};

// --- 4. Main Application ---
export default function LaruNexusV5() {
  const [activeTab, setActiveTab] = useState<'COMMAND' | 'KPI' | 'ROADMAP'>('COMMAND');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState('');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isLive, setIsLive] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([
    { id: 'larubot', name: 'LARUbot', status: 'online', load: 32, repo: 'LARUbot_homepage', url: 'larubot.com' },
    { id: 'flastal', name: 'Flastal', status: 'online', load: 14, repo: 'flastal-backend', url: 'flastal.net' },
    { id: 'laruvisona', name: 'Laruvisona', status: 'online', load: 8, repo: 'laruvisona-corp-site', url: 'laruvisona.net' },
    { id: 'nexus', name: 'LaruNexus', status: 'building', load: 88, repo: 'laru-control-panel', url: 'nexus.local' },
  ]);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    engine.init();
    setTimeout(() => {
      engine.playBoot();
      addLog('システムオンライン。神経接続確立。', 'system');
      addLog('Gemini 2.5 思考コア: 正常稼働中', 'system');
    }, 500);

    const interval = setInterval(() => {
      setKpiData(prev => {
        const newData = { name: new Date().toLocaleTimeString(), users: 50 + Math.floor(Math.random() * 20), cost: 15 + Math.random() * 5, requests: 150 + Math.floor(Math.random() * 50) };
        return [...prev.slice(-15), newData];
      });
      setProjects(prev => prev.map(p => ({ ...p, load: Math.max(5, Math.min(95, p.load + (Math.random() * 8 - 4))) })));
      if (isLive) setAudioLevel(Math.random() * 60);
    }, 1200);
    return () => clearInterval(interval);
  }, [isLive]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs, isProcessing]);

  const addLog = (msg: string, type: LogEntry['type'] = 'system') => {
    setLogs(prev => [...prev.slice(-49), { id: Math.random().toString(), msg, type, time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) }]);
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = 'ja-JP';
    ut.rate = 1.1;
    window.speechSynthesis.speak(ut);
  };

  const handleCommand = async (cmd: string) => {
    setIsCommandOpen(false);
    const normalized = cmd.trim();
    if (!normalized) return;

    addLog(normalized, 'user');
    engine.playCommand();
    setIsProcessing(true);
    setInput('');

    // --- インテリジェント・ルーティング ---
    setTimeout(() => {
      if (normalized.includes('deploy') || normalized.includes('デプロイ')) {
        const target = projects.find(p => normalized.toLowerCase().includes(p.id))?.name || '全システム';
        addLog(`${target} のデプロイ・シーケンスを開始します...`, 'thinking');
        setTimeout(() => { 
          addLog(`${target} の展開が正常に完了しました。`, 'success'); 
          speak(`${target}のデプロイが終わりました、社長。`);
          engine.playSuccess(); 
          setIsProcessing(false); 
        }, 3000);
      } else if (normalized.includes('status') || normalized.includes('状況')) {
        addLog('全リポジトリの整合性チェックを実行中...', 'thinking');
        setTimeout(() => { addLog('全システム正常稼働。脆弱性は検出されませんでした。', 'success'); setIsProcessing(false); }, 1500);
      } else {
        addLog('深層文脈解析中...', 'thinking');
        setTimeout(() => { 
          addLog('了解しました。指示内容を解析し、最適なプロセスを予約しました。', 'ai'); 
          setIsProcessing(false); 
        }, 1200);
      }
    }, 500);
  };

  const toggleVoice = () => {
    if (isLive) { setIsLive(false); engine.playAlert(); } 
    else { setIsLive(true); engine.playCommand(); addLog('音声コマンド受付開始...', 'system'); }
  };

  return (
    <div className="fixed inset-0 bg-[#020202] text-cyan-400 font-mono flex flex-col overflow-hidden selection:bg-cyan-900 selection:text-white">
      {/* 視覚的背景 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#00f2ff 1px, transparent 1px), linear-gradient(90deg, #00f2ff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      {/* HEADER */}
      <header className="h-12 border-b border-cyan-900/40 bg-black/80 backdrop-blur-md flex items-center justify-between px-4 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <Zap className="animate-pulse text-cyan-500 shadow-[0_0_10px_#00f2ff]" size={16} />
          <div className="flex flex-col">
            <span className="font-bold tracking-tighter text-sm text-white uppercase">LARU NEXUS <span className="text-[10px] text-cyan-600">v5.0</span></span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold">
           <div className="hidden md:flex items-center gap-2"><Shield size={12}/> LEVEL 5</div>
           <div className="flex items-center gap-2 text-cyan-600"><Wifi size={12}/> ONLINE</div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 relative overflow-hidden flex flex-col md:pl-16 pb-16 md:pb-0">
        <AnimatePresence mode='wait'>
          {activeTab === 'COMMAND' && (
            <motion.div key="cmd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col h-full">
              {/* HUD */}
              <div className="p-4 grid grid-cols-2 gap-4 border-b border-cyan-900/20 bg-cyan-950/5 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <LowPolyHUD active={isLive || isProcessing} level={audioLevel} />
                    {isProcessing && <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute -inset-2 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full" />}
                  </div>
                  <div className="text-[10px] leading-tight text-gray-400">
                    <div className="text-cyan-500 font-bold mb-1">思考コア: Gemini 2.5</div>
                    <div>処理状態: {isProcessing ? 'アクティブ' : 'スタンバイ'}</div>
                  </div>
                </div>
                <div className="flex flex-col justify-center items-end border-l border-cyan-900/20 pr-2">
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">System Health</div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className={`w-1.5 h-3 ${i < 5 ? 'bg-cyan-500' : 'bg-cyan-900'} shadow-[0_0_5px_rgba(0,242,255,0.4)]`} />)}
                  </div>
                </div>
              </div>

              {/* LOGS */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {logs.map((log) => (
                  <div key={log.id} className={`flex flex-col ${log.type === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className="text-[9px] text-gray-600 mb-1 px-1 flex gap-2">
                       <span>{log.time}</span>
                       <span className="uppercase tracking-tighter opacity-50">{log.type}</span>
                    </div>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      log.type === 'user' ? 'bg-cyan-950/20 border border-cyan-500/30 text-white' : 
                      log.type === 'error' ? 'bg-red-900/20 border border-red-500/30 text-red-400' :
                      'bg-transparent border-transparent text-cyan-100'
                    }`}>
                      {log.type === 'ai' || log.type === 'system' ? <MatrixText text={log.msg} /> : log.msg}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* INPUT */}
              <div className="p-4 bg-black/60 backdrop-blur-xl border-t border-cyan-900/30 flex gap-2 items-center z-30">
                <button onClick={toggleVoice} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isLive ? 'bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)]' : 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-400'}`}>
                  <Mic size={20} className={isLive ? 'text-white' : ''} />
                </button>
                <div className="flex-1 relative">
                  <input className="w-full h-12 bg-white/5 border border-cyan-900/40 rounded-full px-5 text-sm outline-none focus:border-cyan-400 focus:bg-white/10 transition-all text-white placeholder-cyan-900" placeholder="コマンドを入力..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCommand(input)} />
                  <button onClick={() => handleCommand(input)} className="absolute right-2 top-2 w-8 h-8 flex items-center justify-center text-cyan-500">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'KPI' && (
            <motion.div key="kpi" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-4 space-y-4 h-full overflow-y-auto">
              <div className="text-xs font-bold text-cyan-900 tracking-widest uppercase mb-2 border-l-2 border-cyan-500 pl-2">リアルタイム資産・稼働状況</div>
              
              <div className="h-48 border border-cyan-900/30 bg-cyan-950/5 rounded-2xl p-4">
                <div className="text-[10px] text-gray-500 mb-3 flex justify-between">
                   <span>ネットワークトラフィック</span>
                   <span className="text-cyan-400 animate-pulse">LIVE</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpiData}>
                    <defs><linearGradient id="colorU" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/><stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/></linearGradient></defs>
                    <Area type="monotone" dataKey="users" stroke="#00f2ff" strokeWidth={2} fill="url(#colorU)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-3 pt-2">
                {projects.map(p => (
                  <div key={p.id} className="bg-white/5 border border-cyan-900/20 p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all" onClick={() => handleCommand(`/deploy ${p.id}`)}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Globe size={12} className="text-cyan-700" />
                        <span className="text-xs font-bold text-white tracking-tighter">{p.name}</span>
                      </div>
                      <span className="text-[9px] text-gray-600 font-mono italic">{p.url}</span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#10b981]' : 'bg-yellow-500'}`} />
                        <span className="text-[10px] uppercase font-bold text-gray-400">{p.status}</span>
                      </div>
                      <div className="w-20 h-1 bg-gray-900 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-cyan-500" animate={{ width: `${p.load}%` }} transition={{ duration: 1 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'ROADMAP' && (
            <motion.div key="rm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="w-20 h-20 border border-cyan-500/20 rounded-full flex items-center justify-center bg-cyan-500/5 shadow-[0_0_30px_rgba(0,242,255,0.05)]">
                <Lock size={32} className="text-cyan-900" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-widest mb-2 uppercase italic">Top Secret</h2>
                <p className="text-[11px] text-cyan-900 leading-relaxed max-w-[240px] mx-auto">LARUbot Holdings 戦略ロードマップは現在、最高機密事項として暗号化されています。閲覧には専用権限が必要です。</p>
              </div>
              <button onClick={() => engine.playAlert()} className="px-10 py-3 bg-cyan-500/10 border border-cyan-500 text-cyan-400 text-[10px] font-bold rounded-full hover:bg-cyan-500 hover:text-black transition-all">
                権限昇格を要求
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* MOBILE BOTTOM NAV - 親指一本で操作可能 */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-2xl border-t border-cyan-900/40 flex items-center justify-around px-2 z-50 md:hidden">
        <MobileNavBtn icon={<Terminal />} active={activeTab === 'COMMAND'} label="指令" onClick={() => { setActiveTab('COMMAND'); engine.playCommand(); }} />
        <MobileNavBtn icon={<Activity />} active={activeTab === 'KPI'} label="資産" onClick={() => { setActiveTab('KPI'); engine.playCommand(); }} />
        <div className="w-14 h-14 -mt-6 flex items-center justify-center bg-cyan-500 rounded-full border-4 border-[#020202] shadow-[0_0_20px_rgba(0,242,255,0.4)]" onClick={() => setIsCommandOpen(true)}>
          <Command size={24} className="text-black" />
        </div>
        <MobileNavBtn icon={<Layers />} active={activeTab === 'ROADMAP'} label="計画" onClick={() => { setActiveTab('ROADMAP'); engine.playCommand(); }} />
        <MobileNavBtn icon={<Lock />} active={false} label="要塞" onClick={() => engine.playAlert()} />
      </nav>

      {/* DESKTOP SIDE NAV */}
      <nav className="hidden md:flex fixed left-0 top-14 bottom-0 w-16 border-r border-cyan-900/30 flex-col items-center py-6 gap-8 bg-black/60 z-30">
        <NavButton icon={<Terminal />} active={activeTab === 'COMMAND'} onClick={() => setActiveTab('COMMAND')} />
        <NavButton icon={<Activity />} active={activeTab === 'KPI'} onClick={() => setActiveTab('KPI')} />
        <NavButton icon={<Layers />} active={activeTab === 'ROADMAP'} onClick={() => setActiveTab('ROADMAP')} />
      </nav>

      {/* COMMAND PALETTE - プロジェクト別インテリジェンス */}
      <AnimatePresence>
        {isCommandOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[100] p-4 flex flex-col pt-12 md:pt-[15vh] items-center">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-lg bg-[#0a0a0a] border border-cyan-500/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,242,255,0.2)]">
              <div className="p-4 border-b border-cyan-900/50 flex items-center gap-3">
                <Search className="text-cyan-500" size={18} />
                <input className="bg-transparent border-none outline-none text-white flex-1 text-sm font-mono" placeholder="コマンドを入力..." autoFocus onKeyDown={e => e.key === 'Enter' && handleCommand((e.target as any).value)} />
                <button onClick={() => setIsCommandOpen(false)} className="text-gray-600"><Lock size={16} /></button>
              </div>
              <div className="p-2 space-y-1">
                <div className="text-[9px] text-cyan-900 font-bold px-3 py-1 uppercase tracking-widest border-b border-cyan-900/10 mb-1">Recommended Actions</div>
                <CmdItem cmd="/deploy flastal" desc="フラスタル基盤の再展開" onClick={() => handleCommand('/deploy flastal')} />
                <CmdItem cmd="/deploy larubot" desc="AI HPの最新化" onClick={() => handleCommand('/deploy larubot')} />
                <CmdItem cmd="/status" desc="全システムの統合診断" onClick={() => handleCommand('/status')} />
                <CmdItem cmd="/nexus sync" desc="Nexus 制御同期" onClick={() => handleCommand('/nexus sync')} />
              </div>
            </motion.div>
            <button className="mt-8 text-cyan-900 text-[10px] tracking-widest uppercase border border-cyan-900/30 px-8 py-3 rounded-full active:bg-cyan-500/10" onClick={() => setIsCommandOpen(false)}>閉じる</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- 5. サブコンポーネント ---

function NavButton({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`p-3 rounded-xl transition-all duration-300 relative group ${active ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.2)]' : 'text-cyan-900 hover:text-cyan-400'}`}>
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-r shadow-[0_0_10px_#00f2ff]" />}
      {icon}
    </button>
  );
}

function MobileNavBtn({ icon, active, label, onClick }: { icon: React.ReactNode, active: boolean, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${active ? 'text-cyan-400' : 'text-cyan-900'}`}>
      <div className={`${active ? 'scale-110 drop-shadow-[0_0_5px_rgba(0,242,255,0.4)]' : ''}`}>{icon}</div>
      <span className="text-[9px] font-bold tracking-tighter uppercase">{label}</span>
    </button>
  );
}

function CmdItem({ cmd, desc, onClick }: { cmd: string, desc: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full p-4 hover:bg-cyan-500/10 rounded-2xl flex items-center justify-between group active:bg-cyan-500/20">
      <div className="flex flex-col items-start">
        <span className="text-cyan-200 font-bold font-mono text-xs group-hover:text-white transition-colors uppercase tracking-widest">{cmd}</span>
        <span className="text-[10px] text-gray-600 group-hover:text-cyan-700">{desc}</span>
      </div>
      <ChevronRight size={16} className="text-cyan-900 group-hover:text-cyan-400" />
    </button>
  );
}