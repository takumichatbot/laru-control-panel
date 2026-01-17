'use client';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v8.5 [INFINITY_CORE_STRICT]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President)
 * DATE: 2026-01-17
 * * [SYSTEM ARCHITECTURE DOCUMENTATION]
 * -----------------------------------
 * This system represents the pinnacle of executive command interfaces, designed
 * specifically for Saito Holdings. It integrates real-time asset monitoring,
 * autonomous AI command execution, and deep strategic planning visualization.
 * * TECH STACK:
 * - Framework: Next.js 15 (App Router)
 * - UI Library: React 19 + Framer Motion
 * - Visualization: Recharts (Customized for Dark Mode)
 * - Audio Engine: OmegaAudioEngine v7.0 (Web Audio API)
 * - Styling: Tailwind CSS (Utility-first)
 * * [ERROR FIX REPORT]
 * - Fixed: 'Object is possibly null' in AudioContext.
 * - Fixed: Missing 'SideBtn' and 'SettingsView' components.
 * - Fixed: Invalid 'shadow' prop in Recharts components.
 * - Fixed: Type mismatch in Array.map callbacks.
 * - Fixed: Implicit 'any' type errors.
 * ==============================================================================
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { 
  Terminal, Activity, Shield, Cpu, Mic, Search, AlertCircle, 
  CheckCircle, Command, Wifi, Layers, GitBranch, Lock, ChevronRight, 
  Zap, Bell, History, Briefcase, Building2, RefreshCw, Trash2, 
  Camera, Settings, HardDrive, Database, Globe, 
  Eye, Power, Radio, X, CpuIcon, Cloud, Box, Key, 
  Volume2, DatabaseBackup, Fingerprint, Network, Share2, 
  FileText, Target, Rocket, ShieldCheck, ZapOff, WifiOff
} from 'lucide-react';

// --- 1. グローバル定数定義 (Strict Constants) ---
const COLORS = {
  cyan: '#00f2ff',
  magenta: '#ff006e',
  green: '#39ff14',
  yellow: '#ffea00',
  red: '#ff0040',
  bg: '#020202',
  card: 'rgba(255, 255, 255, 0.02)',
  border: 'rgba(0, 242, 255, 0.2)'
};

// --- 2. 高度音響合成エンジン (OmegaSoundEngine v7.0 - Strict Null Safe) ---
class OmegaSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  /**
   * オーディオコンテキストの初期化
   * SSR対策とNullチェックを徹底
   */
  init() {
    if (typeof window === 'undefined') return;
    
    // コンテキストが未作成の場合のみ作成
    if (!this.ctx) {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const context = new AudioContextClass();
          this.ctx = context;
          this.masterGain = context.createGain();
          
          // GainNodeの接続確認
          if (this.masterGain) {
            this.masterGain.connect(context.destination);
            this.masterGain.gain.setValueAtTime(0.2, context.currentTime);
          }
        }
      } catch (error) {
        console.warn('OmegaSoundEngine Init Failed:', error);
      }
    }
  }

  /**
   * ブラウザの自動再生制限解除用
   */
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn('Audio resume failed', e));
    }
  }

  /**
   * 内部用オシレーター生成（厳格なNullチェック付き）
   */
  private createOsc(freq: number, type: OscillatorType = 'sine', duration: number = 0.1, volume: number = 0.1) {
    // コンテキストまたはゲインが存在しない場合は即終了
    if (!this.ctx || !this.masterGain) return;
    
    this.resume();

    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // エラー発生時は無視（音響は必須機能ではないため）
    }
  }

  /**
   * 統合再生メソッド (Play Method)
   */
  play(type: 'click' | 'success' | 'alert' | 'boot' | 'toggle' | 'refresh' | 'clear' | 'camera' | 'typing' | 'notify') {
    // 初期化を試みる
    this.init();
    
    // それでもコンテキストが無い場合は終了
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    switch (type) {
      case 'click':
        this.createOsc(800, 'sine', 0.05, 0.1);
        break;
      case 'success':
        this.createOsc(440, 'sine', 0.1, 0.1);
        setTimeout(() => this.createOsc(880, 'sine', 0.2, 0.1), 100);
        break;
      case 'alert':
        this.createOsc(200, 'sawtooth', 0.3, 0.15);
        setTimeout(() => this.createOsc(150, 'sawtooth', 0.3, 0.15), 200);
        break;
      case 'boot':
        [110, 220, 330, 440].forEach((f, i) => {
          setTimeout(() => this.createOsc(f, 'sawtooth', 1.0, 0.05), i * 150);
        });
        break;
      case 'toggle':
        this.createOsc(600, 'square', 0.05, 0.05);
        break;
      case 'refresh':
        this.createOsc(500, 'sine', 0.2, 0.1);
        setTimeout(() => this.createOsc(1000, 'sine', 0.2, 0.1), 100);
        break;
      case 'clear':
        this.createOsc(300, 'sawtooth', 0.3, 0.1);
        break;
      case 'typing':
        this.createOsc(1200 + Math.random() * 400, 'square', 0.02, 0.005);
        break;
      case 'notify':
        this.createOsc(1200, 'sine', 0.1, 0.1);
        setTimeout(() => this.createOsc(1500, 'sine', 0.1, 0.1), 50);
        break;
      case 'camera':
        // カメラシャッター音（ノイズバッファ）
        try {
          const bufferSize = this.ctx.sampleRate * 0.1;
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.2, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          noise.connect(noiseGain);
          noiseGain.connect(this.masterGain);
          noise.start();
        } catch(e) {}
        break;
    }
  }
}
const sfx = new OmegaSoundEngine();

// --- 3. 厳格なインターフェース定義 (Strict Types) ---
// TypeScriptのエラーを回避するため、全てのオブジェクト構造を定義します。

interface ProjectIssue { 
  id: string; 
  level: 'CRITICAL' | 'WARN' | 'INFO'; 
  title: string; 
  description: string; 
}

interface ProjectProposal { 
  id: string; 
  type: 'OPTIMIZATION' | 'SECURITY' | 'FEATURE'; 
  title: string; 
  impact: string; 
  cost: string; 
}

interface ProjectData { 
  id: string; 
  name: string; 
  category: 'COMPANY' | 'CLIENT'; 
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE' | 'WAITING' | 'BUILDING'; 
  load: number; 
  latency: number; 
  repo: string; 
  url: string; 
  stats: { 
    cpu: number; 
    memory: number; 
    requests: number; 
    errors: number; 
  }; 
  issues: ProjectIssue[]; 
  proposals: ProjectProposal[];
  logs: { 
    time: string; 
    msg: string; 
    type: 'sys' | 'err' | 'out' 
  }[];
}

interface LogEntry { 
  id: string; 
  msg: string; 
  type: 'user' | 'gemini' | 'sys' | 'sec' | 'alert' | 'github' | 'browser' | 'thinking' | 'success'; 
  imageUrl?: string; 
  time: string; 
}

interface RoadmapItem { 
  id: string; 
  category: 'AI' | 'INFRA' | 'UX' | 'SECURITY'; 
  name: string; 
  desc: string; 
  benefits: string; 
  status: 'PENDING' | 'DEVELOPING' | 'ACTIVE'; 
  progress: number;
}

interface ChartDataInput { 
  name: string; 
  users: number; 
  requests: number; 
  [key: string]: string | number | boolean; 
}

// --- 4. 共通UIコンポーネント (Atomic Design) ---

/**
 * 視覚演出: マトリックス・テキスト・デコーダー
 */
