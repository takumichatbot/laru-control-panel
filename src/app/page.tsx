'use client';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v8.6 [INFINITY_CORE_FIXED]
 * ------------------------------------------------------------------------------
 * 開発総責任者: 齋藤 拓実 (Takumi Saito)
 * 修正内容:
 * - 'ProjectCard' コンポーネントの定義漏れを修正
 * - 全コンポーネントの依存関係を解決
 * - TypeScript 型定義の完全準拠
 * ==============================================================================
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { 
  Terminal, Activity, Shield, Cpu, Mic, Search, Command, Wifi, Layers, 
  GitBranch, Lock, ChevronRight, Zap, Bell, History, Briefcase, Building2, 
  RefreshCw, Trash2, Camera, Settings, HardDrive, Database, Globe, 
  Eye, Power, Radio, X, CpuIcon, Cloud, Box, Key, Volume2, DatabaseBackup, 
  Fingerprint, Share2, FileText, Target, Rocket, ShieldCheck, ZapOff, WifiOff
} from 'lucide-react';

// --- 1. グローバル定数 ---
const COLORS = {
  cyan: '#00f2ff', magenta: '#ff006e', green: '#39ff14', yellow: '#ffea00', red: '#ff0040', bg: '#020202'
};

// --- 2. 高度音響エンジン (OmegaSoundEngine v7.1) ---
class OmegaSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const context = new AudioContextClass();
          this.ctx = context;
          this.masterGain = context.createGain();
          if (this.masterGain) {
            this.masterGain.connect(context.destination);
            this.masterGain.gain.setValueAtTime(0.2, context.currentTime);
          }
        }
      } catch (e) { console.warn(e); }
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn(e));
    }
  }

  private createOsc(freq: number, type: OscillatorType, duration: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(volume, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  play(type: string) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    switch (type) {
      case 'click': this.createOsc(800, 'sine', 0.1, 0.1); break;
      case 'success': this.createOsc(440, 'sine', 0.1, 0.1); setTimeout(() => this.createOsc(880, 'sine', 0.2, 0.1), 100); break;
      case 'alert': this.createOsc(200, 'sawtooth', 0.3, 0.15); setTimeout(() => this.createOsc(150, 'sawtooth', 0.3, 0.15), 200); break;
      case 'boot': [110, 220, 440].forEach((f, i) => setTimeout(() => this.createOsc(f, 'sawtooth', 0.5, 0.05), i * 150)); break;
      case 'typing': this.createOsc(1200 + Math.random() * 400, 'square', 0.02, 0.005); break;
      case 'notify': this.createOsc(1200, 'sine', 0.1, 0.1); setTimeout(() => this.createOsc(1600, 'sine', 0.1, 0.1), 50); break;
      case 'toggle': this.createOsc(600, 'square', 0.05, 0.05); break;
      case 'refresh': this.createOsc(500, 'sine', 0.2, 0.1); break;
      case 'clear': this.createOsc(300, 'sawtooth', 0.2, 0.1); break;
    }
  }
}
const sfx = new OmegaSoundEngine();

// --- 3. 型定義 ---
interface ProjectIssue { id: string; level: 'CRITICAL' | 'WARN' | 'INFO'; title: string; description: string; }
interface ProjectProposal { id: string; type: 'OPTIMIZATION' | 'SECURITY' | 'FEATURE'; title: string; impact: string; cost: string; }
interface ProjectData { 
  id: string; name: string; category: 'COMPANY' | 'CLIENT'; 
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE' | 'WAITING' | 'BUILDING'; 
  load: number; latency: number; repo: string; url: string; 
  stats: { cpu: number; memory: number; requests: number; errors: number; }; 
  issues: ProjectIssue[]; proposals: ProjectProposal[];
  logs: { time: string; msg: string; type: 'sys' | 'err' | 'out' }[];
}
interface LogEntry { id: string; msg: string; type: 'user' | 'gemini' | 'sys' | 'sec' | 'alert' | 'github' | 'browser' | 'thinking' | 'success'; imageUrl?: string; time: string; }
interface RoadmapItem { id: string; category: string; name: string; desc: string; benefits: string; status: 'PENDING' | 'DEVELOPING' | 'ACTIVE'; progress: number; }
interface ChartDataInput { name: string; users: number; requests: number; [key: string]: any; }

