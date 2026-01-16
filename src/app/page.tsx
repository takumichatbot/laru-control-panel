'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  Terminal, Activity, Shield, Cpu, Mic, Search, AlertCircle, 
  CheckCircle, Command, Wifi, Layers, GitBranch, Lock, ChevronRight, Zap, Bell, History
} from 'lucide-react';

/**
 * ==============================================================================
 * LARU NEXUS v6.0 [GRAND STRATEGY] - THE ULTIMATE FORTRESS
 * ------------------------------------------------------------------------------
 * 開発責任者: 齋藤 拓実 (Takumi Saito)
 * 特徴:
 * - モバイル完全最適化 (ボトムナビゲーション & 片手操作)
 * - ライブ・アクティビティ・ストリーム (GitHub/Server Log)
 * - ブラウザ・プッシュ通知統合
 * - 経営参謀型 AI エージェント
 * ==============================================================================
 */

// --- 1. Audio & Haptics Engine ---
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

// --- 2. Types ---
interface LogEntry { id: string; msg: string; type: 'ai'|'user'|'error'|'success'|'system'|'thinking'; time: string; }
interface Project { id: string; name: string; status: 'online'|'building'|'error'; load: number; repo: string; url: string; }
interface CommitEvent { id: string; repo: string; msg: string; time: string; }