const MatrixText = ({ text, speed = 10, onComplete }: { text: string, speed?: number, onComplete?: () => void }) => {
  const [display, setDisplay] = useState('');
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789アイウエオカキクケコ";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (Math.random() > 0.85) sfx.play('typing');
      setDisplay(text.substring(0, i) + chars[Math.floor(Math.random() * chars.length)]);
      i++;
      if (i > text.length) {
        clearInterval(interval);
        setDisplay(text);
        if (onComplete) onComplete();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return <span className="font-mono tracking-tighter break-words">{display}</span>;
};

/**
 * プロフェッショナル・ステータス表示
 */
const ProStatus = ({ status }: { status: ProjectData['status'] }) => {
  const theme = {
    ONLINE: { color: 'text-green-400', label: '稼働中' },
    BUILDING: { color: 'text-yellow-400', label: '構築中' },
    WAITING: { color: 'text-cyan-700', label: '待機' },
    MAINTENANCE: { color: 'text-orange-500', label: '保守' },
    OFFLINE: { color: 'text-red-600', label: '停止' },
  }[status];

  return (
    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5 shadow-inner">
      <motion.div 
        animate={{ opacity: [1, 0.4, 1] }} 
        transition={{ duration: 1.5, repeat: Infinity }} 
        className={`w-1.5 h-1.5 rounded-full ${theme.color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`} 
      />
      <span className={`text-[9px] font-black uppercase tracking-widest ${theme.color}`}>{theme.label}</span>
    </div>
  );
};

// --- 5. メインアプリケーションコンポーネント ---
export default function LaruNexusInfinityCore() {
  // --- A. 状態管理 (Central State) ---
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
  
  // Settings State
  const [aiPersona, setAiPersona] = useState('あなたは齋藤社長の専属AI司令官です。冷徹かつ情熱的に、世界を支配する技術経営をサポートしてください。');
  const [securityLevel, setSecurityLevel] = useState(5);
  const [useVoice, setUseVoice] = useState(true);

  // --- B. 資産データ (Mock Data for Render) ---
  const [projects, setProjects] = useState<ProjectData[]>([
    { 
      id: 'larubot', name: 'LARUbot AI Engine', category: 'COMPANY', status: 'ONLINE', load: 28, latency: 45, repo: 'larubot-ai-v4', url: 'larubot.com',
      stats: { cpu: 12, memory: 45, requests: 1580, errors: 0 }, issues: [],
      proposals: [{ id: 'p1', type: 'FEATURE', title: '自律学習サイクル v3', impact: '回答精度 +30%', cost: 'High' }],
      logs: [{ time: '01:45', msg: 'Core neural uplink synchronized.', type: 'sys' }]
    },
    { 
      id: 'nexus', name: 'LARU NEXUS COMMAND', category: 'COMPANY', status: 'BUILDING', load: 82, latency: 12, repo: 'laru-control-panel', url: 'nexus.larubot.com',
      stats: { cpu: 85, memory: 65, requests: 4200, errors: 0 },
      issues: [{ id: 'i1', level: 'INFO', title: '要塞アップグレード中', description: 'v8.5 INFINITY パッチを適用しています。' }],
      proposals: [{ id: 'p2', type: 'SECURITY', title: '生体量子暗号化', impact: '防御レベル向上', cost: 'Medium' }],
      logs: []
    },
    { 
      id: 'laruvisona', name: 'Laruvisona Corp', category: 'COMPANY', status: 'ONLINE', load: 5, latency: 22, repo: 'laruvisona-hq', url: 'laruvisona.net',
      stats: { cpu: 4, memory: 15, requests: 850, errors: 0 }, issues: [], proposals: [], logs: []
    },
    { 
      id: 'flastal', name: 'Flastal (Client)', category: 'CLIENT', status: 'ONLINE', load: 48, latency: 88, repo: 'flastal-net', url: 'flastal.net',
      stats: { cpu: 42, memory: 58, requests: 9500, errors: 4 },
      issues: [{ id: 'i2', level: 'WARN', title: 'トラフィック過多', description: '顧客サイトのアクセスが急増しています。' }],
      proposals: [{ id: 'p3', type: 'OPTIMIZATION', title: 'オートスケーリング', impact: 'SLA維持', cost: 'High' }],
      logs: []
    },
  ]);

  const strategicRoadmap = useMemo<RoadmapItem[]>(() => [
    { id: 'rm1', category: 'AI', name: '自律コード修正', desc: 'エラーログからバグを特定し自動PR作成', benefits: '開発停止時間ゼロ', status: 'DEVELOPING', progress: 85 },
    { id: 'rm2', category: 'SECURITY', name: '量子耐性暗号化', desc: 'ハッキング不可能な通信路の確立', benefits: '絶対的な機密保持', status: 'PENDING', progress: 10 },
    { id: 'rm3', category: 'UX', name: '脳波司令インターフェース', desc: 'Neuralink経由での思考操作', benefits: '思考即実行', status: 'ACTIVE', progress: 35 },
    { id: 'rm4', category: 'AI', name: '社長デジタルツイン', desc: '齋藤社長の思考を完全に模倣する経営AI', benefits: '24時間経営代行', status: 'PENDING', progress: 5 },
    { id: 'rm5', category: 'SECURITY', name: '自己焼却プロトコル', desc: '物理奪取時のデータ瞬時抹消', benefits: '機密保持の最終手段', status: 'ACTIVE', progress: 100 },
    { id: 'rm6', category: 'INFRA', name: '衛星緊急バックアップ', desc: 'Starlinkによる地上インフラ迂回', benefits: '災害時の司令権維持', status: 'PENDING', progress: 15 },
    { id: 'rm7', category: 'AI', name: '感情認識マーケティング', desc: '声色から需要を予測', benefits: 'LTV 3x 向上', status: 'DEVELOPING', progress: 40 },
    { id: 'rm8', category: 'INFRA', name: 'マルチクラウド避難', desc: 'AWS/GCPの瞬時切り替え', benefits: '稼働率 100%', status: 'PENDING', progress: 0 },
    { id: 'rm9', category: 'AI', name: '競合サービス自律偵察', desc: '24時間のライバル監視・要約', benefits: '戦略の先手奪取', status: 'ACTIVE', progress: 95 },
    { id: 'rm10', category: 'UX', name: 'ホログラム指令室', desc: 'AR/VR 空間投影 UI', benefits: '物理モニター制約の消失', status: 'PENDING', progress: 0 },
    { id: 'rm11', category: 'SECURITY', name: '声紋生体ロック', desc: '社長の声質以外を物理的に拒絶', benefits: '認証の完成', status: 'ACTIVE', progress: 100 },
    { id: 'rm12', category: 'AI', name: '契約書法的リスク自動判定', desc: 'コンプライアンスの完全自動化', benefits: 'リーガルコスト 90% 削減', status: 'PENDING', progress: 0 },
    { id: 'rm13', category: 'INFRA', name: '自律電源グリーンサーバー', desc: '太陽光直結のゼロコスト運用', benefits: '固定費の極限削減', status: 'PENDING', progress: 5 },
    { id: 'rm14', category: 'AI', name: '多言語リアルタイム通訳', desc: '全言語対応のグローバル展開', benefits: '市場の全世界拡大', status: 'DEVELOPING', progress: 60 },
    { id: 'rm15', category: 'UX', name: '超低遅延音声対話(50ms)', desc: '人間と区別不能な応答ラグ', benefits: 'AIとの真のシンクロ', status: 'ACTIVE', progress: 100 },
    { id: 'rm16', category: 'SECURITY', name: 'ディープフェイク防護壁', desc: 'なりすまし攻撃の完全検知', benefits: '社会的信用の保護', status: 'DEVELOPING', progress: 45 },
    { id: 'rm17', category: 'AI', name: 'トレンド予言オラクル', desc: '3ヶ月先の市場需要を特定', benefits: '先行投資成功率向上', status: 'PENDING', progress: 0 },
    { id: 'rm18', category: 'INFRA', name: '自己修復ストレージ', desc: '劣化の予兆検知と自動復旧', benefits: 'データ損失の永久回避', status: 'PENDING', progress: 0 },
    { id: 'rm19', category: 'AI', name: '完全自律経営戦略室', desc: '利益最大化の自動M&A提案', benefits: 'グループ規模の無限拡大', status: 'PENDING', progress: 0 },
    { id: 'rm20', category: 'UX', name: 'NEXUS INFINITY 完成', desc: '本OSの究極的な完成', benefits: '齋藤社長による世界掌握', status: 'ACTIVE', progress: 100 },
  ], []);

  const ws = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- C. コア・ロジック実装 ---

  /**
   * システムログ追加 (SFX/ハプティクス/視覚統合)
   */
  const addLog = useCallback((msg: string, type: LogEntry['type'] = 'sys', imageUrl?: string) => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const id = Math.random().toString(36).substring(2, 11);
    
    setLogs(prev => [...prev.slice(-150), { id, msg, type, imageUrl, time }]);
    
    // 音響フィードバック
    if (type === 'sec' || type === 'alert') sfx.play('alert');
    else if (type === 'sys' || type === 'github' || type === 'success') sfx.play('success');
    else if (type === 'browser') sfx.play('camera');
    else sfx.play('click');

    // ブラウザ・プッシュ通知
    if (type === 'success' && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification("NEXUS 司令完了", { body: msg });
    }

    // スマホバイブレーション (ハプティクス)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'alert') navigator.vibrate([200, 100, 200]);
      else if (type === 'success') navigator.vibrate(50);
    }
  }, []);

  /**
   * WebSocket接続 & リアルタイム監視
   */
  useEffect(() => {
    sfx.init();
    const connect = () => {
      // ローカルバックエンド (Python/FastAPI) と接続
      ws.current = new WebSocket('ws://localhost:8000/ws');
      
      ws.current.onopen = () => {
        setIsConnected(true);
        addLog('中枢神経系(CNS)ハンドシェイク完了。システムオンライン。', 'sys');
        sfx.play('boot');
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 3000); 
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'LOG') {
            addLog(message.payload.msg, message.payload.type, message.payload.imageUrl);
          } else if (message.type === 'KPI_UPDATE') {
            setKpiData(prev => [...prev.slice(-30), message.data]);
          } else if (message.type === 'PROJECT_UPDATE') {
            setProjects(message.data);
          }
        } catch (e) {
          console.warn('WebSocket Parse Error', e);
        }
      };
    };

    connect();

    // KPI 初期描画データ
    setKpiData(Array.from({ length: 20 }).map((_, i) => ({
      name: `${i}:00`, users: 60 + Math.floor(Math.random() * 30), requests: 500 + Math.floor(Math.random() * 200)
    })));

    const audioMonitor = setInterval(() => {
      if (isLive) setAudioLevel(Math.random() * 80);
    }, 100);

    return () => {
      ws.current?.close();
      clearInterval(audioMonitor);
    };
  }, [addLog, isLive]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs, isThinking]);

  /**
   * 司令送信
   */
  const handleCommand = (cmd?: string) => {
    const message = cmd || inputMessage;
    if (!message.trim() || !isConnected) return;

    addLog(message, 'user');
    setIsThinking(true);
    sfx.play('click');

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ 
        command: message,
        persona: aiPersona,
        security_level: securityLevel,
        timestamp: Date.now()
      }));
    } else {
      addLog('エラー: 通信リンクがオフラインです。', 'alert');
    }

    setInputMessage('');
    setIsThinking(false);
  };

  /**
   * 音声認識の物理起動
   */
  const startVoiceCommand = () => {
    sfx.play('click');
    sfx.resume();
    
    // iOS/Safari 対策: 音声読み上げの空打ち
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const dummy = new SpeechSynthesisUtterance('');
        dummy.volume = 0; window.speechSynthesis.speak(dummy);
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("音声入力非対応ブラウザです。", "alert");

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;

    recognition.onstart = () => { setIsLive(true); addLog('マイクアクティブ。司令をどうぞ。', 'sys'); sfx.play('notify'); };
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) {
        let normalized = transcript.replace(/フラスタル/g, 'flastal').replace(/ラルボット/g, 'larubot').replace(/ネクサス/g, 'nexus');
        handleCommand(normalized);
      }
    };
    recognition.onerror = () => setIsLive(false);
    recognition.onend = () => setIsLive(false);

    try { recognition.start(); } catch (e) { console.error(e); }
  };

  /**
   * 通知許可リクエスト
   */
  const requestNotification = async () => {
    sfx.play('click');
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        addLog('通知システム: 社長端末との同期完了。要塞防護開始。', 'success');
        sfx.play('success');
      } else {
        addLog('通知システム: 拒絶されました。物理アラートのみ稼働します。', 'alert');
      }
    }
  };

  /**
   * システム機能: 更新・抹消
   */
  const handleRefresh = () => { sfx.play('refresh'); window.location.reload(); };
  const handleClearLogs = () => { sfx.play('clear'); setLogs([]); addLog("要塞記録を完全抹消しました。", "sys"); };

  // --- D. レイアウト構成 & ビュー定義 ---

  /**
   * 監視パネル (DashboardView)
   */
  const DashboardView = () => (
    <div className="flex-1 p-6 md:p-12 space-y-10 overflow-y-auto pb-24 md:pb-12 scrollbar-hide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-6">
        <div>
          <h2 className="text-sm font-black text-white tracking-[0.6em] uppercase border-l-4 border-cyan-500 pl-5 mb-2 italic shadow-2xl">監視グリッド</h2>
          <p className="text-[10px] text-cyan-950 font-black tracking-widest ml-4 uppercase opacity-60 italic">Saito Holdings Integrated Network Environment</p>
        </div>
        <div className="flex items-center gap-6 text-[10px] font-black text-cyan-800 bg-cyan-900/10 px-8 py-3 rounded-[3rem] border border-cyan-900/30 backdrop-blur-3xl shadow-inner">
           <div className="flex items-center gap-2"><Wifi size={14}/> LINK: {isConnected ? <span className="text-green-500 shadow-[0_0_10px_#22c55e]">SECURE</span> : <span className="text-red-600 animate-pulse">OFFLINE</span>}</div>
           <div className="w-px h-5 bg-cyan-900/40" />
           <div className="flex items-center gap-2"><CpuIcon size={14}/> NODES: {projects.length} ACTIVE</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* 自社資産 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-[11px] text-cyan-600 font-black uppercase tracking-[0.4em] px-3 italic">
            <Building2 size={16}/> Saito_Corp_Assets
          </div>
          <div className="grid gap-4">
            {projects.filter(p => p.category === 'COMPANY').map((p: ProjectData) => (
              <ProjectCard key={p.id} project={p} onAction={() => setSelectedProject(p)} />
            ))}
          </div>
        </section>

        {/* 受託案件 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-[11px] text-yellow-600 font-black uppercase tracking-[0.4em] px-3 italic">
            <Briefcase size={16}/> Client_Contracts
          </div>
          <div className="grid gap-4">
            {projects.filter(p => p.category === 'CLIENT').map((p: ProjectData) => (
              <ProjectCard key={p.id} project={p} onAction={() => setSelectedProject(p)} isClient />
            ))}
          </div>
        </section>
      </div>

      {/* 統合インフラ・マトリックス */}
      <div className="border border-cyan-900/20 bg-cyan-950/5 rounded-[4rem] p-12 shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none group-hover:scale-150 transition-transform duration-[3s]" />
        <h3 className="text-xs font-black text-cyan-500 tracking-[0.8em] flex items-center gap-6 mb-20 uppercase italic underline underline-offset-[16px] decoration-cyan-900">
          <HardDrive size={24}/> Neural Hardware Matrix
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-16">
           <QuantumGauge label="NEURAL CPU" value={82} unit="GHz" />
           <QuantumGauge label="HBM VRAM" value={54} unit="GB" color={COLORS.magenta} />
           <QuantumGauge label="DATA FLUX" value={98} unit="GBPS" color={COLORS.green} />
           <QuantumGauge label="NODE TEMP" value={31} unit="°C" color={COLORS.yellow} />
        </div>
      </div>
    </div>
  );

  /**
   * 司令コンソール (CommandView)
   */
  const CommandView = () => (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-black to-[#080808] relative">
      {/* 司令部 HUD */}
      <div className="p-8 md:p-10 flex items-center justify-between border-b border-cyan-900/20 bg-black/60 backdrop-blur-3xl shadow-2xl z-40">
        <div className="flex items-center gap-10">
          <div className="relative group cursor-pointer" onClick={() => sfx.play('click')}>
             <motion.div animate={{ scale: isLive ? [1, 1.2, 1] : 1, rotate: isThinking ? [0, 5, -5, 0] : 0 }} transition={{ duration: 0.5, repeat: Infinity }}>
               <svg width="70" height="90" viewBox="0 0 100 120" fill="none" stroke={isThinking ? COLORS.cyan : "#222"} strokeWidth="3" className="transition-all duration-700 filter drop-shadow-[0_0_20px_rgba(0,242,255,0.4)]">
                  <path d="M15,30 L50,5 L85,30 L90,55 L50,110 L10,55 L15,30 Z" className="opacity-80" />
                  <circle cx="35" cy="45" r="1.5" fill={isThinking ? COLORS.cyan : "#111"} />
                  <circle cx="65" cy="45" r="1.5" fill={isThinking ? COLORS.cyan : "#111"} />
                  <path d={`M38,85 Q50,${85 + (audioLevel / 4)} 62,85`} stroke={isThinking ? COLORS.cyan : "#333"} strokeWidth="4" />
               </svg>
             </motion.div>
             {isThinking && <div className="absolute -inset-6 border-2 border-cyan-500/10 rounded-full animate-ping" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-black text-cyan-800 uppercase italic mb-3 tracking-[0.5em] opacity-80 decoration-cyan-900 underline underline-offset-8">Cognitive Nexus V8.5</span>
            <h2 className="text-3xl text-white font-black tracking-[0.4em] uppercase italic italic drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">Gemini 2.5 Infinity</h2>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-16 font-black italic">
           <Metric label="CNS_UPTIME" value="2048:12:45" />
           <Metric label="SECURITY_LV" value={`TIER ${securityLevel}`} color="text-red-600" />
           <div className="w-px h-16 bg-cyan-900/30" />
           <div className="flex items-center gap-5 bg-black/60 px-8 py-4 rounded-3xl border border-white/5 shadow-inner">
              <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-[0_0_20px_#22c55e] animate-pulse" />
              <span className="text-[13px] text-white uppercase tracking-[0.4em] font-black">Neural_Optimal</span>
           </div>
        </div>
      </div>

      {/* ログストリーム */}
      <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide bg-gradient-to-t from-black via-transparent to-transparent">
        <AnimatePresence initial={false}>
          {logs.map((log: LogEntry) => (
            <motion.div key={log.id} initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} className={`flex flex-col ${log.type === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="text-[12px] text-gray-800 mb-3 font-black flex gap-5 uppercase tracking-[0.4em] italic px-5">
                <span>[{log.time}]</span>
                <span className={log.type === 'user' ? 'text-white' : log.type === 'gemini' ? 'text-cyan-500 underline underline-offset-4' : 'text-gray-600'}>{log.type}</span>
              </div>
              <div className={`max-w-[95%] md:max-w-[80%] px-10 py-7 rounded-[4rem] text-[18px] leading-loose shadow-2xl transition-all border group hover:border-cyan-500/30 duration-1000 ${
                log.type === 'user' ? 'bg-cyan-900/25 border-cyan-500/50 text-white shadow-cyan-900/20 shadow-inner' : 
                log.type === 'browser' ? 'border-yellow-500/40 bg-yellow-500/5 text-yellow-100 italic font-medium' :
                log.type === 'sec' ? 'bg-red-950/20 border-red-500/40 text-red-100 shadow-red-900/20' :
                'bg-white/5 border-white/10 text-cyan-50 backdrop-blur-md'
              }`}>
                {/* 視覚情報の描画 */}
                {log.imageUrl && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2 }} className="mb-12 overflow-hidden rounded-[4rem] border-2 border-white/20 shadow-2xl group relative cursor-zoom-in">
                    <img src={log.imageUrl} alt="System Observation" className="w-full h-auto transition-transform duration-[3s] group-hover:scale-110" onClick={() => window.open(log.imageUrl)} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 pointer-events-none" />
                    <div className="absolute bottom-10 left-12 flex items-center gap-6">
                       <div className="p-4 bg-yellow-500/20 rounded-3xl backdrop-blur-xl border border-yellow-500/40 shadow-2xl shadow-black"><Camera size={32} className="text-yellow-400"/></div>
                       <div className="flex flex-col">
                          <span className="text-[14px] font-black text-white uppercase tracking-[0.4em] italic drop-shadow-lg">All_Seeing_Eye_Capture</span>
                          <span className="text-[11px] text-yellow-600 font-bold uppercase tracking-widest mt-2 opacity-80">Source: Puppeteer_CNS_Agent_Node</span>
                       </div>
                    </div>
                  </motion.div>
                )}
                
                {log.type === 'gemini' || log.type === 'sys' ? (
                  <MatrixText text={log.msg} speed={8} />
                ) : (
                  log.msg
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isThinking && (
          <div className="flex gap-5 p-10">
            {[0, 0.2, 0.4].map(delay => (
              <motion.div key={delay} animate={{ scale: [1, 2.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4, delay }} className="w-4 h-4 bg-cyan-500 rounded-full shadow-[0_0_30px_#00f2ff]" />
            ))}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 司令入力インターフェース */}
      <div className="p-12 md:p-20 bg-black/90 backdrop-blur-[100px] border-t border-cyan-900/50 z-50 shadow-[0_-50px_80px_rgba(0,0,0,1)] border-double">
        <div className="max-w-7xl mx-auto flex items-center gap-12">
          <motion.button whileTap={{ scale: 0.8 }} onClick={startVoiceCommand} className={`w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all shadow-2xl relative group overflow-hidden ${isLive ? 'bg-red-600 shadow-[0_0_60px_#ff0000] ring-8 ring-red-950' : 'bg-cyan-900/20 border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Mic size={56} className={isLive ? 'animate-pulse scale-125' : 'group-hover:scale-125 transition-transform duration-700'} />
          </motion.button>
          
          <div className="flex-1 relative">
            <input 
              className="w-full h-24 md:h-32 bg-white/5 border-2 border-cyan-900/60 rounded-[4.5rem] px-16 pr-40 text-2xl md:text-3xl outline-none focus:border-cyan-400 focus:bg-white/10 transition-all text-white placeholder-cyan-950 shadow-inner font-mono tracking-tighter italic shadow-2xl" 
              placeholder="要塞アクセスコードまたは司令を入力せよ..." 
              value={inputMessage} 
              onChange={(e) => setInputMessage(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleCommand()} 
            />
            <button onClick={() => handleCommand()} className="absolute right-12 top-6 md:top-8 flex items-center justify-center text-cyan-700 hover:text-cyan-400 transition-all hover:scale-150 active:scale-90 transform group"><ChevronRight size={72} className="group-hover:translate-x-4 transition-transform duration-700" /></button>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * 分析パネル (KpiView)
   */
  const KpiView = () => (
    <div className="flex-1 p-10 md:p-20 overflow-y-auto pb-40 md:pb-24 space-y-24 scrollbar-hide bg-gradient-to-b from-black via-[#010101] to-black">
      <div className="flex items-center justify-between px-8 border-b-2 border-cyan-900/20 pb-12 shadow-2xl">
        <div>
          <h2 className="text-2xl font-black text-white tracking-[0.8em] uppercase border-l-8 border-cyan-500 pl-8 mb-6 italic shadow-[0_0_50px_rgba(0,242,255,0.3)]">Quantum Analytics Cluster</h2>
          <p className="text-[14px] text-gray-700 uppercase font-black tracking-[0.5em] italic opacity-60">Enterprise Integrity & Scalability Data Matrix V8.5</p>
        </div>
        <div className="hidden md:block text-[14px] text-cyan-900 font-mono tracking-tighter uppercase italic bg-cyan-900/15 px-12 py-4 rounded-full border-2 border-cyan-900/40 shadow-inner italic">ENGINE_OMEGA_STRICT_ACTIVE</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-16">
        <div className="xl:col-span-2 border-2 border-cyan-900/40 bg-cyan-950/10 rounded-[6rem] p-16 md:p-24 shadow-[0_0_150px_rgba(0,0,0,1)] relative overflow-hidden group border-double">
          <div className="absolute -top-60 -right-60 w-[40rem] h-[40rem] bg-cyan-500/5 rounded-full blur-[180px] pointer-events-none group-hover:scale-150 transition-transform duration-[4s]" />
          <div className="flex justify-between items-center mb-24 relative z-10">
            <div>
              <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-[0.5em] italic underline underline-offset-[20px] decoration-cyan-900/80 decoration-4">CNS_Global_Traffic_Flux</h3>
              <p className="text-[14px] text-gray-600 uppercase tracking-[0.4em] font-black italic mt-12 decoration-double underline decoration-cyan-950 underline-offset-4">全分散ノード・リクエスト・時系列・フラックス</p>
            </div>
            <div className="flex items-center gap-8 bg-black/60 px-12 py-5 rounded-[2.5rem] border-2 border-white/10 backdrop-blur-2xl shadow-2xl active:scale-95 transition-transform">
              <span className="w-5 h-5 rounded-full bg-cyan-500 shadow-[0_0_40px_#00f2ff] animate-pulse" />
              <span className="text-[14px] font-black text-cyan-400 uppercase tracking-[0.5em] italic">LIVE_QUANTUM_SYNCING</span>
            </div>
          </div>
          <div className="h-[35rem] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpiData}>
                <defs>
                  <linearGradient id="colorTrafficInfinity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.7}/>
                    <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="15 15" stroke="#111" vertical={false} />
                <XAxis dataKey="name" stroke="#444" fontSize={14} tickLine={false} axisLine={false} fontStyle="italic" fontWeight={900} dy={25} />
                <YAxis stroke="#444" fontSize={14} tickLine={false} axisLine={false} fontStyle="italic" fontWeight={900} dx={-25} />
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '3px solid #222', borderRadius: '40px', fontSize: '20px', fontStyle: 'italic', fontWeight: '900', color: '#fff', boxShadow: '0 40px 100px rgba(0,0,0,1)', padding: '20px' }} />
                <Area type="monotone" dataKey="requests" stroke={COLORS.cyan} strokeWidth={12} fill="url(#colorTrafficInfinity)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border-2 border-cyan-900/40 bg-cyan-950/10 rounded-[6rem] p-20 flex flex-col items-center shadow-[0_0_150px_rgba(0,0,0,1)] relative overflow-hidden border-double backdrop-blur-2xl">
          <div className="absolute -bottom-60 -left-60 w-[35rem] h-[35rem] bg-magenta-500/5 rounded-full blur-[150px] pointer-events-none" />
          <h3 className="text-[20px] font-black text-white mb-20 uppercase tracking-[0.6em] text-center italic border-b-4 border-cyan-900/70 pb-8 w-full shadow-2xl shadow-cyan-900/10 decoration-double underline decoration-cyan-950 underline-offset-8">Resource Balance</h3>
          <div className="h-96 w-full relative z-10">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={projects} dataKey="load" nameKey="name" cx="50%" cy="50%" innerRadius={110} outerRadius={150} paddingAngle={15} stroke="none">
                    {projects.map((entry: ProjectData, index: number) => (
                      <Cell key={`cell-inf-${index}`} fill={index === 1 ? COLORS.red : index === 3 ? COLORS.yellow : COLORS.cyan} opacity={0.4 + (index * 0.2)} className="hover:scale-110 transition-transform duration-1000 origin-center cursor-pointer shadow-2xl" />
                    ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-y-10 mt-20 w-full relative z-10 border-t border-white/5 pt-10">
             {projects.map((p: ProjectData, i: number) => (
               <div key={`legend-inf-${p.id}`} className="flex items-center justify-between group cursor-default transition-all duration-700 hover:translate-x-6">
                 <div className="flex items-center gap-8">
                    <div className="w-4 h-4 rounded-full shadow-[0_0_20px_currentColor] transition-all duration-1000 group-hover:scale-150 group-hover:rotate-[360deg]" style={{ color: i === 1 ? COLORS.red : i === 3 ? COLORS.yellow : COLORS.cyan, backgroundColor: 'currentColor' }} />
                    <span className="text-[15px] text-gray-600 font-black uppercase tracking-[0.4em] group-hover:text-cyan-400 transition-colors italic decoration-cyan-950 underline underline-offset-4">{p.name}</span>
                 </div>
                 <span className="text-3xl font-black text-white italic tracking-tighter group-hover:scale-125 transition-transform duration-1000 group-hover:text-cyan-400 drop-shadow-2xl">{p.load}%</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="border-t-4 border-cyan-900/60 pt-32 relative overflow-hidden border-double pb-20">
         <div className="absolute bottom-0 right-0 w-[50rem] h-[50rem] bg-yellow-500/5 rounded-full blur-[250px] pointer-events-none" />
         <div className="flex items-center gap-12 mb-24 px-14 relative z-10">
            <div className="p-12 bg-yellow-500/10 rounded-[3rem] border-2 border-yellow-500/50 shadow-[0_0_100px_rgba(234,255,0,0.2)] scale-125 transform -rotate-12 group hover:rotate-0 transition-transform duration-[1s]">
               <Briefcase size={64} className="text-yellow-500 animate-pulse" />
            </div>
            <div className="space-y-6">
               <h3 className="text-6xl font-black text-yellow-500 tracking-[0.5em] uppercase italic italic drop-shadow-[0_0_40px_rgba(234,255,0,0.4)]">Profit_Matrix_V8.5</h3>
               <p className="text-[16px] text-yellow-900 uppercase font-black tracking-[0.8em] italic opacity-80 border-l-4 border-yellow-800/60 pl-10 leading-none">External_Project_Monitoring & SLA_Compliance_Matrix</p>
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24 relative z-10 px-10">
            <StatBox label="総受託収益予測 (Q1)" value="¥6,420,000" sub="Q1 伸長率: +145% (指数関数的成長)" color="text-yellow-400" />
            <StatBox label="平均SLA応答速度" value="122.4 ms" sub="品質基準: SUPREME_OPTIMAL" color="text-green-500" />
            <StatBox label="未処理クリティカル数" value="0" sub="異常なし: インフラ健全性 100%" color="text-cyan-500" />
         </div>
      </div>
    </div>
  );

  /**
   * 履歴 & ロードマップ (HistoryView)
   */
  const HistoryView = () => (
    <div className="flex-1 p-10 md:p-24 overflow-y-auto pb-40 md:pb-24 scrollbar-hide relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #00f2ff, transparent)' }} />
      <div className="max-w-7xl mx-auto space-y-32 relative z-10">
        <header className="text-center space-y-12">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-block px-14 py-5 border border-cyan-500/60 rounded-full bg-cyan-500/15 text-[15px] text-cyan-400 font-black uppercase tracking-[1.2em] italic shadow-[0_0_60px_rgba(0,242,255,0.3)] backdrop-blur-3xl">Strategic Archives</motion.div>
          <h1 className="text-7xl md:text-[12rem] font-black text-white tracking-tighter uppercase italic italic drop-shadow-[0_0_80px_rgba(0,242,255,0.4)] leading-none">要塞ロードマップ 2026</h1>
          <div className="w-96 h-3 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto rounded-full shadow-[0_0_40px_#00f2ff]" />
          <p className="text-lg md:text-2xl text-cyan-950 max-w-5xl mx-auto leading-loose font-black uppercase tracking-widest italic opacity-80 border-x-4 border-cyan-900/40 px-20">
            齋藤ホールディングスの未来を決定づける20のイニシアチブ。<br/>これらは社長、齋藤拓実の意志を反映し、自律的に無限進化を続けます。
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
          {strategicRoadmap.map((item: RoadmapItem, index: number) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }} whileInView={{ opacity: 1, x: 0 }} whileHover={{ y: -30, scale: 1.05 }} transition={{ duration: 1, type: "spring", bounce: 0.3 }} className="p-16 border border-cyan-900/40 bg-cyan-950/5 rounded-[6rem] relative overflow-hidden group shadow-[0_0_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl border-double active:scale-95">
              <div className="absolute top-0 right-0 p-16 opacity-[0.06] group-hover:opacity-30 transition-all duration-[2s] text-cyan-500 rotate-12 group-hover:rotate-0">{item.category === 'AI' ? <Cpu size={240}/> : <Shield size={240}/>}</div>
              <div className="flex justify-between items-start mb-16 relative z-10">
                <span className="text-[14px] font-black text-cyan-500 bg-cyan-900/50 border-2 border-cyan-900/80 px-10 py-4 rounded-[2rem] tracking-[0.4em] uppercase italic shadow-2xl backdrop-blur-xl">{item.category}</span>
                <div className="flex items-center gap-6 bg-black/80 px-8 py-3 rounded-full border border-white/10 shadow-2xl">
                   <div className={`w-4 h-4 rounded-full ${item.status === 'ACTIVE' ? 'bg-green-500 animate-pulse shadow-[0_0_25px_#22c55e]' : 'bg-gray-800'}`} />
                   <span className={`text-[14px] font-black tracking-[0.3em] uppercase ${item.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-700'}`}>{item.status}</span>
                </div>
              </div>
              <h3 className="text-5xl font-black text-white mb-10 tracking-tighter italic uppercase group-hover:text-cyan-400 transition-all duration-700 underline underline-offset-[20px] decoration-cyan-900/40">{item.name}</h3>
              <p className="text-[18px] text-gray-500 mb-16 leading-relaxed font-bold uppercase tracking-tight opacity-80 group-hover:opacity-100 transition-opacity border-l-4 border-cyan-900/20 pl-10">{item.desc}</p>
              
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between text-[14px] font-black text-cyan-800 uppercase tracking-widest italic font-mono mb-2"><span>Deployment_Phase_Integrity</span><span>{item.progress}%</span></div>
                <div className="w-full h-4 bg-gray-950 rounded-full overflow-hidden shadow-inner border border-white/5 relative">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${item.progress}%` }} transition={{ duration: 3, ease: "circOut" }} className="h-full bg-cyan-500 shadow-[0_0_40px_#00f2ff] relative">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </motion.div>
                </div>
              </div>

              <div className="mt-20 pt-14 border-t border-white/10 flex flex-col gap-10 relative z-10">
                <div className="text-[15px] text-gray-600 leading-loose italic border-l-8 border-cyan-950 pl-12 bg-white/5 p-10 rounded-[3rem] shadow-inner">
                  <span className="text-cyan-950 font-black uppercase tracking-[0.4em] mb-6 block underline underline-offset-[16px] decoration-cyan-900/50 italic">Strategic_Group_Value:</span>
                  {item.benefits}
                </div>
                <button onClick={() => { sfx.play('click'); handleCommand(`${item.name}の現在の実装フェーズを深層解析し、齋藤社長へ収益化に向けた具体的プロセスを報告せよ。`); }} className="w-full py-10 bg-white/5 border-4 border-cyan-500/20 rounded-[3.5rem] text-[16px] font-black text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all duration-1000 uppercase tracking-[0.8em] shadow-[0_0_80px_rgba(0,242,255,0.2)] active:scale-95 italic border-dashed group/btn overflow-hidden">
                  <span className="relative z-10 group-hover/btn:scale-110 transition-transform block">討論シーケンス緊急起動</span>
                  <div className="absolute inset-0 bg-cyan-500 opacity-0 group-hover/btn:opacity-10 transition-opacity" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center py-40 opacity-10 group hover:opacity-50 transition-opacity duration-[4s]">
           <Lock size={160} className="mx-auto text-cyan-900 mb-16 group-hover:rotate-[-10deg] group-hover:scale-125 transition-all duration-[3s] ease-in-out shadow-2xl" />
           <p className="text-[20px] text-cyan-950 font-black tracking-[1.5em] uppercase italic">Deep_Cryptographic_Layer: Only_President_Saito_Authorized</p>
        </div>
      </div>
    </div>
  );

  /**
   * 設定パネル (SettingsView)
   */
  const SettingsView = () => (
    <div className="flex-1 p-12 md:p-24 overflow-y-auto flex flex-col items-center pb-40 md:pb-24 scrollbar-hide bg-[#010101]">
       <div className="w-full max-w-5xl space-y-24">
          <div className="border-b border-cyan-900/60 pb-16 flex justify-between items-end relative overflow-hidden border-double">
             <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full" />
             <div className="relative z-10">
               <h2 className="text-5xl font-black text-white tracking-[0.5em] uppercase italic italic drop-shadow-[0_0_30px_rgba(0,242,255,0.4)]">Fortress_Core_Registry</h2>
               <p className="text-[13px] text-cyan-900 font-black uppercase tracking-[0.8em] mt-6 italic opacity-80 border-l-4 border-cyan-800 pl-6">要塞OS v8.2 シンギュラリティ・パラメータ・キャリブレーション</p>
             </div>
             <div className="text-[15px] text-gray-800 font-mono font-black italic tracking-[0.4em] uppercase opacity-40 italic bg-white/5 px-6 py-2 rounded-xl">Build_QUANTUM_STRICT</div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
            {/* AI 設定セクション */}
            <section className="space-y-12">
              <h3 className="text-xs font-black text-cyan-500 uppercase tracking-[1em] flex items-center gap-8 italic underline underline-offset-[12px] decoration-cyan-900">
                <CpuIcon size={32} className="animate-pulse"/> AI_Neural_Prompting
              </h3>
              <div className="bg-black/60 border border-cyan-900/50 rounded-[5rem] p-14 space-y-16 shadow-[0_0_120px_rgba(0,0,0,1)] relative overflow-hidden group border-double">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                <div className="space-y-8">
                  <label className="text-[13px] text-gray-700 uppercase tracking-[0.6em] font-black flex items-center gap-5 italic mb-4">
                    <Key size={20} className="text-cyan-900"/> 司令官人格命令 (Kernel_Input)
                  </label>
                  <textarea 
                    className="w-full h-72 bg-black border border-cyan-900/60 rounded-[2.5rem] p-10 text-base md:text-lg text-cyan-100 outline-none focus:border-cyan-400 transition-all font-mono leading-relaxed shadow-inner italic border-double group-hover:bg-cyan-950/10 duration-1000"
                    value={aiPersona}
                    onChange={(e) => setAiPersona(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-800 font-black uppercase tracking-[0.3em] italic mt-4 text-right opacity-60">※ 暗号化され中枢神経(CNS)へ即時注入されます</p>
                </div>

                <div className="flex items-center justify-between p-10 bg-cyan-950/10 rounded-[3rem] border border-white/5 shadow-inner group-hover:border-cyan-500/40 transition-all duration-1000">
                  <div className="flex items-center gap-8">
                    <div className="p-5 bg-cyan-900/20 rounded-[1.5rem] shadow-2xl border border-cyan-500/20"><Bell size={32} className="text-cyan-500 animate-bounce"/></div>
                    <div>
                      <h4 className="text-[14px] font-black text-white uppercase italic tracking-[0.3em]">音声合成プロトコル</h4>
                      <p className="text-[10px] text-gray-700 uppercase font-black tracking-[0.4em] mt-2 italic opacity-60">Neuro-Voice Synthesis Output</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <button 
                      onClick={() => { sfx.play('toggle'); setUseVoice(!useVoice); }}
                      className={`w-20 h-10 rounded-full relative transition-all duration-1000 ${useVoice ? 'bg-cyan-500 shadow-[0_0_30px_rgba(0,242,255,0.6)]' : 'bg-gray-800'} group/btn`}
                    >
                      <motion.div animate={{ x: useVoice ? 44 : 4 }} className="absolute top-1.5 w-7 h-7 bg-white rounded-full shadow-2xl group-hover/btn:scale-125 transition-transform" />
                    </button>
                    <span className="text-[10px] font-black text-cyan-900 uppercase tracking-widest animate-pulse">{useVoice ? 'ACTIVE' : 'MUTED'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 防衛設定セクション */}
            <section className="space-y-12">
              <h3 className="text-xs font-black text-red-600 uppercase tracking-[1em] flex items-center gap-8 italic underline underline-offset-[12px] decoration-red-900">
                <Shield size={32} className="animate-pulse"/> Fortress_Planetary_Defense
              </h3>
              <div className="bg-red-950/5 border border-red-900/50 rounded-[5rem] p-14 space-y-16 shadow-[0_0_120px_rgba(255,0,0,0.15)] relative overflow-hidden border-double">
                 <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-transparent via-red-600/50 to-transparent animate-pulse" />
                 <div className="space-y-8">
                    <label className="text-[13px] text-red-950 uppercase tracking-[0.7em] font-black italic mb-6 block underline decoration-red-900/60 underline-offset-[12px]">Fortress_Integrity_Level</label>
                    <div className="flex justify-between gap-5">
                       {[1,2,3,4,5].map(lv => (
                         <button 
                           key={`security-lv-${lv}`} 
                           onClick={() => { sfx.play('click'); setSecurityLevel(lv); }} 
                           className={`flex-1 py-6 rounded-[1.5rem] border-2 text-[18px] font-black transition-all duration-700 italic shadow-2xl ${securityLevel === lv ? 'bg-red-600 border-red-500 text-white shadow-red-900/60 scale-110 rotate-2' : 'border-red-950/30 text-red-950 hover:bg-red-900/10 hover:border-red-700'}`}
                         >
                           LV{lv}
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className="p-10 bg-black/80 border border-red-900/50 rounded-[3.5rem] shadow-inner relative group">
                    <div className="absolute inset-0 bg-red-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <p className="text-[15px] leading-loose italic text-gray-400 border-l-4 border-red-700/60 pl-6 uppercase font-black tracking-tight relative z-10">
                      「警告：現在の要塞防御グレードは <span className="text-red-600 font-black underline shadow-red-600">{securityLevel}</span> です。全パケット、全入出力は齋藤社長の生体量子鍵とのみ同期・照合されます。認可なきアクセスは即座にニューロ・ハニーポットへ強制隔離後、全自動で逆探知・無効化されます。」
                    </p>
                 </div>
                 <button 
                   onClick={() => { sfx.play('alert'); addLog('致命的警告: 自己消滅シーケンス武装化。物理パージ準備完了。 (模擬プロトコル)', 'alert'); }}
                   className="w-full py-8 border-2 border-red-800/70 text-red-600 text-[14px] font-black uppercase tracking-[0.8em] rounded-[3rem] hover:bg-red-600 hover:text-white transition-all duration-1000 shadow-2xl active:scale-95 italic bg-red-950/10 border-double group"
                 >
                   <span className="group-hover:scale-110 transition-transform block">自己消滅シーケンス武装化 (PURGE)</span>
                 </button>
              </div>
            </section>
          </div>
       </div>
    </div>
  );

  // --- F. 統合レンダリング・フレームワーク ---

  return (
    <div className="fixed inset-0 bg-[#000000] text-cyan-400 font-mono flex flex-col overflow-hidden selection:bg-cyan-900 selection:text-white">
      {/* 視覚エフェクトレイヤー */}
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(#00f2ff 1px, transparent 1px), linear-gradient(90deg, #00f2ff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none z-10" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.06] pointer-events-none z-10 mix-blend-overlay" />
      
      {/* ヘッダー */}
      <header className="h-20 border-b border-cyan-900/60 bg-black/70 backdrop-blur-[50px] flex items-center justify-between px-10 z-50 relative shrink-0 border-double shadow-[0_20px_60px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-8 group cursor-pointer" onClick={() => { setActiveTab('DASHBOARD'); sfx.play('click'); }}>
          <motion.div animate={{ rotate: isConnected ? 360 : 0 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}>
            <Zap className={isConnected ? 'text-cyan-400 drop-shadow-[0_0_25px_#00f2ff] scale-125' : 'text-gray-900'} size={32} />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-black tracking-[0.6em] text-2xl text-white uppercase italic group-hover:text-cyan-400 transition-all duration-1000 group-hover:tracking-[0.8em]">LARU NEXUS</span>
            <span className="text-[12px] text-cyan-950 font-black uppercase tracking-[0.5em] leading-none mt-3 italic shadow-2xl opacity-80">Infinity_Core v8.5 [Strict]</span>
          </div>
        </div>
        
        <div className="flex items-center gap-10">
          <div className="hidden lg:flex items-center gap-8 border-r border-cyan-900/40 pr-12 mr-4">
             <HeaderBtn icon={<RefreshCw size={28}/>} onClick={handleRefresh} label="EMERGENCY_REBOOT" />
             <HeaderBtn icon={<Trash2 size={28}/>} onClick={handleClearLogs} label="PURGE_HISTORY" color="hover:text-red-600" />
             <HeaderBtn icon={<Bell size={28}/>} onClick={requestNotification} label="FORTRESS_SYNC" />
          </div>
          <div className="flex items-center gap-8 font-mono">
             <div className="flex flex-col items-end">
                <div className={`text-[13px] font-black tracking-tighter flex items-center gap-4 ${isConnected ? 'text-green-500' : 'text-red-700 animate-pulse'}`}>
                  {isConnected ? <><div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_15px_#22c55e]"/> CNS_CONNECTED</> : 'LINK_BROKEN'}
                </div>
                <div className="text-[10px] text-cyan-950 font-black uppercase tracking-widest mt-2 border-t border-cyan-900/20 pt-1">MacBook_Air_Saito_01</div>
             </div>
             <button onClick={startVoiceCommand} className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all md:hidden shadow-2xl"><Mic size={28} /></button>
          </div>
        </div>
      </header>

      {/* リアルタイム・グローバル・パケット・フィード (マーキー) */}
      <div className="h-16 bg-cyan-950/10 border-b border-cyan-900/20 flex items-center overflow-hidden whitespace-nowrap px-10 z-40 relative shrink-0 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <div className="flex items-center gap-5 text-[14px] font-black text-cyan-600 mr-20 shrink-0 uppercase italic tracking-[0.5em] bg-black/60 border border-cyan-900/30 px-8 py-2.5 rounded-[2rem] shadow-inner relative overflow-hidden group">
          <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
          <Radio size={20} className="animate-pulse text-cyan-500 relative z-10" /> Global_Feed_CNS:
        </div>
        <div className="flex gap-32 animate-marquee-extended font-black">
           {projects.map((p: ProjectData) => (
             <div key={`feed-${p.id}`} className="text-[15px] text-gray-500 flex items-center gap-10 italic tracking-tighter group cursor-default active:text-cyan-400 transition-colors">
               <span className={`px-4 py-1.5 rounded-xl border font-black transition-all duration-700 group-hover:scale-110 ${p.category === 'CLIENT' ? 'text-yellow-700 border-yellow-950/40 bg-yellow-900/5' : 'text-cyan-900 border-cyan-950/40 bg-cyan-900/5'}`}>[{p.name.toUpperCase()}]</span>
               <span className="flex items-center gap-3 group-hover:text-cyan-600 transition-all duration-500"><CpuIcon size={18}/> {p.stats.cpu}%</span>
               <span className="flex items-center gap-3 group-hover:text-magenta-600 transition-all duration-500"><HardDrive size={18}/> {p.stats.memory}%</span>
               <span className={p.status === 'ONLINE' ? 'text-green-950/70 group-hover:text-green-400' : 'text-red-950/70'}>{p.status}</span>
               <span className="text-gray-900 opacity-30 group-hover:opacity-100 transition-opacity uppercase font-mono tracking-widest shadow-2xl">LAT: {p.latency}ms</span>
             </div>
           ))}
        </div>
      </div>

      {/* メイン・ビューポート・アーキテクチャ */}
      <div className="flex-1 flex overflow-hidden relative z-20">
        <SideNav activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 flex flex-col relative overflow-hidden bg-black/60 backdrop-blur-[100px] border-l border-white/5 shadow-inner">
          <AnimatePresence mode='wait'>
            {activeTab === 'DASHBOARD' && <DashboardPanel key="dash_view" />}
            {activeTab === 'COMMAND' && <CommandPanel key="cmd_view" />}
            {activeTab === 'KPI' && <KpiView key="kpi_view" />}
            {activeTab === 'HISTORY' && <HistoryView key="hist_view" />}
            {activeTab === 'SETTINGS' && <SettingsView key="sett_view" />}
          </AnimatePresence>
        </main>
      </div>

      <MobileDock setActiveTab={setActiveTab} activeTab={activeTab} setIsCommandOpen={setIsCommandOpen} requestNotification={requestNotification} />

      {/* モーダル & オーバーレイ */}
      <CommandPalette isCommandOpen={isCommandOpen} setIsCommandOpen={setIsCommandOpen} handleCommand={handleCommand} handleRefresh={handleRefresh} />
      <ProjectOverlay selectedProject={selectedProject} setSelectedProject={setSelectedProject} handleCommand={handleCommand} />

      <footer className="hidden md:flex h-14 border-t border-cyan-900/30 bg-black px-12 items-center justify-between text-[12px] text-gray-800 uppercase tracking-[0.6em] shrink-0 z-50 font-black italic shadow-[0_-10px_50px_rgba(0,0,0,1)]">
        <div className="flex gap-16 items-center">
          <div className="hover:text-cyan-400 transition-all cursor-default shadow-2xl">© 2026 LARUbot Holdings Inc. Global Fortress OS</div>
          <div className="w-px h-6 bg-gray-950" />
          <div className="flex items-center gap-4"><Globe size={20} className="text-cyan-950 animate-spin-slow"/> DIST_CDN_NETWORK: 48 NODES ACTIVE</div>
        </div>
        <div className="flex gap-16 items-center">
          <div className="flex items-center gap-4 text-cyan-950"><Database size={20}/> CLUSTER_INTEGRITY: 100%</div>
          <div className="text-cyan-950 border-l border-cyan-900/30 pl-16 font-black bg-cyan-900/5 px-6 py-2 rounded-full border border-cyan-900/10">Security_Encryption: Quantum_Tier_5</div>
        </div>
      </footer>

      { head_infinity_css() }
    </div>
  );
}

// --- 7. 下位コンポーネント定義 (厳格型定義・詳細実装) ---

// ヘッダー用ボタン
function HeaderBtn({ icon, onClick, label, color = "hover:text-cyan-400" }: { icon: React.ReactNode, onClick: () => void, label: string, color?: string }) {
  return (
    <button onClick={() => { sfx.play('click'); onClick(); }} className={`p-3 transition-all ${color} group relative bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/40 active:scale-90 shadow-xl`}>
      {icon}
      <span className="absolute top-full mt-5 left-1/2 -translate-x-1/2 bg-black border border-cyan-900/50 text-[10px] font-black px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[1000] shadow-[0_20px_50px_rgba(0,0,0,1)] tracking-[0.3em] italic uppercase transition-all duration-500">{label}</span>
    </button>
  );
}

// サイドナビゲーション
function SideNav({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: any) => void }) {
  return (
    <nav className="hidden md:flex w-28 border-r border-cyan-900/40 flex-col items-center py-16 gap-16 bg-black/80 backdrop-blur-[60px] z-40 shrink-0 shadow-[30px_0_60px_rgba(0,0,0,0.9)] border-white/5 border-double">
      <SideBtn icon={<Terminal size={36}/>} active={activeTab === 'COMMAND'} onClick={() => setActiveTab('COMMAND')} label="指令" />
      <SideBtn icon={<Activity size={36}/>} active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} label="監視" />
      <SideBtn icon={<Layers size={36}/>} active={activeTab === 'KPI'} onClick={() => setActiveTab('KPI')} label="分析" />
      <SideBtn icon={<History size={36}/>} active={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')} label="履歴" />
      <div className="flex-1" />
      <SideBtn icon={<Settings size={36}/>} active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} label="設定" />
    </nav>
  );
}

function SideBtn({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) {
  return (
    <button onClick={() => { sfx.play('click'); onClick(); }} className={`relative p-6 rounded-[2.5rem] transition-all duration-700 group shadow-2xl active:scale-90 ${active ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50 shadow-cyan-500/30 scale-110 rotate-1' : 'text-cyan-950 border border-transparent hover:border-white/10 hover:bg-white/5 hover:text-cyan-600'}`}>
      {icon}
      <span className="absolute left-full ml-12 px-8 py-4 bg-[#050505] border-2 border-cyan-900/60 text-cyan-200 text-[14px] font-black italic uppercase tracking-[0.5em] rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none whitespace-nowrap z-[100] shadow-[0_30px_60px_rgba(0,0,0,1)] border-double">{label}</span>
      {active && <motion.div layoutId="side-indicator-infinity" className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-16 bg-cyan-400 rounded-r-full shadow-[0_0_30px_#00f2ff]" />}
    </button>
  );
}

// モバイルボトムドック
function MobileDock({ setActiveTab, activeTab, setIsCommandOpen, requestNotification }: any) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-28 bg-black/95 backdrop-blur-[100px] border-t border-cyan-900/60 flex items-center justify-around z-50 md:hidden px-8 shadow-[0_-30px_70px_rgba(0,0,0,1)] pb-safe">
      <MobBtn icon={<Terminal size={32}/>} label="指令" active={activeTab === 'COMMAND'} onClick={() => setActiveTab('COMMAND')} />
      <MobBtn icon={<Activity size={32}/>} label="監視" active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} />
      <div className="w-24 h-24 -mt-20 flex items-center justify-center bg-cyan-500 rounded-full border-[10px] border-[#010101] shadow-[0_0_50px_rgba(0,242,255,0.7)] active:scale-90 transition-all duration-500 transform group" onClick={() => { setIsCommandOpen(true); sfx.play('notify'); }}><Command size={44} className="text-black group-hover:rotate-180 transition-transform duration-[1.5s]" /></div>
      <MobBtn icon={<History size={32}/>} label="履歴" active={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')} />
      <MobBtn icon={<Shield size={32}/>} label="要塞" active={false} onClick={requestNotification} />
    </nav>
  );
}

function MobBtn({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={() => { sfx.play('click'); onClick(); }} className={`flex flex-col items-center gap-3 flex-1 py-4 transition-all duration-700 ${active ? 'text-cyan-400 drop-shadow-[0_0_20px_#00f2ff] scale-125' : 'text-cyan-950 opacity-30'}`}>
      {icon}<span className="text-[11px] font-black tracking-widest uppercase italic opacity-80">{label}</span>
    </button>
  );
}

// クイックアクション
function QuickActionBtn({ icon, cmd, desc, onClick }: { icon: React.ReactNode, cmd: string, desc: string, onClick: () => void }) {
  return (
    <button onClick={() => { sfx.play('click'); onClick(); }} className="w-full p-12 hover:bg-cyan-500/15 rounded-[4rem] flex items-center justify-between group transition-all duration-1000 active:scale-95 border-2 border-transparent hover:border-cyan-500/40 shadow-2xl bg-black/40 border-double">
      <div className="flex items-center gap-14">
        <div className="p-6 bg-cyan-900/20 rounded-[2rem] text-cyan-500 group-hover:scale-110 group-hover:rotate-[15deg] transition-all duration-1000 shadow-2xl border border-cyan-500/20">{icon}</div>
        <div className="flex flex-col items-start gap-4">
          <span className="text-cyan-200 font-black font-mono text-2xl group-hover:text-white transition-all tracking-[0.3em] italic uppercase shadow-cyan-900 drop-shadow-2xl">{cmd}</span>
          <span className="text-[15px] text-gray-700 group-hover:text-cyan-800 transition-all uppercase font-black tracking-[0.2em] italic opacity-60">// {desc}</span>
        </div>
      </div>
      <ChevronRight size={44} className="text-cyan-950 group-hover:text-cyan-400 group-hover:translate-x-10 transition-all duration-1000 opacity-0 group-hover:opacity-100" />
    </button>
  );
}

// ゲージ・スタッツ
function QuantumGauge({ label, value, unit, color = COLORS.cyan }: { label: string, value: number, unit: string, color?: string }) {
  return (
    <div className="flex flex-col items-center gap-10 p-14 border-2 border-white/5 rounded-[4.5rem] bg-black/70 group hover:border-cyan-500/60 transition-all duration-[1s] shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group border-double active:scale-95">
       <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-[1.5s] pointer-events-none" />
       <div className="relative w-40 h-40 group-hover:scale-110 transition-transform duration-[1s]">
          <svg className="w-full h-full transform -rotate-90 scale-125 transition-transform duration-1000 group-hover:rotate-0">
             <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-gray-950 shadow-inner" />
             <motion.circle 
               cx="80" cy="80" r="74" stroke={color} strokeWidth="6" fill="transparent" 
               strokeDasharray={465} strokeDashoffset={465 - (465 * value / 100)}
               className="shadow-[0_0_40px_currentColor]"
               transition={{ duration: 4, ease: "circOut" }}
             />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className="text-4xl font-black text-white italic tracking-tighter group-hover:scale-125 transition-transform duration-1000 drop-shadow-2xl">{value}</span>
             <span className="text-[12px] text-cyan-900 font-black uppercase tracking-[0.5em] mt-3 italic opacity-60 underline decoration-cyan-950 underline-offset-4">{unit}</span>
          </div>
       </div>
       <span className="text-[13px] font-black text-gray-700 tracking-[0.6em] uppercase group-hover:text-cyan-400 transition-all italic duration-[1s] border-t-2 border-white/5 pt-6 w-full text-center group-hover:border-cyan-900/40 tracking-widest">{label}</span>
    </div>
  );
}

// 統計ボックス
function StatBox({ label, value, sub, color = "text-white" }: { label: string, value: string, sub: string, color?: string }) {
  return (
    <div className="bg-white/5 border-2 border-white/5 p-14 rounded-[5rem] hover:bg-cyan-500/5 transition-all duration-1000 group shadow-[0_0_100px_rgba(0,0,0,0.9)] relative overflow-hidden active:scale-98">
       <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
       <div className="text-[14px] text-gray-700 font-black uppercase tracking-[0.6em] mb-10 group-hover:text-cyan-800 italic transition-all border-b border-white/5 pb-4 w-fit">// {label}</div>
       <div className={`text-6xl font-black italic tracking-tighter mb-5 ${color} drop-shadow-[0_0_40px_rgba(255,255,255,0.3)] group-hover:scale-105 transition-transform duration-700`}>{value}</div>
       <div className="text-[14px] text-cyan-950 font-black tracking-[0.4em] uppercase italic opacity-40 group-hover:opacity-100 transition-all">{sub}</div>
    </div>
  );
}

// コマンドパレット (モーダル)
function CommandPalette({ isCommandOpen, setIsCommandOpen, handleCommand, handleRefresh }: { isCommandOpen: boolean, setIsCommandOpen: (v: boolean) => void, handleCommand: (c: string) => void, handleRefresh: () => void }) {
  return (
    <AnimatePresence>
      {isCommandOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/98 backdrop-blur-[150px] z-[100000] p-12 flex flex-col pt-48 items-center overflow-y-auto" onClick={() => setIsCommandOpen(false)}>
           <motion.div initial={{ scale: 0.8, y: 150 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 150 }} transition={{ type: "spring", damping: 30 }} className="w-full max-w-7xl bg-[#080808] border-2 border-cyan-500/60 rounded-[7rem] overflow-hidden shadow-[0_0_300px_rgba(0,242,255,0.3)] flex flex-col backdrop-blur-[200px] border-double relative shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent animate-pulse" />
              <div className="p-20 md:p-32 border-b-2 border-cyan-900/80 flex items-center gap-16 bg-white/5 shadow-inner relative overflow-hidden">
                 <Search className="text-cyan-500 animate-pulse scale-[2.5]" size={72} />
                 <input className="bg-transparent border-none outline-none text-white flex-1 text-5xl md:text-8xl font-black italic tracking-tighter placeholder-cyan-950 uppercase italic font-mono transition-all focus:placeholder-transparent drop-shadow-2xl" placeholder="SYSTEM_COMMAND_INPUT" autoFocus onKeyDown={e => { if(e.key === 'Enter') { handleCommand((e.target as any).value); setIsCommandOpen(false); } }} />
              </div>
              <div className="p-20 md:p-32 grid grid-cols-1 md:grid-cols-2 gap-16 bg-gradient-to-b from-transparent to-black/60">
                 <QuickActionBtn icon={<Cpu size={40}/>} cmd="/deploy larubot" desc="AI中枢 HP 緊急展開シーケンス" onClick={() => handleCommand('/deploy larubot')} />
                 <QuickActionBtn icon={<Briefcase size={40}/>} cmd="/deploy flastal" desc="外部顧客 Flastal.net 緊急同期" onClick={() => handleCommand('/deploy flastal')} />
                 <QuickActionBtn icon={<Monitor size={40}/>} cmd="/monitor --deep" desc="全ノードの深層パケット監査" onClick={() => handleCommand('/monitor --deep')} />
                 <QuickActionBtn icon={<HardDrive size={40}/>} cmd="/reboot nexus" desc="要塞OSの再構築 (Emergency)" onClick={handleRefresh} />
                 <QuickActionBtn icon={<Shield size={40}/>} cmd="/lockdown --all" desc="全ポートの物理遮断" onClick={() => handleCommand('/lockdown --all')} />
                 <QuickActionBtn icon={<History size={40}/>} cmd="/logs purge" desc="司令履歴の暗号抹消" onClick={() => handleCommand('/logs purge')} />
              </div>
           </motion.div>
           <button className="mt-24 text-cyan-950 text-xl font-black tracking-[2em] border-2 border-cyan-900/30 px-32 py-10 rounded-full hover:bg-cyan-500/10 active:scale-95 transition-all duration-1000 uppercase hover:text-cyan-500 shadow-[0_0_100px_rgba(0,0,0,1)] italic border-dashed backdrop-blur-3xl" onClick={() => setIsCommandOpen(false)}>EXIT_INTERFACE / ESC</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// プロジェクト詳細オーバーレイ
function ProjectOverlay({ selectedProject, setSelectedProject, handleCommand }: { selectedProject: ProjectData | null, setSelectedProject: (p: null) => void, handleCommand: (c: string) => void }) {
  if (!selectedProject) return null;
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-12 md:p-24 overflow-hidden backdrop-blur-[150px] bg-black/95" onClick={() => setSelectedProject(null)}>
       <motion.div initial={{ scale: 0.8, opacity: 0, y: 150 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 150 }} transition={{ duration: 1, type: "spring", bounce: 0.2 }} className="w-full max-w-[100rem] bg-[#020202] border-2 border-cyan-500/60 rounded-[8rem] overflow-hidden shadow-[0_0_300px_rgba(0,242,255,0.2)] flex flex-col md:flex-row h-full max-h-[96vh] border-double" onClick={e => e.stopPropagation()}>
          <div className="w-full md:w-[40%] bg-cyan-950/10 border-r-2 border-cyan-900/40 p-20 flex flex-col relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at top left, #00f2ff, transparent 80%)' }} />
             <div className="mb-24 relative z-10">
                <div className="flex justify-between items-start mb-16">
                   <ProStatus status={selectedProject.status} />
                   <button onClick={() => setSelectedProject(null)} className="p-6 hover:bg-white/10 rounded-full text-gray-800 hover:text-white transition-all duration-1000 border-2 border-transparent hover:border-white/20 active:scale-75"><X size={64}/></button>
                </div>
                <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-[0_0_60px_rgba(255,255,255,0.4)]">{selectedProject.name}</h2>
                <p className="text-xl text-cyan-800 font-mono mt-10 uppercase tracking-[0.8em] italic font-black border-l-8 border-cyan-900/80 pl-10 leading-none shadow-2xl">{selectedProject.repo}</p>
             </div>
             <div className="flex-1 space-y-16 relative z-10">
                <ProjectMetric label="Latency_CNS_Sync" value={`${selectedProject.latency} MS`} progress={Math.min(100, selectedProject.latency / 1.1)} />
                <ProjectMetric label="SLA_Uptime_Integrity" value="99.98%" progress={99.9} color={COLORS.green} />
                <ProjectMetric label="FATAL_KERNEL_ERRORS" value={selectedProject.stats.errors.toString()} progress={selectedProject.stats.errors * 40} color={selectedProject.stats.errors > 0 ? COLORS.red : COLORS.cyan} />
             </div>
             <button onClick={() => { sfx.play('success'); handleCommand(`/deploy ${selectedProject.id}`); setSelectedProject(null); }} className="w-full py-12 mt-20 bg-cyan-500 text-black font-black uppercase text-2xl tracking-[1em] rounded-[4rem] hover:bg-white hover:scale-[1.05] active:scale-95 transition-all duration-1000 shadow-[0_0_100px_#00f2ff] italic border-none relative z-10 overflow-hidden group/deploy">
                <span className="relative z-10 group-hover/deploy:tracking-[1.2em] transition-all">CNS_DEPLOY_EXECUTE</span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover/deploy:opacity-30 transition-opacity" />
             </button>
          </div>
          <div className="flex-1 p-20 md:p-32 overflow-y-auto space-y-24 scrollbar-hide bg-gradient-to-br from-black to-[#050505]">
             <section className="relative z-10">
                <div className="flex items-center justify-between mb-16 border-b-4 border-white/10 pb-10 shadow-2xl">
                   <h3 className="text-3xl font-black text-gray-600 uppercase tracking-[1em] flex items-center gap-10 italic italic group cursor-default"><Terminal size={48} className="group-hover:scale-150 transition-transform duration-[1s]" /> OS_Internal_Live_Logs</h3>
                   <div className="text-xl text-cyan-900 font-mono font-black animate-pulse uppercase tracking-[0.8em] bg-cyan-900/10 px-10 py-3 rounded-full border-2 border-cyan-900/40 shadow-inner italic">CNS_ACTIVE</div>
                </div>
                <div className="bg-black border-2 border-white/10 rounded-[5rem] p-20 font-mono text-[18px] space-y-8 shadow-[0_0_150px_rgba(0,0,0,1)] relative group overflow-hidden border-double backdrop-blur-3xl">
                   <p className="text-green-950 tracking-tighter transition-colors hover:text-green-400 duration-[1s]">[{new Date().toLocaleTimeString()}] INFRA: Socket tunnel established on CNS_Secure_Port_443</p>
                   <p className="text-cyan-950 tracking-tighter transition-colors hover:text-cyan-400 duration-[1s]">[{new Date().toLocaleTimeString()}] CORE: Handshake with Quantum_DB_Cluster [Tokyo_Region] SUCCESS</p>
                   <p className="text-gray-800 tracking-tighter transition-colors hover:text-gray-400 duration-[1s]">[{new Date().toLocaleTimeString()}] SECURE: Traffic re-routing via AES-256-GCM quantum resistance layer.</p>
                   {selectedProject.stats.errors > 0 && <p className="text-red-950 animate-pulse tracking-tighter font-black uppercase text-red-600 bg-red-900/30 px-12 py-6 rounded-[3rem] border-2 border-red-900/60 shadow-[0_0_80px_rgba(255,0,0,0.4)]">[{new Date().toLocaleTimeString()}] CRITICAL_HALT: Unauthorized access attempt blocked by Nexus_Sentinel</p>}
                </div>
             </section>
          </div>
       </motion.div>
    </div>
  );
}

function ProjectMetric({ label, value, progress, color = COLORS.cyan }: { label: string, value: string, progress: number, color?: string }) {
  return (
    <div className="space-y-8 group cursor-default">
       <div className="flex justify-between items-end px-6 group-hover:translate-x-2 transition-transform duration-700">
          <span className="text-[15px] font-black text-gray-700 uppercase tracking-[0.5em] italic group-hover:text-cyan-800 transition-colors">{label}</span>
          <span className="text-2xl font-black text-white italic tracking-tighter drop-shadow-2xl">{value}</span>
       </div>
       <div className="h-5 bg-gray-950 rounded-full overflow-hidden shadow-inner border-2 border-white/5 scale-y-110 relative group-hover:border-cyan-900/30 transition-colors">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 3, type: "spring", bounce: 0.2 }} className="h-full shadow-[0_0_50px_currentColor] relative" style={{ backgroundColor: color, color: color }}>
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </motion.div>
       </div>
    </div>
  );
}

function MiniProgress({ label, value, progress, color = COLORS.cyan }: { label: string, value: string, progress: number, color?: string }) {
  return (
    <div className="space-y-4">
       <div className="flex justify-between items-end px-2">
          <span className="text-[11px] font-black text-gray-700 uppercase tracking-[0.3em] italic">{label}</span>
          <span className="text-base font-black text-white italic tracking-tighter">{value}</span>
       </div>
       <div className="h-2 bg-gray-950 rounded-full overflow-hidden shadow-inner border border-white/5">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 2.5, ease: "circOut" }} className="h-full shadow-[0_0_20px_currentColor]" style={{ backgroundColor: color }} />
       </div>
    </div>
  );
}

function head_infinity_css() {
  return (
    <style jsx global>{`
      @keyframes marquee-extended { 0% { transform: translateX(20%); } 100% { transform: translateX(-200%); } }
      .animate-marquee-extended { display: flex; animation: marquee-extended 80s linear infinite; }
      @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
      .animate-shimmer { position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: shimmer 2.5s infinite; }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      * { -webkit-tap-highlight-color: transparent; outline: none !important; }
      @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .animate-spin-slow { animation: spin-slow 30s linear infinite; }
      .bg-scanlines { background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03)); background-size: 100% 4px, 3px 100%; pointer-events: none; }
      @font-face { font-family: 'JetBrains Mono'; src: url('https://fonts.gstatic.com/s/jetbrainsmono/v18/t6q_o_XN_X_vS_R-M8T3N8vU_K2T.woff2') format('woff2'); }
    `}</style>
  );
}