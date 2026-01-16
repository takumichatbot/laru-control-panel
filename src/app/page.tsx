'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';
import { 
  Terminal, Activity, Shield, Cpu, Mic, Search, AlertCircle, 
  CheckCircle, Command, Wifi, Layers, GitBranch, Lock, ChevronRight, 
  Zap, Bell, History, Briefcase, Building2, RefreshCw, Trash2, 
  Camera, Settings, Sliders, HardDrive, Database, Globe, 
  Eye, Code, Play, Square, FastForward, Power, Radio, Menu, X, 
  Monitor, Smartphone, CpuIcon, Cloud, Box, Server, Key
} from 'lucide-react';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v8.0 [OMEGA_SINGULARITY]
 * ------------------------------------------------------------------------------
 * 開発総責任者: 齋藤 拓実 (Takumi Saito)
 * 最終更新: 2026-01-17 01:00 (JST)
 * * [システム・アーキテクチャ]
 * - コア: React 18.3 + Next.js 14 (App Router)
 * - 音響エンジン: OmegaAudioEngine v4.0 (内製 Web Audio API 合成機)
 * - インテリジェンス: Gemini 2.5 Flash 自律型エージェント
 * - インターフェース: 物理演算モーション UI + Tailwind CSS
 * - 監視ネットワーク: 分散型リアルタイム・グリッド
 * ==============================================================================
 */

// --- 1. 高度音響合成エンジン (ULTIMATE OMEGA SFX) ---
// 物理ファイルを必要とせず、コードのみでネオンサウンドを生成します。
class OmegaAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      }
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createOscillator(freq: number, type: OscillatorType = 'sine', duration: number = 0.1, volume: number = 0.1) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // --- プリセット・サウンド・マトリックス ---
  playBoot() {
    const tones = [110, 220, 440, 880];
    tones.forEach((t, i) => {
      setTimeout(() => this.createOscillator(t, 'sawtooth', 1.0, 0.05), i * 150);
    });
  }
  playClick() { this.createOscillator(800, 'sine', 0.05, 0.1); }
  playSuccess() {
    this.createOscillator(523.25, 'sine', 0.1, 0.1);
    setTimeout(() => this.createOscillator(659.25, 'sine', 0.1, 0.1), 100);
    setTimeout(() => this.createOscillator(783.99, 'sine', 0.3, 0.1), 200);
  }
  playAlert() {
    this.createOscillator(200, 'sawtooth', 0.3, 0.2);
    setTimeout(() => this.createOscillator(150, 'sawtooth', 0.3, 0.2), 200);
  }
  playNotify() { this.createOscillator(1200, 'sine', 0.1, 0.1); setTimeout(() => this.createOscillator(1600, 'sine', 0.1, 0.1), 50); }
  playType() { this.createOscillator(1000 + Math.random() * 500, 'square', 0.02, 0.01); }
  playRefresh() { this.createOscillator(400, 'sine', 0.2, 0.1); setTimeout(() => this.createOscillator(800, 'sine', 0.2, 0.1), 100); }
  playClear() { this.createOscillator(300, 'sawtooth', 0.3, 0.1); }
  playCamera() {
    if (!this.ctx || !this.masterGain) return;
    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    noise.connect(g);
    g.connect(this.masterGain);
    noise.start();
  }
}
const sfx = new OmegaAudioEngine();

// --- 2. 型定義 (Extended) ---
interface ProjectIssue { id: string; level: 'CRITICAL' | 'WARN' | 'INFO'; title: string; description: string; }
interface ProjectProposal { id: string; type: 'OPTIMIZATION' | 'SECURITY' | 'FEATURE'; title: string; impact: string; cost: string; }
interface Project { 
  id: string; name: string; category: 'COMPANY' | 'CLIENT'; 
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE' | 'WAITING' | 'BUILDING'; 
  load: number; latency: number; repo: string; url: string; 
  stats: { cpu: number; memory: number; requests: number; errors: number; }; 
  issues: ProjectIssue[]; proposals: ProjectProposal[];
  logs: { time: string; msg: string; type: 'sys' | 'err' | 'out' }[];
}
interface LogEntry { 
  id: string; msg: string; 
  type: 'user' | 'gemini' | 'sys' | 'sec' | 'alert' | 'github' | 'browser' | 'thinking' | 'success'; 
  imageUrl?: string; time: string; 
}
interface RoadmapItem { 
  id: string; category: 'AI' | 'INFRA' | 'UX' | 'SECURITY'; 
  name: string; desc: string; benefits: string; 
  status: 'PENDING' | 'DEVELOPING' | 'ACTIVE'; progress: number;
}

// --- 3. デザイン・ユーティリティ ---
const COLORS = {
  cyan: '#00f2ff',
  magenta: '#ff006e',
  green: '#39ff14',
  yellow: '#ffea00',
  red: '#ff0040',
  bg: '#050505',
  glass: 'rgba(255, 255, 255, 0.03)'
};

// --- 4. サブコンポーネント群 (高度 UI ライブラリ) ---

/**
 * サイバーパンク・マトリックス・デコーダー
 */