// --- 3. UI Helper: Matrix Text ---
const MatrixText = ({ text }: { text: string }) => {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    let i = 0; const chars = "01アあイいウうエえオお";
    const speed = text.length > 50 ? 8 : 20;
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

// --- 4. Main Application ---
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

  // ライブ・アクティビティ・データ
  const [commitStream, setCommitStream] = useState<CommitEvent[]>([
    { id: 'c1', repo: 'LARUbot_homepage', msg: 'UIコンポーネントの最適化完了', time: '10:20' },
    { id: 'c2', repo: 'flastal-backend', msg: 'APIエンドポイントのセキュリティ強化', time: '09:45' }
  ]);

  const [projects, setProjects] = useState<Project[]>([
    { id: 'larubot', name: 'ラルボット', status: 'online', load: 30, repo: 'LARUbot_homepage', url: 'larubot.com' },
    { id: 'flastal', name: 'フラスタル', status: 'online', load: 12, repo: 'flastal-backend', url: 'flastal.net' },
    { id: 'laruvisona', name: 'ラルビソナ', status: 'online', load: 5, repo: 'laruvisona-corp-site', url: 'laruvisona.net' },
    { id: 'nexus', name: '要塞司令部', status: 'building', load: 75, repo: 'laru-control-panel', url: 'nexus.local' },
  ]);

  const ws = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- 通知許可の要求 ---
  const requestNotification = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        addLog('通知システム: 承認されました。社長の端末と直結します。', 'success');
        engine.playNotify();
      }
    }
  };

  // --- ローカルプッシュ通知 ---
  const sendNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  // --- WebSocket & リアルタイム更新 ---
  useEffect(() => {
    engine.init();
    const connect = () => {
      ws.current = new WebSocket('ws://localhost:8000/ws');
      ws.current.onopen = () => {
        setIsConnected(true);
        addLog('中枢神経系(CNS)への接続に成功。システムオールグリーン。', 'success');
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
            sendNotification('デプロイ完了', message.payload.msg);
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
    
    // KPIの擬似アニメーション & ライブログ生成
    const interval = setInterval(() => {
      if (isLive) setAudioLevel(Math.random() * 50);
      if (Math.random() > 0.9) {
        const repos = ['LARUbot', 'Flastal', 'Nexus'];
        const newCommit = {
          id: Math.random().toString(),
          repo: repos[Math.floor(Math.random() * repos.length)],
          msg: 'バックグラウンド・タスク完了',
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        };
        setCommitStream(prev => [newCommit, ...prev.slice(0, 4)]);
      }
    }, 2000);

    return () => {
      ws.current?.close();
      clearInterval(interval);
    };
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
    else { setIsLive(true); engine.playNotify(); addLog('音声司令モード: 入力待機中...', 'system'); }
  };

  return (
    <div className="fixed inset-0 bg-[#010101] text-cyan-400 font-mono flex flex-col overflow-hidden selection:bg-cyan-900 selection:text-white">
      {/* 視覚的マトリックス・グリッド */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#00f2ff 1px, transparent 1px), linear-gradient(90deg, #00f2ff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* HEADER (DESKTOP/MOBILE) */}
      <header className="h-14 border-b border-cyan-900/40 bg-black/60 backdrop-blur-xl flex items-center justify-between px-5 z-40 relative">
        <div className="flex items-center gap-3">
          <motion.div animate={{ rotate: isConnected ? 360 : 0 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
            <Zap className={isConnected ? 'text-cyan-400 drop-shadow-[0_0_8px_#00f2ff]' : 'text-gray-700'} size={18} />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-bold tracking-[0.2em] text-sm text-white uppercase">LARU NEXUS</span>
            <span className="text-[9px] text-cyan-700 font-bold uppercase tracking-widest">Grand Strategy v6.0</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={requestNotification} className="text-cyan-800 hover:text-cyan-400 transition-colors">
            <Bell size={18} />
          </button>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-[10px] font-bold text-green-500">
               <Wifi size={10}/> {isConnected ? 'SECURE_UPLINK' : 'LINK_LOST'}
            </div>
            <div className="text-[8px] text-gray-600 tracking-tighter uppercase mt-0.5">Saito_Holding_Fortress</div>
          </div>
        </div>
      </header>

      {/* COMMIT STREAM (LATEST DEVELOPMENTS) */}
      <div className="h-8 bg-cyan-950/20 border-b border-cyan-900/10 flex items-center overflow-hidden whitespace-nowrap px-4 z-30">
        <div className="flex items-center gap-2 text-[9px] font-bold text-cyan-800 mr-4 shrink-0">
          <GitBranch size={10} /> ライブ・フィード:
        </div>
        <div className="flex gap-8 animate-marquee">
           {commitStream.map(c => (
             <div key={c.id} className="text-[10px] text-gray-500 flex gap-2">
               <span className="text-cyan-700">[{c.repo}]</span>
               <span>{c.msg}</span>
               <span className="opacity-30">{c.time}</span>
             </div>
           ))}
        </div>
      </div>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        
        {/* SIDEBAR (DESKTOP ONLY) */}
        <nav className="hidden md:flex w-16 border-r border-cyan-900/20 flex-col items-center py-8 gap-8 bg-black/40">
          <SideNavBtn icon={<Terminal />} active={activeTab === 'COMMAND'} onClick={() => setActiveTab('COMMAND')} />
          <SideNavBtn icon={<Activity />} active={activeTab === 'KPI'} onClick={() => setActiveTab('KPI')} />
          <SideNavBtn icon={<History />} active={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')} />
        </nav>

        <AnimatePresence mode='wait'>
          {activeTab === 'COMMAND' && (
            <motion.div key="command" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex-1 flex flex-col h-full overflow-hidden">
              {/* HUD / AVATAR AREA */}
              <div className="p-4 flex items-center justify-between border-b border-cyan-900/10 bg-cyan-950/5">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <svg width="50" height="50" viewBox="0 0 100 120" fill="none" stroke={isProcessing ? "#00f2ff" : "#222"} strokeWidth="2" className="transition-all">
                      <path d="M15,30 L50,5 L85,30 L90,55 L50,110 L10,55 L15,30 Z" className="opacity-60" />
                      <circle cx="35" cy="45" r="2" fill={isProcessing ? "#00f2ff" : "#111"} />
                      <circle cx="65" cy="45" r="2" fill={isProcessing ? "#00f2ff" : "#111"} />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-cyan-600 mb-0.5 tracking-tighter">AI 戦略参謀ユニット</span>
                    <span className="text-xs text-white font-bold tracking-widest uppercase">Gemini 2.5 Singularity</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-gray-600 uppercase mb-1">演算負荷</div>
                  <div className="w-20 h-1 bg-gray-900 rounded-full overflow-hidden">
                    <motion.div animate={{ width: isProcessing ? '85%' : '15%' }} className="h-full bg-cyan-500 shadow-[0_0_8px_#00f2ff]" />
                  </div>
                </div>
              </div>

              {/* CONSOLE OUTPUT */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
                {logs.map((log) => (
                  <div key={log.id} className={`flex flex-col ${log.type === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className="text-[9px] text-gray-700 mb-1.5 font-bold tracking-tighter flex gap-2 uppercase">
                      <span>{log.time}</span>
                      <span className="text-cyan-900">{log.type}</span>
                    </div>
                    <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-lg ${
                      log.type === 'user' ? 'bg-cyan-900/30 border border-cyan-500/40 text-white' : 
                      log.type === 'error' ? 'bg-red-900/20 border border-red-500/40 text-red-400' :
                      log.type === 'success' ? 'bg-green-900/10 border border-green-500/20 text-green-300' :
                      'bg-transparent border-transparent text-cyan-100'
                    }`}>
                      {log.type === 'ai' || log.type === 'system' ? <MatrixText text={log.msg} /> : log.msg}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* COMMAND INPUT (BOTTOM DOCK) */}
              <div className="p-4 bg-black/80 backdrop-blur-2xl border-t border-cyan-900/30 flex items-center gap-3 z-50">
                <button onClick={toggleVoice} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isLive ? 'bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.4)]' : 'bg-cyan-900/20 border border-cyan-500/20 text-cyan-400'}`}>
                  <Mic size={20} className={isLive ? 'animate-pulse' : ''} />
                </button>
                <div className="flex-1 relative">
                  <input 
                    className="w-full h-12 bg-white/5 border border-cyan-900/30 rounded-2xl px-5 text-sm outline-none focus:border-cyan-400 transition-all text-white placeholder-cyan-900"
                    placeholder="司令を入力してください..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCommand(input)}
                    disabled={!isConnected}
                  />
                  <button onClick={() => handleCommand(input)} className="absolute right-3 top-3 text-cyan-600 hover:text-cyan-400">
                    <ChevronRight size={24} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'KPI' && (
            <motion.div key="kpi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 p-6 space-y-6 overflow-y-auto h-full">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold text-white tracking-[0.3em] uppercase border-l-4 border-cyan-500 pl-3">資産・インフラ稼働状況</h2>
                <div className="text-[10px] text-cyan-800">2026_GENESIS_REPORT</div>
              </div>
              
              {/* MAIN CHART */}
              <div className="h-56 border border-cyan-900/20 bg-cyan-950/5 rounded-3xl p-5">
                <div className="flex justify-between items-center mb-5">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Wifi size={12} className="text-cyan-500" /> ネットワークトラフィック
                  </div>
                  <div className="text-[10px] font-bold text-cyan-400">リアルタイム</div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpiData}>
                    <defs>
                      <linearGradient id="colorKPI" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="users" stroke="#00f2ff" strokeWidth={3} fill="url(#colorKPI)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* PROJECT LIST */}
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map(p => (
                  <div key={p.id} className="bg-white/5 border border-cyan-900/10 p-5 rounded-2xl flex items-center justify-between group active:scale-95 transition-all">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'online' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500'}`} />
                        <span className="text-xs font-bold text-white uppercase tracking-tighter">{p.name}</span>
                      </div>
                      <span className="text-[9px] text-gray-600 font-mono italic">{p.repo}</span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] font-bold text-cyan-800 uppercase">{p.status}</span>
                      <div className="w-24 h-1 bg-gray-900 rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${p.load}%` }} transition={{ duration: 1 }} className="h-full bg-cyan-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'HISTORY' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8">
              <div className="w-24 h-24 border-2 border-cyan-500/20 rounded-full flex items-center justify-center bg-cyan-500/5 shadow-[0_0_50px_rgba(0,242,255,0.05)]">
                <Lock size={40} className="text-cyan-900" />
              </div>
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white tracking-[0.4em] uppercase italic">Top Secret</h2>
                <p className="text-[11px] text-cyan-900 leading-relaxed max-w-[280px] mx-auto">
                  「齋藤ホールディングス」の戦略的ロードマップおよび経営アーカイブは、現在最高機密事項として暗号化されています。<br/>アクセスには社長の生体認証が必要です。
                </p>
              </div>
              <button onClick={() => engine.playError()} className="px-12 py-4 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 text-xs font-bold rounded-full hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_20px_rgba(0,242,255,0.1)]">
                特別アクセス権限を要求
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* MOBILE BOTTOM NAVIGATION (CORE INTERFACE) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-3xl border-t border-cyan-900/40 flex items-center justify-around px-2 z-50 md:hidden">
        <MobileTabBtn icon={<Terminal size={22}/>} label="指令" active={activeTab === 'COMMAND'} onClick={() => { setActiveTab('COMMAND'); engine.playTone(800, 'sine', 0.05); }} />
        <MobileTabBtn icon={<Activity size={22}/>} label="資産" active={activeTab === 'KPI'} onClick={() => { setActiveTab('KPI'); engine.playTone(800, 'sine', 0.05); }} />
        <div className="w-14 h-14 -mt-10 flex items-center justify-center bg-cyan-500 rounded-full border-4 border-[#010101] shadow-[0_0_25px_rgba(0,242,255,0.4)] transition-transform active:scale-90" onClick={() => setIsCommandOpen(true)}>
          <Command size={28} className="text-black" />
        </div>
        <MobileTabBtn icon={<History size={22}/>} label="履歴" active={activeTab === 'HISTORY'} onClick={() => { setActiveTab('HISTORY'); engine.playTone(800, 'sine', 0.05); }} />
        <MobileTabBtn icon={<Shield size={22}/>} label="要塞" active={false} onClick={() => engine.playError()} />
      </nav>

      {/* QUICK COMMAND PALETTE */}
      <AnimatePresence>
        {isCommandOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[100] p-5 flex flex-col pt-16 md:pt-[20vh] items-center">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-xl bg-[#080808] border border-cyan-500/40 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,242,255,0.15)]">
              <div className="p-5 border-b border-cyan-900/50 flex items-center gap-4 bg-white/5">
                <Search className="text-cyan-500" size={20} />
                <input 
                  className="bg-transparent border-none outline-none text-white flex-1 text-base font-mono"
                  placeholder="クイック・ディレクティブ..."
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleCommand((e.target as any).value)}
                />
              </div>
              <div className="p-3 space-y-1">
                <div className="text-[10px] text-cyan-900 font-bold px-4 py-2 uppercase tracking-[0.2em]">推奨アクション</div>
                <QuickCmdItem cmd="/deploy flastal" desc="フラスタル基盤を最新ビルドへ更新" onClick={() => handleCommand('/deploy flastal')} />
                <QuickCmdItem cmd="/deploy larubot" desc="AI HP のコンテンツを同期" onClick={() => handleCommand('/deploy larubot')} />
                <QuickCmdItem cmd="/status check" desc="全システムの統合診断を実行" onClick={() => handleCommand('/status check')} />
                <QuickCmdItem cmd="/ai brain_dump" desc="Gemini の思考ログを抽出" onClick={() => handleCommand('/ai brain_dump')} />
              </div>
            </motion.div>
            <button className="mt-10 text-cyan-900 text-xs font-bold tracking-[0.3em] uppercase border border-cyan-900/40 px-10 py-3 rounded-full hover:bg-cyan-500/10 active:scale-95 transition-all" onClick={() => setIsCommandOpen(false)}>閉じる</button>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="hidden md:flex h-6 border-t border-cyan-900/20 bg-black px-4 items-center justify-between text-[9px] text-gray-700 uppercase tracking-widest">
        <div>© 2026 LARUbot Holdings Inc.</div>
        <div className="flex gap-4">
          <span>Neural Engine: Gemini 2.5 Flash</span>
          <span>Status: Singularity Imminent</span>
        </div>
      </footer>
    </div>
  );
}

// --- 5. Sub-Components ---

function SideNavBtn({ icon, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`p-3 rounded-2xl transition-all duration-300 relative group ${active ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(0,242,255,0.2)]' : 'text-cyan-900 hover:text-cyan-400 hover:bg-white/5'}`}>
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-500 rounded-r shadow-[0_0_10px_#00f2ff]" />}
      {icon}
    </button>
  );
}

function MobileTabBtn({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${active ? 'text-cyan-400' : 'text-cyan-900'}`}>
      <div className={active ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]' : ''}>{icon}</div>
      <span className="text-[10px] font-bold tracking-tighter uppercase">{label}</span>
    </button>
  );
}

function QuickCmdItem({ cmd, desc, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full p-4 hover:bg-cyan-500/10 rounded-[1.5rem] flex items-center justify-between group active:bg-cyan-500/20 transition-all">
      <div className="flex flex-col items-start gap-1">
        <span className="text-cyan-200 font-bold font-mono text-sm group-hover:text-white transition-colors tracking-widest uppercase">{cmd}</span>
        <span className="text-[10px] text-gray-600 group-hover:text-cyan-700 transition-colors">{desc}</span>
      </div>
      <ChevronRight size={18} className="text-cyan-900 group-hover:text-cyan-400 transition-all group-hover:translate-x-1" />
    </button>
  );
}