// --- 4. サブコンポーネント (UI) ---
const MatrixText = ({ text, speed = 10 }: { text: string, speed?: number }) => {
  const [display, setDisplay] = useState('');
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (Math.random() > 0.9) sfx.play('typing');
      setDisplay(text.substring(0, i) + chars[Math.floor(Math.random() * chars.length)]);
      i++;
      if (i > text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return <span className="font-mono">{display || text}</span>;
};

const ProStatus = ({ status }: { status: ProjectData['status'] }) => {
  const theme = {
    ONLINE: { color: 'text-green-400', label: '稼働中' },
    BUILDING: { color: 'text-yellow-400', label: '構築中' },
    WAITING: { color: 'text-cyan-700', label: '待機' },
    MAINTENANCE: { color: 'text-orange-500', label: '保守' },
    OFFLINE: { color: 'text-red-600', label: '停止' },
  }[status];
  return (
    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
      <div className={`w-1.5 h-1.5 rounded-full ${theme.color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`} />
      <span className={`text-[9px] font-bold uppercase tracking-widest ${theme.color}`}>{theme.label}</span>
    </div>
  );
};

// --- 5. メインコンポーネント ---
export default function LaruNexusV86() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'COMMAND' | 'KPI' | 'HISTORY' | 'SETTINGS'>('DASHBOARD');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [kpiData, setKpiData] = useState<ChartDataInput[]>([]);
  
  const [aiPersona, setAiPersona] = useState('あなたは齋藤社長の専属AI司令官です。');
  const [securityLevel, setSecurityLevel] = useState(5);
  const [useVoice, setUseVoice] = useState(true);

  // データ
  const [projects, setProjects] = useState<ProjectData[]>([
    { 
      id: 'larubot', name: 'LARUbot AI Engine', category: 'COMPANY', status: 'ONLINE', load: 28, latency: 45, repo: 'larubot-ai-v4', url: 'larubot.com',
      stats: { cpu: 12, memory: 45, requests: 1580, errors: 0 }, issues: [],
      proposals: [{ id: 'p1', type: 'FEATURE', title: '自律学習サイクル v3', impact: '回答精度 +30%', cost: 'High' }],
      logs: []
    },
    { 
      id: 'nexus', name: 'LARU NEXUS COMMAND', category: 'COMPANY', status: 'BUILDING', load: 82, latency: 12, repo: 'laru-control-panel', url: 'nexus.larubot.com',
      stats: { cpu: 85, memory: 65, requests: 4200, errors: 0 },
      issues: [{ id: 'i1', level: 'INFO', title: '要塞アップグレード中', description: 'v8.6 パッチ適用中' }],
      proposals: [], logs: []
    },
    { 
      id: 'laruvisona', name: 'Laruvisona Corp', category: 'COMPANY', status: 'ONLINE', load: 5, latency: 22, repo: 'laruvisona-hq', url: 'laruvisona.net',
      stats: { cpu: 4, memory: 15, requests: 850, errors: 0 }, issues: [], proposals: [], logs: []
    },
    { 
      id: 'flastal', name: 'Flastal (Client)', category: 'CLIENT', status: 'ONLINE', load: 48, latency: 88, repo: 'flastal-net', url: 'flastal.net',
      stats: { cpu: 42, memory: 58, requests: 9500, errors: 4 },
      issues: [{ id: 'i2', level: 'WARN', title: 'トラフィック過多', description: 'アクセス集中' }],
      proposals: [{ id: 'p3', type: 'OPTIMIZATION', title: 'オートスケーリング', impact: 'SLA維持', cost: 'High' }],
      logs: []
    },
  ]);

  const strategicRoadmap = useMemo<RoadmapItem[]>(() => [
    { id: 'rm1', category: 'AI', name: '自律コード修正', desc: 'ログ解析と自動修正', benefits: '開発コスト減', status: 'DEVELOPING', progress: 80 },
    { id: 'rm2', category: 'SECURITY', name: '量子耐性暗号', desc: '未来基準の暗号化', benefits: '完全秘匿性', status: 'PENDING', progress: 10 },
    { id: 'rm3', category: 'UX', name: '脳波インターフェース', desc: 'Neuralink連携', benefits: '思考操作', status: 'ACTIVE', progress: 30 },
    { id: 'rm4', category: 'AI', name: '社長デジタルツイン', desc: '思考模倣AI', benefits: '経営代行', status: 'PENDING', progress: 5 },
    { id: 'rm5', category: 'SECURITY', name: '自己焼却プロトコル', desc: '緊急データ抹消', benefits: '漏洩防止', status: 'ACTIVE', progress: 100 },
  ], []);

  const ws = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ログ追加
  const addLog = useCallback((msg: string, type: LogEntry['type'] = 'sys', imageUrl?: string) => {
    const time = new Date().toLocaleTimeString('ja-JP');
    const id = Math.random().toString(36).substring(2, 9);
    setLogs(prev => [...prev.slice(-99), { id, msg, type, imageUrl, time }]);
    
    if (type === 'alert') sfx.play('alert');
    else if (type === 'success') sfx.play('success');
    else if (type === 'browser') sfx.play('camera');
    else sfx.play('click');

    if (type === 'success' && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification("NEXUS 通知", { body: msg });
    }
  }, []);

  // WebSocket
  useEffect(() => {
    sfx.init();
    const connect = () => {
      ws.current = new WebSocket('ws://localhost:8000/ws');
      ws.current.onopen = () => { setIsConnected(true); addLog('CNS接続確立。システム正常。', 'sys'); sfx.play('boot'); };
      ws.current.onclose = () => { setIsConnected(false); setTimeout(connect, 3000); };
      ws.current.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'LOG') addLog(msg.payload.msg, msg.payload.type, msg.payload.imageUrl);
          else if (msg.type === 'KPI_UPDATE') setKpiData(prev => [...prev.slice(-20), msg.data]);
          else if (msg.type === 'PROJECT_UPDATE') setProjects(msg.data);
        } catch {}
      };
    };
    connect();
    setKpiData(Array.from({ length: 20 }).map((_, i) => ({ name: `${i}:00`, users: 50 + i, requests: 200 + i * 10 })));
    const interval = setInterval(() => { if (isLive) setAudioLevel(Math.random() * 80); }, 100);
    return () => { ws.current?.close(); clearInterval(interval); };
  }, [addLog, isLive]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs, isThinking]);

  // コマンド処理
  const handleCommand = (cmd?: string) => {
    const message = cmd || inputMessage;
    if (!message.trim() || !isConnected) return;
    addLog(message, 'user');
    setIsThinking(true);
    sfx.play('click');
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ command: message, persona: aiPersona, security_level: securityLevel }));
    }
    setInputMessage('');
    setIsThinking(false);
  };

  const startVoice = () => {
    sfx.play('click'); sfx.resume();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("音声入力非対応", "alert");
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.onstart = () => { setIsLive(true); addLog('マイク起動', 'sys'); sfx.play('notify'); };
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) handleCommand(transcript);
    };
    recognition.onend = () => setIsLive(false);
    recognition.start();
  };

  const requestNotif = async () => {
    if ('Notification' in window && await Notification.requestPermission() === 'granted') {
      addLog('通知許可: 同期完了', 'success');
    }
  };

  const handleRefresh = () => { sfx.play('refresh'); window.location.reload(); };
  const handleClear = () => { sfx.play('clear'); setLogs([]); addLog("ログ消去完了", "sys"); };

  // --- パネルコンポーネント ---

  const DashboardView = () => (
    <div className="p-6 space-y-8 overflow-y-auto pb-24">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white tracking-widest border-l-4 border-cyan-500 pl-4">監視グリッド</h2>
        <div className="flex items-center gap-4 text-xs font-bold text-cyan-700 bg-cyan-900/10 px-4 py-2 rounded-full">
          <Wifi size={14}/> {isConnected ? 'LINK SECURE' : 'OFFLINE'}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="text-xs text-cyan-600 font-bold uppercase tracking-widest px-2"><Building2 size={14} className="inline mr-2"/> 齋藤ホールディングス 資産</div>
          <div className="grid gap-4">
            {projects.filter(p => p.category === 'COMPANY').map(p => (
              <ProjectCard key={p.id} project={p} onAction={() => setSelectedProject(p)} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="text-xs text-yellow-600 font-bold uppercase tracking-widest px-2"><Briefcase size={14} className="inline mr-2"/> 受託プロジェクト</div>
          <div className="grid gap-4">
            {projects.filter(p => p.category === 'CLIENT').map(p => (
              <ProjectCard key={p.id} project={p} onAction={() => setSelectedProject(p)} isClient />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const CommandView = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-cyan-900/20 bg-black/60 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <motion.div animate={{ scale: isLive ? 1.1 : 1 }} className="relative">
            <Cpu size={40} className={isThinking ? 'text-cyan-400' : 'text-gray-700'} />
            {isThinking && <div className="absolute -inset-2 border border-cyan-500 rounded-full animate-ping"/>}
          </motion.div>
          <div>
            <div className="text-[10px] text-cyan-800 font-bold tracking-widest">AI COMMAND CORE</div>
            <div className="text-lg text-white font-bold tracking-widest">GEMINI 2.5</div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {logs.map(log => (
          <div key={log.id} className={`flex flex-col ${log.type === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="text-[10px] text-gray-600 mb-1 font-bold">{log.time} - {log.type.toUpperCase()}</div>
            <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed border ${
              log.type === 'user' ? 'bg-cyan-900/20 border-cyan-500/30 text-white' : 
              log.type === 'browser' ? 'bg-yellow-900/10 border-yellow-500/30 text-yellow-200' :
              'bg-white/5 border-white/10 text-cyan-100'
            }`}>
              {log.imageUrl && <img src={log.imageUrl} alt="Captured" className="w-full rounded-lg mb-2 border border-white/10" />}
              {log.type === 'gemini' ? <MatrixText text={log.msg} /> : log.msg}
            </div>
          </div>
        ))}
        {isThinking && <div className="p-4 text-cyan-500 animate-pulse">Thinking...</div>}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 border-t border-cyan-900/30 bg-black/80 flex items-center gap-4">
        <button onClick={startVoice} className={`p-3 rounded-full ${isLive ? 'bg-red-600' : 'bg-cyan-900/20 text-cyan-400'}`}><Mic size={20}/></button>
        <input className="flex-1 bg-white/5 border border-cyan-900/30 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none" placeholder="コマンド入力..." value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCommand()} />
        <button onClick={() => handleCommand()} className="text-cyan-500"><ChevronRight size={24}/></button>
      </div>
    </div>
  );

  const KpiView = () => (
    <div className="p-8 space-y-8 overflow-y-auto pb-24">
      <h2 className="text-xl font-bold text-white tracking-widest mb-6">ANALYTICS</h2>
      <div className="h-64 border border-cyan-900/30 bg-cyan-950/5 rounded-3xl p-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={kpiData}>
            <defs><linearGradient id="col" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis dataKey="name" stroke="#444" fontSize={10} />
            <YAxis stroke="#444" fontSize={10} />
            <Tooltip contentStyle={{backgroundColor:'#000', border:'1px solid #333'}} />
            <Area type="monotone" dataKey="requests" stroke={COLORS.cyan} fill="url(#col)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <StatBox label="TOTAL REVENUE" value="¥4.8M" sub="+120% YOY" color="text-yellow-400" />
        <StatBox label="AVG LATENCY" value="42ms" sub="OPTIMAL" color="text-green-400" />
      </div>
    </div>
  );

  const HistoryView = () => (
    <div className="p-8 space-y-8 overflow-y-auto pb-24">
      <h2 className="text-xl font-bold text-white tracking-widest mb-6">ROADMAP 2026</h2>
      <div className="grid gap-6">
        {strategicRoadmap.map(item => (
          <div key={item.id} className="p-6 border border-cyan-900/30 bg-white/5 rounded-3xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-cyan-500 bg-cyan-900/20 px-3 py-1 rounded">{item.category}</span>
              <span className={`text-xs font-bold ${item.status==='ACTIVE'?'text-green-400':'text-gray-500'}`}>{item.status}</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
            <p className="text-xs text-gray-400 mb-4">{item.desc}</p>
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500" style={{width: `${item.progress}%`}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SettingsView = () => (
    <div className="p-8 space-y-8 overflow-y-auto pb-24">
      <h2 className="text-xl font-bold text-white tracking-widest mb-6">SYSTEM CONFIG</h2>
      <div className="space-y-6">
        <div className="p-6 border border-cyan-900/30 bg-white/5 rounded-3xl">
          <label className="text-xs text-cyan-500 font-bold mb-2 block">AI PERSONA PROMPT</label>
          <textarea className="w-full h-32 bg-black border border-cyan-900/30 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none" value={aiPersona} onChange={e => setAiPersona(e.target.value)} />
        </div>
        <div className="p-6 border border-red-900/30 bg-red-950/10 rounded-3xl flex justify-between items-center">
          <div>
            <div className="text-red-500 font-bold text-sm">SECURITY LEVEL</div>
            <div className="text-xs text-red-800">Current: LEVEL {securityLevel}</div>
          </div>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(i => (
              <button key={i} onClick={() => setSecurityLevel(i)} className={`w-8 h-8 rounded border ${securityLevel===i ? 'bg-red-600 border-red-500 text-white' : 'border-red-900/30 text-red-900'}`}>{i}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#010101] text-cyan-400 font-mono flex flex-col overflow-hidden selection:bg-cyan-900 selection:text-white">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none z-0" />
      
      {/* Header */}
      <header className="h-16 border-b border-cyan-900/40 bg-black/80 backdrop-blur-md flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab('DASHBOARD')}>
          <Zap className={`text-cyan-400 ${isConnected?'animate-pulse':''}`} size={24} />
          <div>
            <div className="font-bold text-lg text-white tracking-widest">LARU NEXUS</div>
            <div className="text-[10px] text-cyan-800 font-bold">INFINITY_CORE v8.5</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-2">
            <HeaderBtn icon={<RefreshCw size={18}/>} onClick={handleRefresh} />
            <HeaderBtn icon={<Trash2 size={18}/>} onClick={handleClear} />
            <HeaderBtn icon={<Bell size={18}/>} onClick={requestNotif} />
          </div>
          <div className="flex flex-col items-end">
            <div className={`text-[10px] font-bold ${isConnected?'text-green-500':'text-red-500'}`}>{isConnected?'ONLINE':'OFFLINE'}</div>
            <div className="text-[8px] text-cyan-900">Takumi_BioLink</div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <SideNav activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 flex flex-col relative overflow-hidden bg-black/40">
          <AnimatePresence mode='wait'>
            {activeTab === 'DASHBOARD' && <motion.div key="dash" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full"><DashboardView /></motion.div>}
            {activeTab === 'COMMAND' && <motion.div key="cmd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full"><CommandView /></motion.div>}
            {activeTab === 'KPI' && <motion.div key="kpi" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full"><KpiView /></motion.div>}
            {activeTab === 'HISTORY' && <motion.div key="hist" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full"><HistoryView /></motion.div>}
            {activeTab === 'SETTINGS' && <motion.div key="set" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full"><SettingsView /></motion.div>}
          </AnimatePresence>
        </main>
      </div>

      <MobileDock activeTab={activeTab} setActiveTab={setActiveTab} setIsCommandOpen={setIsCommandOpen} />

      {/* Modals */}
      <AnimatePresence>
        {isCommandOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/95 z-[100] p-6 pt-24" onClick={() => setIsCommandOpen(false)}>
            <div className="w-full max-w-2xl mx-auto space-y-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-4 border-b border-cyan-900/50 pb-4">
                <Search className="text-cyan-500" />
                <input className="bg-transparent text-white text-xl w-full outline-none" placeholder="コマンド入力..." autoFocus onKeyDown={e => { if(e.key==='Enter') { handleCommand((e.target as any).value); setIsCommandOpen(false); } }} />
              </div>
              <div className="grid gap-4">
                <QuickAction icon={<Cpu/>} label="DEPLOY LARUBOT" onClick={() => handleCommand('/deploy larubot')} />
                <QuickAction icon={<Briefcase/>} label="DEPLOY FLASTAL" onClick={() => handleCommand('/deploy flastal')} />
                <QuickAction icon={<Shield/>} label="LOCKDOWN" onClick={() => handleCommand('/lockdown')} />
              </div>
            </div>
          </motion.div>
        )}
        {selectedProject && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedProject(null)}>
            <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-[#050505] border border-cyan-500/30 rounded-3xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedProject.name}</h2>
                  <p className="text-cyan-700 font-mono mt-2">{selectedProject.repo}</p>
                </div>
                <button onClick={() => setSelectedProject(null)}><X size={32}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <StatBox label="LATENCY" value={`${selectedProject.latency}ms`} sub="OPTIMAL" color="text-green-400" />
                <StatBox label="ERRORS" value={`${selectedProject.stats.errors}`} sub="KERNEL" color={selectedProject.stats.errors>0?'text-red-500':'text-cyan-500'} />
              </div>
              <button onClick={() => { handleCommand(`/deploy ${selectedProject.id}`); setSelectedProject(null); }} className="w-full py-4 bg-cyan-600 text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors">デプロイ実行</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- 6. コンポーネント (ProjectCard定義を含む完全版) ---

function ProjectCard({ project, onAction, isClient = false }: { project: ProjectData, onAction: () => void, isClient?: boolean }) {
  return (
    <motion.div 
      layoutId={`proj-${project.id}`} 
      onClick={onAction} 
      whileHover={{ y: -4, scale: 1.01 }} 
      className={`relative p-6 rounded-3xl border cursor-pointer transition-all duration-300 group shadow-lg ${
        isClient ? 'bg-yellow-950/10 border-yellow-500/20 hover:border-yellow-500/50' : 'bg-cyan-950/10 border-cyan-500/20 hover:border-cyan-500/50'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-lg font-black uppercase tracking-widest italic ${isClient ? 'text-yellow-500' : 'text-cyan-400'}`}>
            {project.name}
          </h3>
          <p className="text-[10px] text-gray-500 font-mono mt-1">{project.repo}</p>
        </div>
        <ProStatus status={project.status} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
          <span>Load</span><span>{project.load}%</span>
        </div>
        <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${project.load}%` }} className={`h-full ${isClient?'bg-yellow-500':'bg-cyan-500'}`} />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center opacity-60 group-hover:opacity-100">
        <div className="flex gap-4 text-[10px] font-mono text-gray-400">
          <span>CPU: {project.stats.cpu}%</span>
          <span>MEM: {project.stats.memory}%</span>
        </div>
        <ChevronRight size={16} className={isClient?'text-yellow-500':'text-cyan-500'} />
      </div>
    </motion.div>
  );
}

function SideNav({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: any) => void }) {
  return (
    <nav className="hidden md:flex w-20 border-r border-cyan-900/30 flex-col items-center py-8 gap-8 bg-black/60 z-40">
      <SideBtn icon={<Terminal/>} active={activeTab==='COMMAND'} onClick={() => setActiveTab('COMMAND')} />
      <SideBtn icon={<Activity/>} active={activeTab==='DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} />
      <SideBtn icon={<Layers/>} active={activeTab==='KPI'} onClick={() => setActiveTab('KPI')} />
      <SideBtn icon={<History/>} active={activeTab==='HISTORY'} onClick={() => setActiveTab('HISTORY')} />
      <div className="flex-1" />
      <SideBtn icon={<Settings/>} active={activeTab==='SETTINGS'} onClick={() => setActiveTab('SETTINGS')} />
    </nav>
  );
}

function SideBtn({ icon, active, onClick }: any) {
  return <button onClick={onClick} className={`p-4 rounded-2xl transition-all ${active ? 'bg-cyan-500/20 text-cyan-400' : 'text-cyan-900 hover:text-cyan-500'}`}>{icon}</button>;
}

function MobileDock({ setActiveTab, activeTab, setIsCommandOpen, requestNotification }: any) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/90 border-t border-cyan-900/50 flex items-center justify-around z-50 md:hidden pb-safe">
      <MobBtn icon={<Terminal/>} active={activeTab==='COMMAND'} onClick={() => setActiveTab('COMMAND')} />
      <MobBtn icon={<Activity/>} active={activeTab==='DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} />
      <div className="w-16 h-16 -mt-10 flex items-center justify-center bg-cyan-500 rounded-full border-4 border-black shadow-[0_0_20px_#00f2ff]" onClick={() => setIsCommandOpen(true)}><Command size={28} className="text-black"/></div>
      <MobBtn icon={<History/>} active={activeTab==='HISTORY'} onClick={() => setActiveTab('HISTORY')} />
      <MobBtn icon={<Shield/>} active={false} onClick={requestNotification} />
    </nav>
  );
}

function MobBtn({ icon, active, onClick }: any) {
  return <button onClick={onClick} className={`p-2 ${active ? 'text-cyan-400' : 'text-gray-600'}`}>{icon}</button>;
}

function HeaderBtn({ icon, onClick }: any) {
  return <button onClick={onClick} className="p-2 hover:bg-white/5 rounded-lg text-cyan-800 hover:text-cyan-400 transition-colors">{icon}</button>;
}

function QuickAction({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-cyan-900/30 hover:bg-cyan-500/10 transition-colors">
      <div className="text-cyan-500">{icon}</div>
      <span className="font-bold text-white text-sm tracking-widest">{label}</span>
    </button>
  );
}

function StatBox({ label, value, sub, color="text-white" }: any) {
  return (
    <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
      <div className="text-[10px] text-gray-500 font-bold tracking-widest mb-2">{label}</div>
      <div className={`text-3xl font-black italic ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-600 mt-1">{sub}</div>
    </div>
  );
}