const MatrixDecoder = ({ text, speed = 15 }: { text: string, speed?: number }) => {
  const [display, setDisplay] = useState('');
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789あいうえおかきくけこアイウエオカキクケコ";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (Math.random() > 0.8) sfx.playType();
      setDisplay(text.substring(0, i) + chars[Math.floor(Math.random() * chars.length)]);
      i++;
      if (i > text.length) {
        clearInterval(interval);
        setDisplay(text);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{display}</span>;
};

/**
 * ステータス・インジケーター
 */
const StatusLabel = ({ status }: { status: Project['status'] }) => {
  const meta = {
    ONLINE: { color: 'text-green-400', label: '稼働中' },
    BUILDING: { color: 'text-yellow-400', label: '構築中' },
    WAITING: { color: 'text-cyan-600', label: '待機中' },
    MAINTENANCE: { color: 'text-orange-500', label: '保守中' },
    OFFLINE: { color: 'text-red-600', label: 'オフライン' },
  }[status];

  return (
    <div className="flex items-center gap-2">
      <motion.div 
        animate={{ opacity: [1, 0.4, 1] }} 
        transition={{ duration: 1.5, repeat: Infinity }}
        className={`w-1.5 h-1.5 rounded-full ${meta.color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`} 
      />
      <span className={`text-[10px] font-black uppercase tracking-tighter ${meta.color}`}>{meta.label}</span>
    </div>
  );
};

/**
 * ゲージ・コンポーネント (Resource Visualizer)
 */
const ResourceGauge = ({ label, value, unit, color = COLORS.cyan }: { label: string, value: number, unit: string, color?: string }) => (
  <div className="flex flex-col items-center gap-2 p-4 border border-white/5 rounded-3xl bg-black/40 group hover:border-white/20 transition-all duration-500">
    <div className="relative w-16 h-16">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-900" />
        <motion.circle 
          cx="32" cy="32" r="28" stroke={color} strokeWidth="3" fill="transparent" 
          strokeDasharray={176} strokeDashoffset={176 - (176 * value / 100)}
          className="shadow-[0_0_10px_currentColor]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[14px] font-black text-white">{value}</span>
        <span className="text-[6px] text-gray-500 font-bold uppercase">{unit}</span>
      </div>
    </div>
    <span className="text-[8px] font-black text-gray-600 tracking-[0.2em] uppercase group-hover:text-cyan-500 transition-colors">{label}</span>
  </div>
);

// --- 5. メインアプリケーションコンポーネント ---
export default function LaruNexusV8() {
  // --- A. State Management (要塞の記憶) ---
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'COMMAND' | 'KPI' | 'HISTORY' | 'SETTINGS'>('DASHBOARD');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [kpiData, setKpiData] = useState<any[]>([]);
  
  // 要塞設定
  const [aiPersona, setAiPersona] = useState('あなたは齋藤社長の専属AI司令官です。冷徹かつ情熱的に経営をサポートしてください。');
  const [securityLevel, setSecurityLevel] = useState(5);

  // --- B. プロジェクト資産データ (会社/受託 完全分離版) ---
  const [projects, setProjects] = useState<Project[]>([
    { 
      id: 'larubot', name: 'LARUbot Core AI', category: 'COMPANY', status: 'ONLINE', load: 32, latency: 42, repo: 'LARUbot_homepage', url: 'larubot.com',
      stats: { cpu: 14, memory: 48, requests: 1250, errors: 0 },
      issues: [],
      proposals: [{ id: 'p1', type: 'FEATURE', title: '深層文脈解析 V2 展開', impact: '理解精度 +25%', cost: 'High' }],
      logs: [{ time: '01:20', msg: 'System integrity verified.', type: 'sys' }]
    },
    { 
      id: 'laruvisona', name: 'ラルビソナ', category: 'COMPANY', status: 'ONLINE', load: 5, latency: 18, repo: 'laruvisona-corp-site', url: 'laruvisona.net',
      stats: { cpu: 2, memory: 12, requests: 380, errors: 0 },
      issues: [], proposals: [], logs: []
    },
    { 
      id: 'nexus', name: 'NEXUS 要塞司令部', category: 'COMPANY', status: 'BUILDING', load: 78, latency: 10, repo: 'laru-control-panel', url: 'nexus.local',
      stats: { cpu: 82, memory: 60, requests: 4500, errors: 0 },
      issues: [{ id: 'i1', level: 'INFO', title: '高負荷展開中', description: 'オメガ・シンギュラリティ v8.0 のデプロイメントが進行中。' }],
      proposals: [{ id: 'p2', type: 'SECURITY', title: '量子暗号通信プロトコル', impact: '解読不能', cost: 'Medium' }],
      logs: []
    },
    { 
      id: 'flastal', name: 'Flastal (顧客案件)', category: 'CLIENT', status: 'ONLINE', load: 45, latency: 92, repo: 'flastal', url: 'flastal.net',
      stats: { cpu: 38, memory: 52, requests: 9200, errors: 2 },
      issues: [{ id: 'i2', level: 'WARN', title: 'DBスループット警告', description: '顧客サイトのアクセス増に伴い、DBのレイテンシが上昇。' }],
      proposals: [{ id: 'p3', type: 'OPTIMIZATION', title: 'DB水平スケーリング', impact: '性能 10x', cost: 'High' }],
      logs: []
    },
  ]);

  // ロードマップ (20項目戦略アーカイブ)
  const [strategicRoadmap] = useState<RoadmapItem[]>([
    { id: 'rm1', category: 'AI', name: '自律コード修復エンジン', desc: 'ログからバグを特定し自動PRを作成', benefits: '開発停止時間ゼロ', status: 'DEVELOPING', progress: 75 },
    { id: 'rm2', category: 'INFRA', name: 'マルチクラウド自動避難', desc: 'AWS/GCPを瞬時に切り替え', benefits: '稼働率 100%', status: 'PENDING', progress: 0 },
    { id: 'rm3', category: 'UX', name: '脳波司令インターフェース', desc: 'Neuralink経由での思考操作', benefits: '思考即実行', status: 'ACTIVE', progress: 20 },
    { id: 'rm4', category: 'SECURITY', name: '量子耐性暗号化層', desc: 'ハッキングの完全無効化', benefits: '絶対的な秘匿性', status: 'DEVELOPING', progress: 40 },
    { id: 'rm5', category: 'AI', name: '社長人格デジタルツイン', desc: '齋藤社長の思考を完全に模倣', benefits: '24時間経営代行', status: 'PENDING', progress: 5 },
    { id: 'rm6', category: 'SECURITY', name: '生体声紋ロック v3', desc: '社長の声以外一切を拒絶', benefits: '本人認証の極北', status: 'ACTIVE', progress: 100 },
    { id: 'rm7', category: 'AI', name: '感情認識セールスAI', desc: '顧客の心理状態から成約を予測', benefits: '売上予測精度 +50%', status: 'PENDING', progress: 0 },
    { id: 'rm8', category: 'UX', name: 'ホログラム・コックピット', desc: '空間全体をモニター化', benefits: '物理制約の消失', status: 'PENDING', progress: 10 },
    { id: 'rm9', category: 'INFRA', name: '自律電源グリーンサーバー', desc: 'ソーラー直結のゼロコスト運用', benefits: '固定費の完全削減', status: 'PENDING', progress: 0 },
    { id: 'rm10', category: 'SECURITY', name: '自己焼却プロトコル', desc: '物理奪取時のデータ瞬時抹消', benefits: '機密保持の最終手段', status: 'ACTIVE', progress: 95 },
    { id: 'rm11', category: 'AI', name: '特許自動リサーチ', desc: '新機能の法的抵触を自動回避', benefits: 'リーガルリスクの消失', status: 'PENDING', progress: 0 },
    { id: 'rm12', category: 'AI', name: '多言語リアルタイム通訳', desc: '全言語対応のグローバル展開', benefits: '市場 200倍 拡大', status: 'DEVELOPING', progress: 55 },
    { id: 'rm13', category: 'INFRA', name: '衛星回線バックアップ', desc: 'Starlinkによる緊急通信', benefits: '地上インフラ停止時の司令', status: 'PENDING', progress: 25 },
    { id: 'rm14', category: 'AI', name: 'AIエンジニア自動採用', desc: '自律的にコードを書き足す', benefits: '人的コストの廃止', status: 'PENDING', progress: 0 },
    { id: 'rm15', category: 'UX', name: 'AR空間経営会議', desc: 'アバターによる商談自動化', benefits: '場所と時間の超越', status: 'PENDING', progress: 5 },
    { id: 'rm16', category: 'SECURITY', name: 'ディープフェイク防護壁', desc: 'なりすまし攻撃の完全検知', benefits: '社会的信用の保護', status: 'ACTIVE', progress: 85 },
    { id: 'rm17', category: 'AI', name: 'トレンド予言オラクル', desc: '3ヶ月先の市場需要を特定', benefits: '先制攻撃の実施', status: 'PENDING', progress: 0 },
    { id: 'rm18', category: 'INFRA', name: '分散型エッジストレージ', desc: 'データの断片化保存', benefits: '改ざん不可能性の保証', status: 'PENDING', progress: 0 },
    { id: 'rm19', category: 'AI', name: '完全自律経営戦略室', desc: '利益最大化のための自動判断', benefits: 'ヒューマンエラーの排除', status: 'PENDING', progress: 0 },
    { id: 'rm20', category: 'UX', name: 'NEXUS モバイル版完成', desc: '社長専用の世界一のスマホ操作', benefits: 'ポケットの中の帝国', status: 'ACTIVE', progress: 100 },
  ]);

  const ws = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- C. Logic Implementation (要塞の機能) ---

  /**
   * システムログ追加 (SFX/ハプティクス/通知同期)
   */
  const addLog = useCallback((msg: string, type: LogEntry['type'] = 'sys', imageUrl?: string) => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const id = Math.random().toString(36).substring(2, 11);
    
    setLogs(prev => [...prev.slice(-99), { id, msg, type, imageUrl, time }]);
    
    // SFXトリガー (情報の種類に応じて音を変える)
    if (type === 'sec' || type === 'alert') sfx.play('alert');
    else if (type === 'sys' || type === 'github' || type === 'success') sfx.play('success');
    else if (type === 'browser') sfx.play('camera');
    else sfx.play('click');

    // ブラウザプッシュ通知 (デプロイ成功時や重要警告時)
    if ((type === 'success' || type === 'alert') && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`NEXUS: ${type.toUpperCase()}`, { body: msg, icon: '/favicon.ico' });
    }

    // スマホバイブレーション (ハプティクス)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'alert') navigator.vibrate([200, 100, 200]);
      else if (type === 'success') navigator.vibrate(100);
    }
  }, []);

  /**
   * WebSocket 司令接続ロジック
   */
  useEffect(() => {
    sfx.init();
    const connect = () => {
      // ローカル Python Backend (main.py) とのリンク
      ws.current = new WebSocket('ws://localhost:8000/ws');
      
      ws.current.onopen = () => {
        setIsConnected(true);
        addLog('中枢神経系(CNS)ハンドシェイク完了。システムオンライン。', 'sys');
        sfx.playBoot();
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        // addLog('警告: 神経リンクが切断されました。再構築中...', 'alert');
        setTimeout(connect, 3000); 
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'LOG') {
          addLog(message.payload.msg, message.payload.type, message.payload.imageUrl);
        } else if (message.type === 'KPI_UPDATE') {
          setKpiData(prev => [...prev.slice(-15), message.data]);
        } else if (message.type === 'PROJECT_UPDATE') {
          setProjects(message.data);
        }
      };
    };

    connect();

    // KPI 初期化ダミーデータ
    setKpiData(Array.from({ length: 15 }).map((_, i) => ({
      name: `${i}:00`, users: 40 + Math.floor(Math.random() * 20), requests: 100 + Math.floor(Math.random() * 50)
    })));

    const monitorInterval = setInterval(() => {
      if (isLive) setAudioLevel(Math.random() * 100);
    }, 100);

    return () => {
      ws.current?.close();
      clearInterval(monitorInterval);
    };
  }, [addLog, isLive]);

  // ログ自動スクロール
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs, isThinking]);

  /**
   * 指令送信
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
        timestamp: Date.now()
      }));
    } else {
      addLog('エラー: リンク切断。送信不能。', 'alert');
    }

    setInputMessage('');
    setIsThinking(false);
  };

  /**
   * 音声認識エンジンの物理起動 (バグ修正版)
   */
  const startVoiceCommand = () => {
    sfx.play('click');
    sfx.resume();
    
    // Web Speech API アンロック
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("音声入力非対応ブラウザです。", "alert");

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;

    recognition.onstart = () => { setIsLive(true); addLog('マイクアクティブ。司令をどうぞ。', 'sys'); sfx.play('notify'); };
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) {
        // カタカナ・リポジトリ名正規化
        let normalized = transcript;
        normalized = normalized.replace(/フラスタル/g, 'flastal').replace(/ラルボット/g, 'larubot').replace(/ネクサス/g, 'nexus');
        handleCommand(normalized);
      }
    };
    recognition.onerror = () => setIsLive(false);
    recognition.onend = () => setIsLive(false);

    try { recognition.start(); } catch (e) { console.error(e); }
  };

  /**
   * 通知許可リクエスト (要塞接続)
   */
  const requestNotification = async () => {
    sfx.play('click');
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        addLog('通知システム: 社長端末との同期に成功。要塞防護開始。', 'success');
        sfx.playSuccess();
      } else {
        addLog('通知システム: 拒否されました。物理アラートのみ稼働。', 'alert');
      }
    }
  };

  /**
   * システム機能: 更新・抹消
   */
  const handleRefresh = () => { sfx.play('refresh'); window.location.reload(); };
  const handleClearLogs = () => { sfx.play('clear'); setLogs([]); addLog("要塞記録を完全抹消。履歴は消失しました。", "sys"); };

  // --- D. 各種ビューパネル定義 ---

  /**
   * 監視ダッシュボード
   */
  const DashboardView = () => (
    <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xs font-black text-white tracking-[0.4em] uppercase border-l-4 border-cyan-500 pl-3 mb-1">資産・稼働監視グリッド</h2>
          <p className="text-[9px] text-cyan-900 ml-4">SAITO HOLDINGS DISTRIBUTED NETWORK MONITORING</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-cyan-800 bg-cyan-900/5 px-4 py-2 rounded-full border border-cyan-900/20">
           <div className="flex items-center gap-1.5"><Wifi size={12}/> UPLINK: {isConnected ? 'SECURE' : 'OFFLINE'}</div>
           <div className="w-px h-3 bg-cyan-900/30" />
           <div>NODES: {projects.length} ACTIVE</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 自社資産セクション */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-cyan-600 font-black uppercase tracking-widest px-2">
            <Building2 size={12}/> 齋藤ホールディングス 会社資産
          </div>
          <div className="grid gap-3">
            {projects.filter(p => p.category === 'COMPANY').map(p => (
              <ProjectGridCard key={p.id} project={p} onAction={() => setSelectedProject(p)} />
            ))}
          </div>
        </div>

        {/* 受託案件セクション */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-yellow-700 font-black uppercase tracking-widest px-2">
            <Briefcase size={12}/> クライアント・受託プロジェクト (外部)
          </div>
          <div className="grid gap-3">
            {projects.filter(p => p.category === 'CLIENT').map(p => (
              <ProjectGridCard key={p.id} project={p} onAction={() => setSelectedProject(p)} isClient />
            ))}
          </div>
        </div>
      </div>

      {/* 統合リソース・ステータス */}
      <div className="border border-cyan-900/20 bg-cyan-950/5 rounded-[2.5rem] p-6 md:p-8">
        <h3 className="text-xs font-black text-cyan-500 tracking-widest flex items-center gap-2 mb-8 uppercase">
          <HardDrive size={16}/> 要塞計算リソース・マトリックス
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
           <ResourceGauge label="CPU COMPUTE" value={72} unit="%" />
           <ResourceGauge label="NEURAL MEMORY" value={45} unit="GB" />
           <ResourceGauge label="GPU TFLOPS" value={28} unit="FLOP" color={COLORS.magenta} />
           <ResourceGauge label="IO SPEED" value={98} unit="GBPS" color={COLORS.green} />
        </div>
      </div>
    </div>
  );

  /**
   * 司令コンソール
   */
  const CommandView = () => (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-black to-[#080808]">
      {/* 司令部 HUD */}
      <div className="p-4 md:p-6 flex items-center justify-between border-b border-cyan-900/10 bg-black/60 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => sfx.play('click')}>
             <motion.div animate={{ scale: isLive ? [1, 1.1, 1] : 1 }} transition={{ duration: 0.3, repeat: Infinity }}>
               <svg width="50" height="60" viewBox="0 0 100 120" fill="none" stroke={isThinking ? "#00f2ff" : "#222"} strokeWidth="2" className="transition-all duration-500 filter drop-shadow-[0_0_12px_rgba(0,242,255,0.4)]">
                  <path d="M15,30 L50,5 L85,30 L90,55 L50,110 L10,55 L15,30 Z" className="opacity-80" />
                  <circle cx="35" cy="45" r="1.5" fill={isThinking ? "#00f2ff" : "#111"} />
                  <circle cx="65" cy="45" r="1.5" fill={isThinking ? "#00f2ff" : "#111"} />
                  <path d={`M38,85 Q50,${85 + (audioLevel / 5)} 62,85`} stroke={isThinking ? "#00f2ff" : "#333"} />
               </svg>
             </motion.div>
             {isThinking && <div className="absolute -inset-2 border border-cyan-500/20 rounded-full animate-ping" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-cyan-600 tracking-tighter uppercase italic mb-0.5 opacity-70">NEURAL COMMAND UNIT</span>
            <h2 className="text-base text-white font-black tracking-[0.25em] uppercase italic shadow-cyan-500/20">Gemini 2.5 Flash</h2>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-8">
           <StatMini label="系統稼働時間" value="256:45:12" />
           <StatMini label="脅威検知" value="0 DETECTED" color="text-green-500" />
           <div className="w-px h-10 bg-cyan-900/30" />
           <StatusLabel status="ONLINE" />
        </div>
      </div>

      {/* ログストリーム (視覚情報対応) */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-hide">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div 
              key={log.id} 
              initial={{ opacity: 0, y: 15, scale: 0.98 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4 }}
              className={`flex flex-col ${log.type === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="text-[10px] text-gray-700 mb-2 font-black flex gap-3 uppercase tracking-widest italic px-2">
                <span>[{log.time}]</span>
                <span className={
                  log.type === 'user' ? 'text-white' : 
                  log.type === 'gemini' ? 'text-cyan-500 underline' :
                  log.type === 'sec' ? 'text-red-500' : 'text-gray-500'
                }>{log.type}</span>
              </div>
              <div className={`max-w-[95%] md:max-w-[80%] px-6 py-4 rounded-[2rem] text-[14px] leading-relaxed shadow-2xl transition-all border ${
                log.type === 'user' ? 'bg-cyan-900/20 border-cyan-500/40 text-white' : 
                log.type === 'browser' ? 'border-yellow-500/30 bg-yellow-500/5 text-yellow-100' :
                log.type === 'sec' ? 'bg-red-950/20 border-red-500/40 text-red-100' :
                'bg-white/5 border-white/10 text-cyan-50'
              }`}>
                {/* 視覚情報の描画ロジック */}
                {log.imageUrl && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 overflow-hidden rounded-2xl border border-white/20 shadow-2xl group relative">
                    <img src={log.imageUrl} alt="System Observation" className="w-full h-auto cursor-pointer hover:scale-[1.02] transition-transform duration-700" onClick={() => window.open(log.imageUrl)} />
                    <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[8px] font-bold text-yellow-400 flex items-center gap-1 uppercase"><Camera size={10}/> Visual_Log_Captured</div>
                  </motion.div>
                )}
                
                {log.type === 'gemini' || log.type === 'sys' ? (
                  <MatrixDecoder text={log.msg} speed={8} />
                ) : (
                  log.msg
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isThinking && (
          <div className="flex gap-2 p-4">
            {[0, 0.2, 0.4].map(delay => (
              <motion.div key={delay} animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay }} className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_#00f2ff]" />
            ))}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 司令入力ドック (モバイル・コンテキスト対応) */}
      <div className="p-4 md:p-8 bg-black/80 backdrop-blur-3xl border-t border-cyan-900/30 z-50">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <motion.button 
            whileTap={{ scale: 0.85 }}
            onClick={startVoiceCommand} 
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isLive ? 'bg-red-600 shadow-[0_0_40px_#ff0000] ring-4 ring-red-950' : 'bg-cyan-900/20 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10'
            }`}
          >
            <Mic size={24} className={isLive ? 'animate-pulse' : ''} />
          </motion.button>
          
          <div className="flex-1 relative group">
            <input 
              className="w-full h-14 md:h-16 bg-white/5 border border-cyan-900/30 rounded-[2rem] px-8 pr-16 text-base md:text-lg outline-none focus:border-cyan-400 focus:bg-white/10 transition-all text-white placeholder-cyan-900 shadow-inner font-mono tracking-tight"
              placeholder="要塞司令コードを入力..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
            />
            <button 
              onClick={() => handleCommand()}
              className="absolute right-5 top-3.5 md:top-4.5 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-cyan-600 hover:text-cyan-400 transition-all hover:scale-110 active:scale-90"
            >
              <ChevronRight size={32} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * 分析パネル
   */
  const KpiView = () => (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto pb-24 md:pb-10 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-black text-white tracking-[0.5em] uppercase border-l-4 border-cyan-500 pl-3 mb-2">ディープ・アナリティクス・コア</h2>
          <p className="text-[10px] text-gray-600 uppercase">System Integrity & Revenue Projection Matrix</p>
        </div>
        <div className="hidden md:block text-[10px] text-cyan-900 font-mono tracking-tighter uppercase">NEXUS_CLUSTER_V8_ACTIVE</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 border border-cyan-900/20 bg-cyan-950/5 rounded-[3rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-base font-black text-white mb-2 uppercase tracking-widest italic">Global Traffic Flow</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">全ネットワーク・リクエスト・マトリックス</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_12px_#00f2ff] animate-pulse" />
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">LIVE_SYNCING</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpiData}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                <XAxis dataKey="name" stroke="#222" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#222" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="requests" stroke={COLORS.cyan} strokeWidth={5} fill="url(#colorTraffic)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-cyan-900/20 bg-cyan-950/5 rounded-[3rem] p-10 flex flex-col items-center">
          <h3 className="text-sm font-black text-white mb-8 uppercase tracking-widest text-center italic underline underline-offset-8 decoration-cyan-900">Resource Distribution</h3>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={projects} dataKey="load" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} stroke="none">
                    {projects.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 2 ? COLORS.red : index === 3 ? COLORS.yellow : COLORS.cyan} opacity={0.5 + (index * 0.1)} />
                    ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-8 w-full">
             {projects.map((p, i) => (
               <div key={p.id} className="flex flex-col gap-1">
                 <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">{p.name}</span>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: i === 2 ? COLORS.red : i === 3 ? COLORS.yellow : COLORS.cyan }} />
                    <span className="text-sm font-black text-white">{p.load}%</span>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* 受託案件・経済マトリックス */}
      <div className="border-t border-cyan-900/20 pt-10">
         <div className="flex items-center gap-4 mb-8 px-4">
            <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
               <Briefcase size={24} className="text-yellow-600" />
            </div>
            <div>
               <h3 className="text-lg font-black text-yellow-500 tracking-[0.2em] uppercase italic">Client Business Logic</h3>
               <p className="text-[10px] text-yellow-900 uppercase font-bold tracking-widest">受託案件・収益監視サブシステム</p>
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ClientMetricBox label="四半期収益予測" value="¥2,450,000" sub="Q1 達成見込み: 85%" />
            <ClientMetricBox label="平均SLA応答" value="185 ms" sub="品質基準合格" color="text-green-500" />
            <ClientMetricBox label="未解決チケット" value="3" sub="優先度: Medium" color="text-red-500" />
         </div>
      </div>
    </div>
  );

  /**
   * 履歴 & ロードマップ
   */
  const HistoryView = () => (
    <div className="flex-1 p-6 md:p-12 overflow-y-auto pb-24 md:pb-12">
      <div className="max-w-5xl mx-auto space-y-16">
        <header className="text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block px-6 py-2 border border-cyan-500/30 rounded-full bg-cyan-500/5 text-[11px] text-cyan-400 font-black uppercase tracking-[0.6em] italic"
          >
            Strategic Archives
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_20px_rgba(0,242,255,0.2)]">要塞ロードマップ 2026</h1>
          <div className="w-24 h-1 bg-cyan-500 mx-auto rounded-full" />
          <p className="text-xs md:text-sm text-cyan-900 max-w-2xl mx-auto leading-relaxed font-bold uppercase tracking-widest">
            齋藤ホールディングス の未来を支配する 20 の戦略的イニシアチブ。<br/>これらは社長、齋藤拓実の意志を反映し、自律的に進化を続けます。
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {strategicRoadmap.map((item, index) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="p-8 border border-cyan-900/20 bg-cyan-950/5 rounded-[2.5rem] relative overflow-hidden group shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                {item.category === 'AI' ? <Cpu size={80}/> : item.category === 'SECURITY' ? <Shield size={80}/> : <Globe size={80}/>}
              </div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-cyan-600 bg-cyan-900/20 border border-cyan-900/40 px-4 py-1.5 rounded-xl tracking-widest uppercase italic">
                  {item.category}
                </span>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${item.status === 'ACTIVE' ? 'bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]' : 'bg-gray-800'}`} />
                   <span className={`text-[10px] font-black tracking-tighter ${item.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-700'}`}>
                     {item.status}
                   </span>
                </div>
              </div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-tight italic uppercase">{item.name}</h3>
              <p className="text-[12px] text-gray-500 mb-8 leading-relaxed font-medium uppercase tracking-tight">{item.desc}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black text-cyan-800 uppercase tracking-[0.2em]">
                  <span>Progress_Implementation</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-cyan-500 shadow-[0_0_15px_#00f2ff]" 
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4">
                <div className="text-[10px] text-gray-600 leading-normal">
                  <span className="text-cyan-900 font-black uppercase tracking-widest mb-1 block">Expected_ROI:</span>
                  {item.benefits}
                </div>
                <button 
                   onClick={() => { sfx.play('click'); handleCommand(`${item.name}の現在の進捗状況を、データに基づいて詳細に説明せよ。`); }}
                   className="w-full py-3 bg-white/5 border border-cyan-500/20 rounded-2xl text-[10px] font-black text-cyan-500 hover:bg-cyan-500/10 transition-all uppercase tracking-[0.3em]"
                >
                  詳細をAIと討議開始
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center py-16 opacity-30">
           <Lock size={60} className="mx-auto text-cyan-900 mb-6" />
           <p className="text-[11px] text-cyan-950 font-black tracking-[0.8em] uppercase">Security Layer 5: Only Presidential Access Authorized</p>
        </div>
      </div>
    </div>
  );

  /**
   * 要塞設定パネル
   */
  const SettingsView = () => (
    <div className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col items-center pb-24 md:pb-12">
       <div className="w-full max-w-3xl space-y-16">
          <div className="border-b border-cyan-900/30 pb-10 flex justify-between items-end">
             <div>
               <h2 className="text-3xl font-black text-white tracking-[0.3em] uppercase italic">System Registry</h2>
               <p className="text-xs text-cyan-900 font-bold uppercase tracking-widest mt-2">要塞の深層パラメータと神経回路を調整します。</p>
             </div>
             <div className="text-[10px] text-gray-700 font-mono">BUILD: 2026.01.17_OMEGA</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* AI セクション */}
            <section className="space-y-8">
              <h3 className="text-xs font-black text-cyan-500 uppercase tracking-[0.5em] flex items-center gap-3">
                <CpuIcon size={20}/> Neural AI Matrix
              </h3>
              <div className="bg-white/5 border border-cyan-900/30 rounded-[2.5rem] p-8 space-y-10 shadow-2xl">
                <div className="space-y-4">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black flex items-center gap-2">
                    <Key size={12}/> 司令官パーソナリティ指令 (System_Prompt)
                  </label>
                  <textarea 
                    className="w-full h-40 bg-black border border-cyan-900/50 rounded-2xl p-5 text-sm text-cyan-100 outline-none focus:border-cyan-400 transition-all font-mono leading-relaxed shadow-inner"
                    value={aiPersona}
                    onChange={(e) => setAiPersona(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-900/20 rounded-lg"><Bell size={18} className="text-cyan-500"/></div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase mb-1">音声読み上げ</h4>
                      <p className="text-[9px] text-gray-600 uppercase font-bold tracking-tighter">AI回答の音声合成出力</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setUseVoiceSynthesis(!useVoiceSynthesis); sfx.play('toggle'); }}
                    className={`w-14 h-7 rounded-full relative transition-all duration-500 ${useVoiceSynthesis ? 'bg-cyan-500 shadow-[0_0_15px_#00f2ff]' : 'bg-gray-800'}`}
                  >
                    <motion.div animate={{ x: useVoiceSynthesis ? 32 : 4 }} className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg" />
                  </button>
                </div>
              </div>
            </section>

            {/* 要塞防衛セクション */}
            <section className="space-y-8">
              <h3 className="text-xs font-black text-red-600 uppercase tracking-[0.5em] flex items-center gap-3">
                <Shield size={20}/> Fortress Defense
              </h3>
              <div className="bg-white/5 border border-red-900/30 rounded-[2.5rem] p-8 space-y-10 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-red-600/30 animate-pulse" />
                 <div className="space-y-4">
                    <label className="text-[10px] text-red-950 uppercase tracking-widest font-black">Security_Level_Configuration</label>
                    <div className="flex justify-between gap-2">
                       {[1,2,3,4,5].map(lv => (
                         <button key={lv} onClick={() => setSecurityLevel(lv)} className={`flex-1 py-3 rounded-xl border text-xs font-black transition-all ${securityLevel === lv ? 'bg-red-600 border-red-600 text-white' : 'border-red-900/20 text-red-950'}`}>
                           LV{lv}
                         </button>
                       ))}
                    </div>
                 </div>
                 <p className="text-[11px] leading-relaxed italic text-gray-500 border-l-2 border-red-900/50 pl-5 uppercase font-bold tracking-tighter">
                   「現在の防衛レベルは {securityLevel} です。全接続プロトコルは齋藤社長の生体暗号鍵とのみ照合されます。外部からの全ポートスキャンは自動的にハニーポット・トラップへ転送されます。」
                 </p>
                 <button 
                   onClick={() => { sfx.play('alert'); addLog('警告: 自己消滅シーケンスの武装化準備。確認コードを入力せよ。 (Simulation Mode)', 'alert'); }}
                   className="w-full py-5 border border-red-500/50 text-red-500 text-[10px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] hover:bg-red-500/10 transition-all shadow-[0_0_20px_rgba(255,0,0,0.1)] active:scale-95"
                 >
                   自己消滅シーケンスを起動
                 </button>
              </div>
            </section>
          </div>
       </div>
    </div>
  );

  // --- F. Layout & Interface ---

  return (
    <div className="fixed inset-0 bg-[#010101] text-cyan-400 font-mono flex flex-col overflow-hidden selection:bg-cyan-900 selection:text-white">
      {/* 視覚背景オーバーレイ (グリッド & 走査線) */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none z-0" 
           style={{ backgroundImage: 'linear-gradient(#00f2ff 1px, transparent 1px), linear-gradient(90deg, #00f2ff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none z-10" />
      
      {/* 統合ヘッダー (完全復旧・強化版) */}
      <header className="h-16 border-b border-cyan-900/40 bg-black/60 backdrop-blur-3xl flex items-center justify-between px-6 z-50 relative shrink-0">
        <div className="flex items-center gap-5 group cursor-pointer" onClick={() => { setActiveTab('DASHBOARD'); sfx.play('click'); }}>
          <motion.div animate={{ rotate: isConnected ? 360 : 0 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
            <Zap className={isConnected ? 'text-cyan-400 drop-shadow-[0_0_15px_#00f2ff]' : 'text-gray-800'} size={24} />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-black tracking-[0.4em] text-lg text-white uppercase italic transition-all group-hover:text-cyan-400">LARU NEXUS</span>
            <span className="text-[10px] text-cyan-900 font-black uppercase tracking-[0.3em] leading-none mt-1 italic">Omega_Singularity v8.0</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4 border-r border-cyan-900/30 pr-6 mr-2">
             <HeaderActionIcon icon={<RefreshCw size={20}/>} onClick={handleRefresh} label="再起動" />
             <HeaderActionIcon icon={<Trash2 size={20}/>} onClick={handleClearLogs} label="記録抹消" color="hover:text-red-600" />
             <HeaderActionIcon icon={<Bell size={20}/>} onClick={requestNotification} label="要塞接続" />
          </div>
          <div className="flex items-center gap-5">
             <div className="flex flex-col items-end">
                <div className={`text-[11px] font-black tracking-tight flex items-center gap-2 ${isConnected ? 'text-green-500' : 'text-red-700 animate-pulse'}`}>
                  {isConnected ? <><div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"/> CNS_LINKED</> : 'LINK_OFFLINE'}
                </div>
                <div className="text-[8px] text-cyan-900 tracking-widest uppercase font-bold">Takumi_MacBook_Air_01</div>
             </div>
             <button onClick={startVoiceCommand} className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all md:hidden">
                <Mic size={22} />
             </button>
          </div>
        </div>
      </header>

      {/* リアルタイム・パケット・ストリーム (マーキー) */}
      <div className="h-12 bg-cyan-950/10 border-b border-cyan-900/10 flex items-center overflow-hidden whitespace-nowrap px-6 z-40 relative shrink-0">
        <div className="flex items-center gap-3 text-[11px] font-black text-cyan-600 mr-12 shrink-0 uppercase italic tracking-[0.3em] bg-black/40 border border-cyan-900/20 px-4 py-1.5 rounded-xl shadow-lg">
          <Radio size={14} className="animate-pulse" /> Global_Feed:
        </div>
        <div className="flex gap-20 animate-marquee-extended">
           {projects.map(p => (
             <div key={p.id} className="text-[12px] text-gray-500 flex items-center gap-6 font-bold">
               <span className={`px-2 py-0.5 rounded border ${p.category === 'CLIENT' ? 'text-yellow-700 border-yellow-900/30' : 'text-cyan-800 border-cyan-900/30'}`}>[{p.name}]</span>
               <span className="flex items-center gap-1.5"><CpuIcon size={12}/> {p.stats.cpu}%</span>
               <span className="flex items-center gap-1.5"><Box size={12}/> {p.stats.memory}%</span>
               <span className={p.status === 'ONLINE' ? 'text-green-900/60' : 'text-red-900/60'}>{p.status}</span>
               <span className="text-gray-800">REQ_VOL: {p.stats.requests}/s</span>
             </div>
           ))}
        </div>
      </div>

      {/* メイン・ビューポート構造 */}
      <div className="flex-1 flex overflow-hidden relative z-20">
        {/* デスクトップ サイドバー */}
        <nav className="hidden md:flex w-20 border-r border-cyan-900/20 flex-col items-center py-10 gap-10 bg-black/60 backdrop-blur-md z-40 shrink-0 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
          <SideNavBtn icon={<Terminal size={24}/>} active={activeTab === 'COMMAND'} onClick={() => setActiveTab('COMMAND')} label="指令" />
          <SideNavBtn icon={<Activity size={24}/>} active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} label="監視" />
          <SideNavBtn icon={<Layers size={24}/>} active={activeTab === 'KPI'} onClick={() => setActiveTab('KPI')} label="分析" />
          <SideNavBtn icon={<History size={24}/>} active={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')} label="履歴" />
          <div className="flex-1" />
          <SideNavBtn icon={<Settings size={24}/>} active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} label="設定" />
        </nav>
        
        {/* メイン描画エリア */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-black/30 backdrop-blur-sm">
          <AnimatePresence mode='wait'>
            {activeTab === 'DASHBOARD' && <DashboardView key="dash" />}
            {activeTab === 'COMMAND' && <CommandView key="cmd" />}
            {activeTab === 'KPI' && <KpiView key="kpi" />}
            {activeTab === 'HISTORY' && <HistoryView key="hist" />}
            {activeTab === 'SETTINGS' && <SettingsView key="sett" />}
          </AnimatePresence>
        </main>
      </div>

      {/* モバイル・ボトム・ドック (親指操作最適化) */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/90 backdrop-blur-3xl border-t border-cyan-900/40 flex items-center justify-around z-50 md:hidden px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <MobileNavBtn icon={<Terminal size={26}/>} label="指令" active={activeTab === 'COMMAND'} onClick={() => setActiveTab('COMMAND')} />
        <MobileNavBtn icon={<Activity size={26}/>} label="監視" active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} />
        <div 
          className="w-16 h-16 -mt-12 flex items-center justify-center bg-cyan-500 rounded-full border-[6px] border-[#010101] shadow-[0_0_30px_rgba(0,242,255,0.5)] active:scale-90 transition-all duration-300 transform group"
          onClick={() => { setIsCommandOpen(true); sfx.play('notify'); }}
        >
          <Command size={32} className="text-black group-hover:rotate-12 transition-transform" />
        </div>
        <MobileNavBtn icon={<Layers size={26}/>} label="分析" active={activeTab === 'KPI'} onClick={() => setActiveTab('KPI')} />
        <MobileNavBtn icon={<Shield size={26}/>} label="防衛" active={false} onClick={requestNotification} />
      </nav>

      {/* クイック・コマンド・パレット (Cmd+K モーダル) */}
      <AnimatePresence>
        {isCommandOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-[100] p-6 flex flex-col pt-24 items-center overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
              className="w-full max-w-3xl bg-[#0a0a0a] border border-cyan-500/30 rounded-[3.5rem] overflow-hidden shadow-[0_0_150px_rgba(0,242,255,0.15)] flex flex-col"
            >
              <div className="p-10 border-b border-cyan-900/50 flex items-center gap-8 bg-white/5 shadow-inner">
                <Search className="text-cyan-500" size={36} />
                <input 
                  className="bg-transparent border-none outline-none text-white flex-1 text-3xl font-black italic tracking-tighter placeholder-cyan-950 uppercase" 
                  placeholder="要塞指令コードを入力せよ..." 
                  autoFocus 
                  onKeyDown={e => { if(e.key === 'Enter') handleCommand((e.target as any).value); }} 
                />
              </div>
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 text-[11px] text-cyan-900 font-black px-4 py-2 uppercase tracking-[0.5em] mb-2 italic">Priority_Neural_Protocols</div>
                <QuickCmdItem icon={<Cpu size={20}/>} cmd="/deploy larubot" desc="自社 AI HP を最新環境へ展開" onClick={() => handleCommand('/deploy larubot')} />
                <QuickCmdItem icon={<Briefcase size={20}/>} cmd="/deploy flastal" desc="顧客受託案件の緊急同期" onClick={() => handleCommand('/deploy flastal')} />
                <QuickCmdItem icon={<Eye size={20}/>} cmd="/monitor all" desc="全システムの深層パケット解析" onClick={() => handleCommand('/monitor all')} />
                <QuickCmdItem icon={<Cloud size={20}/>} cmd="/backup start" desc="外部衛星回線へのデータ退避" onClick={() => handleCommand('/backup start')} />
                <QuickCmdItem icon={<History size={20}/>} cmd="/logs export" desc="全司令履歴の暗号化出力" onClick={() => handleCommand('/logs export')} />
                <QuickCmdItem icon={<Power size={20}/>} cmd="/nexus reset" desc="要塞システムの再構成" onClick={handleRefresh} />
              </div>
              <div className="p-4 bg-cyan-950/10 text-center border-t border-cyan-900/20">
                 <span className="text-[9px] text-cyan-900 font-black tracking-widest uppercase">Encryption Layer Active: CMD+K to Toggle</span>
              </div>
            </motion.div>
            <button 
              className="mt-12 text-cyan-900 text-xs font-black tracking-[0.6em] border border-cyan-900/30 px-16 py-5 rounded-full hover:bg-cyan-500/10 transition-all uppercase hover:text-cyan-400 active:scale-95 shadow-xl shadow-cyan-950/20"
              onClick={() => setIsCommandOpen(false)}
            >
              閉じる / ESC
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* プロジェクト・オーバーレイ・詳細モーダル (v7.1 統合機能) */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 overflow-hidden" onClick={() => setSelectedProject(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-5xl bg-[#0a0a0a] border border-cyan-500/40 rounded-[4rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* サイドバー: 基本統計 */}
              <div className="w-full md:w-[35%] bg-cyan-950/10 border-r border-cyan-900/20 p-10 flex flex-col">
                <div className="mb-10">
                  <div className="flex justify-between items-start mb-6">
                    <StatusLabel status={selectedProject.status} />
                    <button onClick={() => setSelectedProject(null)} className="text-gray-700 hover:text-white transition-colors"><X size={32}/></button>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">{selectedProject.name}</h2>
                  <p className="text-[11px] text-cyan-800 font-mono mt-3 uppercase tracking-widest">{selectedProject.repo}</p>
                </div>

                <div className="flex-1 space-y-8">
                   <MiniGauge label="LATENCY_RESPONSE" value={`${selectedProject.latency}ms`} progress={Math.min(100, selectedProject.latency / 2)} />
                   <MiniGauge label="SYSTEM_UPTIME" value="99.98%" progress={99.9} color={COLORS.green} />
                   <MiniGauge label="FATAL_ERRORS" value={selectedProject.stats.errors.toString()} progress={selectedProject.stats.errors * 20} color={selectedProject.stats.errors > 0 ? COLORS.red : COLORS.cyan} />
                   <div className="p-5 bg-black/40 border border-white/5 rounded-3xl">
                      <div className="text-[9px] text-gray-600 font-black uppercase mb-3">Deployment_Region</div>
                      <div className="flex items-center gap-3">
                         <Globe size={16} className="text-cyan-600" />
                         <span className="text-xs font-bold text-white uppercase">Tokyo Hub 01 (AWS)</span>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={() => { sfx.play('success'); handleCommand(`/deploy ${selectedProject.id}`); setSelectedProject(null); }}
                  className="w-full py-5 mt-10 bg-cyan-500 text-black font-black uppercase text-sm tracking-[0.3em] rounded-3xl hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-cyan-500/20 italic"
                >
                  展開プロセス起動
                </button>
              </div>

              {/* メイン: ログ & 提案 */}
              <div className="flex-1 p-10 overflow-y-auto space-y-12 scrollbar-hide bg-gradient-to-br from-black to-[#050505]">
                 <section>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em] flex items-center gap-3 italic"><Terminal size={14}/> Realtime_Kernel_Logs</h3>
                      <div className="text-[9px] text-cyan-900 font-mono">STREAMING...</div>
                    </div>
                    <div className="bg-black border border-white/5 rounded-[2rem] p-8 font-mono text-[11px] space-y-3 shadow-inner min-h-[220px]">
                       <p className="text-green-950 tracking-tighter">[{new Date().toLocaleTimeString()}] INFRA: Socket connection established via port 443</p>
                       <p className="text-cyan-950 tracking-tighter">[{new Date().toLocaleTimeString()}] CORE: Handshake with DB cluster [region-tokyo] successful</p>
                       <p className="text-gray-800 tracking-tighter">[{new Date().toLocaleTimeString()}] MONITOR: Log rotation process completed. 0 threats detected.</p>
                       <p className="text-gray-800 tracking-tighter">[{new Date().toLocaleTimeString()}] SECURE: Traffic encrypted with AES-256-GCM.</p>
                       {selectedProject.stats.errors > 0 && <p className="text-red-950 animate-pulse tracking-tighter">[{new Date().toLocaleTimeString()}] ALERT: Buffer Overflow prevention triggered on endpoint /api/v1</p>}
                    </div>
                 </section>

                 <section>
                    <div className="flex items-center gap-3 mb-6">
                      <Zap size={16} className="text-cyan-500" />
                      <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em] italic">AI_Optimization_Proposals</h3>
                    </div>
                    <div className="grid gap-4">
                       {selectedProject.proposals.length > 0 ? selectedProject.proposals.map(prop => (
                         <div key={prop.id} className="p-6 border border-cyan-900/20 bg-white/5 rounded-3xl flex justify-between items-center group hover:bg-cyan-500/5 hover:border-cyan-500/30 transition-all">
                            <div className="space-y-1">
                               <div className="text-sm font-black text-white tracking-widest uppercase italic">{prop.title}</div>
                               <div className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Impact: <span className="text-cyan-600 italic">{prop.impact}</span> | Cost: {prop.cost}</div>
                            </div>
                            <button className="px-6 py-3 bg-cyan-900/20 border border-cyan-500 text-cyan-400 text-[10px] font-black uppercase rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-cyan-500 hover:text-black">
                               承認・実行
                            </button>
                         </div>
                       )) : (
                         <div className="p-10 border border-dashed border-white/10 rounded-3xl text-center">
                            <CheckCircle size={32} className="text-cyan-900 mx-auto mb-4 opacity-40" />
                            <p className="text-[12px] text-gray-700 uppercase font-black tracking-widest">現在、最適化の必要はありません。システムは最高効率で稼働中です。</p>
                         </div>
                       )}
                    </div>
                 </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* フッター (デスクトップ専用情報バー) */}
      <footer className="hidden md:flex h-10 border-t border-cyan-900/20 bg-black px-8 items-center justify-between text-[10px] text-gray-800 uppercase tracking-[0.4em] shrink-0 z-50">
        <div className="flex gap-10 items-center font-bold">
          <div>© 2026 LARUbot Holdings Inc. All Rights Reserved.</div>
          <div className="w-px h-4 bg-gray-900" />
          <div className="flex items-center gap-2"><Globe size={14}/> Distributed_CDN_Network: 24 Nodes Active</div>
        </div>
        <div className="flex gap-8 items-center font-black italic">
          <div className="flex items-center gap-2 text-cyan-900"><Database size={14}/> DB_CLUSTER_SYNC: OPTIMAL</div>
          <div className="text-cyan-900 border-l border-cyan-900/30 pl-8">Security_Fortress_Level: 5 (Extreme)</div>
        </div>
      </footer>

      {/* グローバル・アニメーション・スタイル */}
      <style jsx global>{`
        @keyframes marquee-extended {
          0% { transform: translateX(50%); }
          100% { transform: translateX(-150%); }
        }
        .animate-marquee-extended {
          display: flex;
          animation: marquee-extended 50s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* モバイル特有のタップハイライト無効化 */
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}

// --- 6. Helper Utility Components (詳細実装) ---

/**
 * ヘッダー用アクションボタン
 */
function HeaderActionIcon({ icon, onClick, label, color = "hover:text-cyan-400" }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`p-2 transition-all ${color} group relative active:scale-90`}
      aria-label={label}
    >
      {icon}
      <span className="absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-black border border-cyan-900 text-[8px] font-black uppercase px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] tracking-widest">
        {label}
      </span>
    </button>
  );
}

/**
 * サイドバー・ナビゲーションボタン
 */
function SideNavBtn({ icon, active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`relative p-4 rounded-[1.5rem] transition-all duration-500 group shadow-lg ${active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-cyan-500/10' : 'text-cyan-950 border border-transparent hover:border-white/10 hover:bg-white/5 hover:text-cyan-600'}`}
    >
      {icon}
      <span className="absolute left-full ml-6 px-4 py-2 bg-[#0a0a0a] border border-cyan-900 text-[10px] font-black italic uppercase tracking-[0.3em] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[100] shadow-2xl">
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="sidebar-active-indicator" 
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-cyan-500 rounded-r-full shadow-[0_0_15px_#00f2ff]" 
        />
      )}
    </button>
  );
}

/**
 * モバイル・タブボタン (親指操作用)
 */
function MobileTabBtn({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-1.5 flex-1 py-1 transition-all duration-300 ${active ? 'text-cyan-400 drop-shadow-[0_0_10px_#00f2ff]' : 'text-cyan-950'}`}
    >
      <div className={`${active ? 'scale-125' : ''} transition-transform`}>{icon}</div>
      <span className="text-[9px] font-black tracking-tighter uppercase italic">{label}</span>
    </button>
  );
}

/**
 * プロジェクト表示カード (監視グリッド)
 */
function ProjectGridCard({ project, onAction, isClient = false }: { project: Project, onAction: () => void, isClient?: boolean }) {
  return (
    <motion.div 
      layoutId={`proj-${project.id}`}
      onClick={onAction}
      whileHover={{ y: -5 }}
      className={`bg-white/5 border ${isClient ? 'border-yellow-950/20 hover:border-yellow-500/40' : 'border-cyan-950/20 hover:border-cyan-500/40'} p-6 rounded-[2.5rem] flex flex-col gap-6 cursor-pointer transition-all duration-700 group shadow-2xl relative overflow-hidden`}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className={`text-sm font-black uppercase italic tracking-tighter group-hover:text-white transition-colors ${isClient ? 'text-yellow-600' : 'text-cyan-600'}`}>
            {project.name}
          </span>
          <span className="text-[9px] text-gray-700 font-mono tracking-widest italic">{project.repo}</span>
        </div>
        <StatusLabel status={project.status} />
      </div>
      
      <div className="space-y-2">
         <div className="flex justify-between text-[10px] font-black text-gray-700 uppercase tracking-widest italic">
           <span>Core_Load_Matrix</span>
           <span className={project.load > 80 ? 'text-red-700' : isClient ? 'text-yellow-900' : 'text-cyan-900'}>{project.load}%</span>
         </div>
         <div className="w-full h-1.5 bg-black rounded-full overflow-hidden shadow-inner">
            <motion.div 
               initial={{ width: 0 }} 
               animate={{ width: `${project.load}%` }} 
               transition={{ duration: 1.5, ease: "easeOut" }}
               className={`h-full shadow-lg ${project.load > 80 ? 'bg-red-600' : isClient ? 'bg-yellow-600' : 'bg-cyan-600'}`} 
            />
         </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-white/5">
         <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-[9px] text-gray-600 font-black uppercase"><CpuIcon size={12}/> V8_CORE</div>
            <div className="flex items-center gap-1.5 text-[9px] text-gray-600 font-black uppercase"><GitBranch size={12}/> main</div>
         </div>
         <ChevronRight size={20} className="text-gray-800 group-hover:text-cyan-500 group-hover:translate-x-2 transition-all" />
      </div>
    </motion.div>
  );
}

/**
 * 分析用ミニスタッツ
 */
function StatMini({ label, value, color = "text-cyan-700" }: any) {
  return (
    <div className="flex flex-col">
       <span className="text-[9px] text-gray-700 uppercase font-black tracking-widest mb-0.5">{label}</span>
       <span className={`text-[11px] font-black ${color} tracking-tighter italic uppercase`}>{value}</span>
    </div>
  );
}

/**
 * 顧客案件用メトリクスボックス
 */
function ClientMetricBox({ label, value, sub, color = "text-white" }: any) {
  return (
    <div className="bg-white/5 border border-yellow-900/10 p-8 rounded-[2.5rem] hover:bg-yellow-500/5 transition-all duration-500 group shadow-xl">
       <div className="text-[10px] text-yellow-900 font-black uppercase tracking-[0.3em] mb-4 italic group-hover:text-yellow-600">// {label}</div>
       <div className={`text-2xl md:text-3xl font-black italic tracking-tighter mb-2 ${color}`}>{value}</div>
       <div className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">{sub}</div>
    </div>
  );
}

/**
 * クイックコマンドアイテム
 */
function QuickCmdItem({ icon, cmd, desc, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className="w-full p-6 md:p-8 hover:bg-cyan-500/10 rounded-[2.5rem] flex items-center justify-between group transition-all duration-500 active:scale-95 border border-transparent hover:border-cyan-500/20 shadow-lg"
    >
      <div className="flex items-center gap-8">
        <div className="p-4 bg-cyan-900/20 rounded-2xl text-cyan-500 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl">
          {icon}
        </div>
        <div className="flex flex-col items-start gap-1">
          <span className="text-cyan-200 font-black font-mono text-lg group-hover:text-white transition-colors tracking-[0.15em] uppercase italic">
            {cmd}
          </span>
          <span className="text-[11px] text-gray-600 group-hover:text-cyan-700 transition-colors uppercase font-black tracking-widest italic opacity-60 group-hover:opacity-100">
            {desc}
          </span>
        </div>
      </div>
      <ChevronRight size={28} className="text-cyan-900 group-hover:text-cyan-400 transition-all duration-500 group-hover:translate-x-3" />
    </button>
  );
}

/**
 * モーダル用ミニゲージ
 */
function MiniGauge({ label, value, progress, color = COLORS.cyan }: any) {
  return (
    <div className="space-y-2">
       <div className="flex justify-between items-end px-1">
          <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic">{label}</span>
          <span className="text-sm font-black text-white italic">{value}</span>
       </div>
       <div className="h-2 bg-black rounded-full overflow-hidden shadow-inner border border-white/5">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${progress}%` }} 
            transition={{ duration: 2, ease: "circOut" }}
            className="h-full shadow-[0_0_15px_currentColor]" 
            style={{ backgroundColor: color }} 
          />
       </div>
    </div>
  );
}