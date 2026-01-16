'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  Terminal, Activity, Shield, Cpu, Mic, Search, AlertCircle, 
  CheckCircle, Command, Wifi, Layers, GitBranch, Lock, ChevronRight, Zap, Bell, History, Briefcase, Building2
} from 'lucide-react';

/**
 * ==============================================================================
 * LARU NEXUS v6.1 [CORE STRATEGY] - THE ULTIMATE FORTRESS
 * ------------------------------------------------------------------------------
 * 開発総責任者: 齋藤 拓実 (Takumi Saito)
 * 構成:
 * - 会社資産: LARUbot, laruvisona, larunexus
 * - 受託案件: flastal (分離管理)
 * 特徴:
 * - スマホ完全最適化 (ボトムナビゲーション & 親指操作設計)
 * - ライブ・アクティビティ・ストリーム
 * - プッシュ通知 & SFX エンジン搭載
 * ==============================================================================
 */

// --- 1. 音響 & ハプティクス・エンジン ---
class NexusCoreEngine {
  ctx: AudioContext | null = null;
  init() {
    if (typeof window !== 'undefined' && !this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  playTone(freq: number, type: 'sine'|'square'|'sawtooth', duration: number, vol: number = 0.1) {
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

  playBoot() { this.playTone(110, 'sawtooth', 1.0, 0.05); setTimeout(() => this.playTone(220, 'sine', 0.5, 0.05), 100); }
  playNotify() { this.playTone(880, 'sine', 0.1, 0.05); setTimeout(() => this.playTone(1320, 'sine', 0.2, 0.05), 50); }
  playSuccess() { this.playTone(440, 'sine', 0.1, 0.05); setTimeout(() => this.playTone(880, 'sine', 0.3, 0.05), 100); }
  playError() { this.playTone(180, 'sawtooth', 0.5, 0.1); }
  playType() { this.playTone(1200 + Math.random() * 400, 'square', 0.02, 0.01); }
}
const engine = new NexusCoreEngine();

// --- 2. 型定義 ---
interface LogEntry { id: string; msg: string; type: 'ai'|'user'|'error'|'success'|'system'|'thinking'; time: string; }
interface Project { id: string; name: string; category: 'COMPANY' | 'CLIENT'; status: 'online'|'building'|'error'; load: number; repo: string; url: string; }
interface CommitEvent { id: string; repo: string; msg: string; time: string; }

// --- 3. UI 演出: マトリックス・テキスト ---
const MatrixText = ({ text }: { text: string }) => {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    let i = 0; const chars = "01アあイいウうエえオお";
    const speed = text.length > 50 ? 5 : 15;
    const interval = setInterval(() => {
      if (Math.random() > 0.8) engine.playType();
      setDisplay(text.substring(0, i) + chars[Math.floor(Math.random() * chars.length)]);
      i++;
      if (i > text.length) { clearInterval(interval); setDisplay(text); }
    }, speed);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{display}</span>;
};

// --- 4. メインアプリケーション ---
export default function LaruNexusV6() {
  const [activeTab, setActiveTab] = useState<'COMMAND' | 'KPI' | 'HISTORY'>('COMMAND');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState('');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isLive, setIsLive] = useState(false);

  // ライブ・アクティビティ・ストリーム
  const [commitStream, setCommitStream] = useState<CommitEvent[]>([
    { id: 'c1', repo: 'LARUbot_homepage', msg: '会社サイトのUI最適化', time: '10:20' },
    { id: 'c2', repo: 'flastal', msg: '受託案件: 顧客要望のAPI改修', time: '09:45' }
  ]);

  // プロジェクト管理 (会社資産と受託案件を明示的に分離)
  const [projects, setProjects] = useState<Project[]>([
    { id: 'larubot', name: 'LARUbot', category: 'COMPANY', status: 'online', load: 30, repo: 'LARUbot_homepage', url: 'larubot.com' },
    { id: 'laruvisona', name: 'ラルビソナ', category: 'COMPANY', status: 'online', load: 5, repo: 'laruvisona-corp-site', url: 'laruvisona.net' },
    { id: 'nexus', name: '要塞司令部', category: 'COMPANY', status: 'building', load: 75, repo: 'laru-control-panel', url: 'nexus.local' },
    { id: 'flastal', name: 'Flastal', category: 'CLIENT', status: 'online', load: 12, repo: 'flastal', url: 'flastal.net' },
  ]);

  const ws = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 通知リクエスト
  const requestNotification = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        addLog('通知システム: 社長の端末と直結完了。', 'success');
        engine.playNotify();
      }
    }
  };

  const sendNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  // WebSocket 同期
  useEffect(() => {
    engine.init();
    const connect = () => {
      ws.current = new WebSocket('ws://localhost:8000/ws');
      ws.current.onopen = () => {
        setIsConnected(true);
        addLog('中枢神経系への接続を確立。全システム正常。', 'success');
        engine.playBoot();
      };
      ws.current.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 3000);
      };
      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'LOG') {
          addLog(message.payload.msg, message.payload.type);
          if (message.payload.type === 'success') {
            engine.playSuccess();
            sendNotification('司令完了', message.payload.msg);
          }
        }
        else if (message.type === 'KPI_UPDATE') {
          setKpiData(prev => [...prev.slice(-15), message.data]);
        }
        else if (message.type === 'PROJECT_UPDATE') {
          setProjects(message.data);
        }
      };
    };

    connect();
    const interval = setInterval(() => {
      if (isLive) setAudioLevel(Math.random() * 50);
    }, 100);
    return () => { ws.current?.close(); clearInterval(interval); };
  }, [isLive]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const addLog = (msg: string, type: LogEntry['type'] = 'system') => {
    setLogs(prev => [...prev.slice(-49), { id: Math.random().toString(), msg, type, time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) }]);
  };

  const handleCommand = (cmd: string) => {
    setIsCommandOpen(false);
    if (!cmd.trim() || !isConnected) return;
    addLog(cmd, 'user');
    ws.current?.send(JSON.stringify({ command: cmd }));
    setInput('');
    engine.playTone(1000, 'sine', 0.05, 0.02);
  };

  const toggleVoice = () => {
    if (isLive) { setIsLive(false); engine.playError(); } 
    else { setIsLive(true); engine.playNotify(); addLog('音声司令モード: 入力待機...', 'system'); }
  };

  return (
    <div className="fixed inset-0 bg-[#010101] text-cyan-400 font-mono flex flex-col overflow-hidden selection:bg-cyan-900 selection:text-white">
      {/* 視覚的グリッド */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#00f2ff 1px, transparent 1px), linear-gradient(90deg, #00f2ff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* ヘッダー */}
      <header className="h-14 border-b border-cyan-900/40 bg-black/60 backdrop-blur-xl flex items-center justify-between px-5 z-40 relative">
        <div className="flex items-center gap-3">
          <Zap className={isConnected ? 'text-cyan-400 animate-pulse drop-shadow-[0_0_8px_#00f2ff]' : 'text-gray-700'} size={18} />
          <div className="flex flex-col">
            <span className="font-bold tracking-[0.2em] text-sm text-white uppercase">LARU NEXUS</span>
            <span className="text-[9px] text-cyan-700 font-bold uppercase tracking-widest">Singularity v6.1</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={requestNotification} className="text-cyan-800 hover:text-cyan-400"><Bell size={18} /></button>
          <div className="flex flex-col items-end">
            <div className={`text-[10px] font-bold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
               {isConnected ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </div>
      </header>

      {/* ライブ・フィード */}
      <div className="h-8 bg-cyan-950/10 border-b border-cyan-900/10 flex items-center overflow-hidden whitespace-nowrap px-4 z-30">
        <div className="flex items-center gap-2 text-[9px] font-bold text-cyan-800 mr-4 shrink-0 uppercase italic">
          <GitBranch size={10} /> Live_Activity:
        </div>
        <div className="flex gap-8">
           {commitStream.map(c => (
             <div key={c.id} className="text-[10px] text-gray-500 flex gap-2">
               <span className="text-cyan-700">[{c.repo}]</span>
               <span>{c.msg}</span>
             </div>
           ))}
        </div>
      </div>

      {/* メインビュー */}
      <main className="flex-1 relative overflow-hidden flex flex-col md:flex-row pb-16 md:pb-0">
        
        {/* デスクトップ サイドバー */}
        <nav className="hidden md:flex w-16 border-r border-cyan-900/20 flex flex-col items-center py-8 gap-8 bg-black/40">
          <SideNavBtn icon={<Terminal />} active={activeTab === 'COMMAND'} onClick={() => setActiveTab('COMMAND')} />
          <SideNavBtn icon={<Activity />} active={activeTab === 'KPI'} onClick={() => setActiveTab('KPI')} />
          <SideNavBtn icon={<History />} active={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')} />
        </nav>

        <AnimatePresence mode='wait'>
          {activeTab === 'COMMAND' && (
            <motion.div key="command" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full overflow-hidden">
              {/* AI HUD */}
              <div className="p-4 flex items-center justify-between border-b border-cyan-900/10 bg-cyan-950/5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <svg width="45" height="45" viewBox="0 0 100 120" fill="none" stroke={isProcessing ? "#00f2ff" : "#222"} strokeWidth="2">
                      <path d="M15,30 L50,5 L85,30 L90,55 L50,110 L10,55 L15,30 Z" className="opacity-60" />
                      <path d={`M35,85 Q50,${85 + (isLive ? 10 : 0)} 65,85`} />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-cyan-600 tracking-tighter italic">NEURAL ENGINE</span>
                    <span className="text-xs text-white font-bold tracking-widest">GEMINI 2.5 FLASH</span>
                  </div>
                </div>
                <div className="text-right flex flex-col gap-1">
                   <div className="text-[9px] text-gray-700 uppercase">System_Load</div>
                   <div className="w-20 h-1 bg-gray-900 rounded-full overflow-hidden">
                     <motion.div animate={{ width: isProcessing ? '90%' : '20%' }} className="h-full bg-cyan-500 shadow-[0_0_8px_#00f2ff]" />
                   </div>
                </div>
              </div>

              {/* ログ出力 */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
                {logs.map((log) => (
                  <div key={log.id} className={`flex flex-col ${log.type === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className="text-[9px] text-gray-700 mb-1 font-bold flex gap-2 uppercase">
                      <span>{log.time}</span>
                      <span className="text-cyan-900">{log.type}</span>
                    </div>
                    <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-[13px] leading-relaxed shadow-lg ${
                      log.type === 'user' ? 'bg-cyan-900/20 border border-cyan-500/30 text-white' : 
                      log.type === 'error' ? 'bg-red-900/20 border border-red-500/30 text-red-400' :
                      'bg-transparent border-transparent text-cyan-100'
                    }`}>
                      {log.type === 'ai' || log.type === 'system' ? <MatrixText text={log.msg} /> : log.msg}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* コマンド入力 (ボトムドック) */}
              <div className="p-4 bg-black/80 backdrop-blur-2xl border-t border-cyan-900/30 flex items-center gap-3 z-50">
                <button onClick={toggleVoice} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isLive ? 'bg-red-600 shadow-[0_0_20px_rgba(255,0,0,0.5)]' : 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/20'}`}>
                  <Mic size={20} />
                </button>
                <div className="flex-1 relative">
                  <input 
                    className="w-full h-12 bg-white/5 border border-cyan-900/30 rounded-2xl px-5 text-sm outline-none focus:border-cyan-400 transition-all text-white"
                    placeholder="司令を入力..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCommand(input)}
                  />
                  <button onClick={() => handleCommand(input)} className="absolute right-3 top-3 text-cyan-600"><ChevronRight size={24} /></button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'KPI' && (
            <motion.div key="kpi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-6 space-y-6 overflow-y-auto">
              <h2 className="text-xs font-bold text-white tracking-[0.3em] uppercase border-l-4 border-cyan-500 pl-3 mb-4">資産・稼働統計</h2>
              
              <div className="h-56 border border-cyan-900/20 bg-cyan-950/5 rounded-3xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-[10px] text-gray-500 uppercase flex items-center gap-2"><Wifi size={12} className="text-cyan-500" /> Network_Pulse</div>
                  <div className="text-[10px] font-bold text-cyan-400 animate-pulse">LIVE_SYNCING</div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpiData}>
                    <defs><linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00f2ff" stopOpacity={0.2}/><stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/></linearGradient></defs>
                    <Area type="monotone" dataKey="users" stroke="#00f2ff" strokeWidth={3} fill="url(#colorP)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 会社資産グループ */}
              <div>
                <div className="text-[10px] text-cyan-800 font-bold mb-3 flex items-center gap-2 uppercase tracking-widest"><Building2 size={12}/> Company_Assets</div>
                <div className="grid gap-3">
                  {projects.filter(p => p.category === 'COMPANY').map(p => (
                    <ProjectCard key={p.id} project={p} onClick={() => handleCommand(`/deploy ${p.id}`)} />
                  ))}
                </div>
              </div>

              {/* 受託案件グループ */}
              <div>
                <div className="text-[10px] text-yellow-800 font-bold mb-3 flex items-center gap-2 uppercase tracking-widest mt-4"><Briefcase size={12}/> Client_Projects</div>
                <div className="grid gap-3">
                  {projects.filter(p => p.category === 'CLIENT').map(p => (
                    <ProjectCard key={p.id} project={p} onClick={() => handleCommand(`/deploy ${p.id}`)} isClient />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'HISTORY' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6">
              <div className="w-20 h-20 border border-cyan-500/20 rounded-full flex items-center justify-center bg-cyan-500/5 shadow-[0_0_30px_rgba(0,242,255,0.1)]">
                <Lock size={32} className="text-cyan-900" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white tracking-widest uppercase italic">Corporate Security</h2>
                <p className="text-[10px] text-cyan-900 leading-relaxed max-w-[240px] mx-auto">
                  「齋藤ホールディングス」の戦略アーカイブは暗号化されています。閲覧には生体認証が必要です。
                </p>
              </div>
              <button onClick={() => engine.playError()} className="px-10 py-3 bg-cyan-500/10 border border-cyan-500 text-cyan-400 text-xs font-bold rounded-full">
                アクセス要求
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* モバイル ボトムナビゲーション (親指操作用) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-3xl border-t border-cyan-900/40 flex items-center justify-around z-50 md:hidden">
        <MobileTabBtn icon={<Terminal size={22}/>} label="指令" active={activeTab === 'COMMAND'} onClick={() => setActiveTab('COMMAND')} />
        <MobileTabBtn icon={<Activity size={22}/>} label="資産" active={activeTab === 'KPI'} onClick={() => setActiveTab('KPI')} />
        <div className="w-14 h-14 -mt-10 flex items-center justify-center bg-cyan-500 rounded-full border-4 border-[#010101] shadow-[0_0_20px_rgba(0,242,255,0.4)] active:scale-90 transition-transform" onClick={() => setIsCommandOpen(true)}>
          <Command size={26} className="text-black" />
        </div>
        <MobileTabBtn icon={<History size={22}/>} label="履歴" active={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')} />
        <MobileTabBtn icon={<Shield size={22}/>} label="要塞" active={false} onClick={() => engine.playError()} />
      </nav>

      {/* クイックコマンド・パレット */}
      <AnimatePresence>
        {isCommandOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] p-6 flex flex-col pt-20 items-center">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-lg bg-[#080808] border border-cyan-500/40 rounded-[2.5rem] overflow-hidden">
              <div className="p-5 border-b border-cyan-900/50 flex items-center gap-4 bg-white/5">
                <Search className="text-cyan-500" />
                <input className="bg-transparent border-none outline-none text-white flex-1 text-base" placeholder="クイック司令..." autoFocus onKeyDown={e => e.key === 'Enter' && handleCommand((e.target as any).value)} />
              </div>
              <div className="p-3 space-y-1">
                <div className="text-[10px] text-cyan-900 font-bold px-4 py-2 uppercase tracking-widest border-b border-cyan-900/10 mb-1">推奨アクション</div>
                <QuickCmdItem cmd="/deploy larubot" desc="会社HPの最新化" onClick={() => handleCommand('/deploy larubot')} />
                <QuickCmdItem cmd="/deploy flastal" desc="受託案件: Flastalの展開" onClick={() => handleCommand('/deploy flastal')} />
                <QuickCmdItem cmd="/status" desc="統合システム診断" onClick={() => handleCommand('/status')} />
                <QuickCmdItem cmd="/sync nexus" desc="制御同期実行" onClick={() => handleCommand('/sync nexus')} />
              </div>
            </motion.div>
            <button className="mt-10 text-cyan-900 text-xs font-bold tracking-widest uppercase border border-cyan-900/40 px-10 py-3 rounded-full" onClick={() => setIsCommandOpen(false)}>閉じる</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- 5. サブコンポーネント ---

function SideNavBtn({ icon, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`p-3 rounded-2xl transition-all relative group ${active ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.2)]' : 'text-cyan-900 hover:text-cyan-400 hover:bg-white/5'}`}>
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-500 rounded-r shadow-[0_0_8px_#00f2ff]" />}
      {icon}
    </button>
  );
}

function MobileTabBtn({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${active ? 'text-cyan-400 shadow-[0_0_8px_rgba(0,242,255,0.3)]' : 'text-cyan-900'}`}>
      <div className={active ? 'scale-110' : ''}>{icon}</div>
      <span className="text-[9px] font-bold tracking-tighter uppercase">{label}</span>
    </button>
  );
}

function ProjectCard({ project, onClick, isClient = false }: any) {
  return (
    <div onClick={onClick} className={`bg-white/5 border ${isClient ? 'border-yellow-900/20' : 'border-cyan-900/10'} p-4 rounded-2xl flex items-center justify-between active:scale-95 transition-all`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${project.status === 'online' ? (isClient ? 'bg-yellow-500' : 'bg-green-500 shadow-[0_0_8px_#22c55e]') : 'bg-red-500'}`} />
          <span className="text-xs font-bold text-white uppercase tracking-tighter">{project.name}</span>
        </div>
        <span className="text-[9px] text-gray-600 font-mono italic">{project.repo}</span>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className={`text-[10px] font-bold uppercase ${isClient ? 'text-yellow-800' : 'text-cyan-800'}`}>{project.status}</span>
        <div className="w-20 h-1 bg-gray-900 rounded-full overflow-hidden">
          <motion.div animate={{ width: `${project.load}%` }} transition={{ duration: 1 }} className={`h-full ${isClient ? 'bg-yellow-600' : 'bg-cyan-600'}`} />
        </div>
      </div>
    </div>
  );
}

function QuickCmdItem({ cmd, desc, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full p-4 hover:bg-cyan-500/10 rounded-[1.5rem] flex items-center justify-between group active:bg-cyan-500/20">
      <div className="flex flex-col items-start gap-1">
        <span className="text-cyan-200 font-bold font-mono text-sm group-hover:text-white transition-colors tracking-widest uppercase">{cmd}</span>
        <span className="text-[10px] text-gray-600 group-hover:text-cyan-700 transition-colors italic">{desc}</span>
      </div>
      <ChevronRight size={18} className="text-cyan-900 group-hover:text-cyan-400 transition-all" />
    </button>
  );
}