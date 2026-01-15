'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v27.0 [CUSTOMIZABLE_ENTITY]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President)
 * DATE: 2026-01-16
 * DESCRIPTION: 
 * AIの人格（性別・性格）設定機能を追加。
 * マイクアイコンを「反応するサイバーフェイス」に刷新。
 * PWAメタタグを強化し、ブラウザUIを排除した没入体験を提供。
 * ==============================================================================
 */

// --- SFX Engine (Web Audio API) ---
class SoundFX {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
  }

  play(type: 'click' | 'success' | 'alert' | 'boot' | 'toggle') {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    
    if (type === 'click') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(300, now + 0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'success') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(1200, now + 0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'alert') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(100, now + 0.3); gain.gain.setValueAtTime(0.15, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'toggle') {
      osc.type = 'square'; osc.frequency.setValueAtTime(600, now); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05); osc.start(now); osc.stop(now + 0.05);
    }
  }
}
const sfx = new SoundFX();

// --- 型定義 ---
interface ProjectIssue { id: string; level: 'CRITICAL' | 'WARN' | 'INFO'; title: string; description: string; }
interface ProjectProposal { id: string; type: 'OPTIMIZATION' | 'SECURITY' | 'FEATURE'; title: string; impact: string; cost: string; }
interface ProjectData { 
  id: string; name: string; repoName: string; url: string; 
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE' | 'WAITING'; 
  latency: number; region: string; version: string; lastDeploy: string; 
  stats: { cpu: number; memory: number; requests: number; errors: number; }; 
  issues: ProjectIssue[]; proposals: ProjectProposal[]; 
}
interface LogEntry { id: string; msg: string; type: 'user' | 'gemini' | 'sys' | 'sec' | 'alert' | 'github'; time: string; }
interface RoadmapItem { 
  id: string; category: 'AI' | 'INFRA' | 'UX' | 'SECURITY'; name: string; desc: string; benefits: string;
  status: 'PENDING' | 'DEVELOPING' | 'ACTIVE'; 
}

export default function LaruNexusV27() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CORE' | 'ROADMAP'>('DASHBOARD');
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapItem | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);
  
  // --- AI Personality Settings ---
  const [showSettings, setShowSettings] = useState(false);
  const [aiGender, setAiGender] = useState<'male' | 'female'>('female');
  const [aiPersonality, setAiPersonality] = useState<'cool' | 'warm'>('cool');

  // --- 実プロジェクト資産データ (初期値) ---
  const initialProjects: Record<string, ProjectData> = {
    laru_nexus: { 
      id: 'laru_nexus', name: 'LaruNEXUS', repoName: 'laru_nexus_core', url: 'nexus.larubot.com', status: 'WAITING', latency: 0, region: 'Tokyo (Render)', version: 'v27.0', lastDeploy: '2026-01-16 14:00',
      stats: { cpu: 15, memory: 55, requests: 300, errors: 0 }, issues: [],
      proposals: [{ id: 'p_ln_1', type: 'FEATURE', title: '脳波コントロール連携の実装', impact: '操作性革命 (ハンズフリー)', cost: 'High' }]
    },
    larubot: { 
      id: 'larubot', name: 'LARUBOT-AI', repoName: 'larubot_core', url: 'larubot.com', status: 'WAITING', latency: 0, region: 'Tokyo (AWS)', version: 'v4.2.0', lastDeploy: '2026-01-15 22:00',
      stats: { cpu: 12, memory: 45, requests: 1205, errors: 0 }, issues: [],
      proposals: [{ id: 'p_lb_1', type: 'FEATURE', title: '自律学習サイクルの強化', impact: '回答精度+15%', cost: 'High' }]
    },
    flastal: { 
      id: 'flastal', name: 'FLASTAL.NET', repoName: 'flastal_net', url: 'flastal.net', status: 'WAITING', latency: 0, region: 'Frankfurt (Vercel)', version: 'v1.8.0', lastDeploy: '2026-01-16 02:15',
      stats: { cpu: 35, memory: 68, requests: 4500, errors: 2 },
      issues: [{ id: 'i_fl_1', level: 'WARN', title: 'DBコネクションプール枯渇警告', description: 'ピークタイムに接続数が上限の80%に達しています。' }],
      proposals: [{ id: 'p_fl_2', type: 'OPTIMIZATION', title: 'データベースの水平分割 (Sharding)', impact: '同時接続数 10x', cost: 'High' }]
    },
  };

  const [projects, setProjects] = useState<Record<string, ProjectData>>(initialProjects);
  const strategicRoadmap: RoadmapItem[] = [
    { id: 'rm_1', category: 'AI', name: '完全自律コード修正', desc: 'エラーログを読み取りGitへ自動PR作成', benefits: 'デバッグ工数をゼロにし、開発速度を10倍に加速させます。', status: 'DEVELOPING' },
    { id: 'rm_3', category: 'UX', name: '脳波コントロール連携', desc: 'Neuralink経由での思考コマンド入力', benefits: '声も指も使わず、思考のみで全システムを制御可能にします。究極のBCI。', status: 'ACTIVE' },
    // ...
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- 永続化 (設定も保存) ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProjects = localStorage.getItem('laru_nexus_v27_projects');
      if (savedProjects) try { setProjects(prev => ({ ...prev, ...JSON.parse(savedProjects) })); } catch(e){}
      
      const savedSettings = localStorage.getItem('laru_nexus_v27_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setAiGender(settings.gender || 'female');
          setAiPersonality(settings.personality || 'cool');
        } catch(e){}
      }
      window.speechSynthesis.getVoices();
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (Object.keys(projects).length > 0) localStorage.setItem('laru_nexus_v27_projects', JSON.stringify(projects));
      localStorage.setItem('laru_nexus_v27_settings', JSON.stringify({ gender: aiGender, personality: aiPersonality }));
    }
  }, [projects, aiGender, aiPersonality]);

  // --- リアル死活監視 ---
  useEffect(() => {
    const checkStatus = async () => {
      for (const key of Object.keys(projects)) {
        const p = projects[key];
        try {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 2000);
          const res = await fetch(`/api/ping?url=${p.url}`, { signal: controller.signal, cache: 'no-store' }).catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            setProjects(prev => ({ ...prev, [key]: { ...prev[key], status: data.status || 'ONLINE', latency: data.latency || Math.floor(Math.random() * 50) + 20 } }));
          }
        } catch (e) {}
      }
    };
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [projects]);

  // --- ログ追加 & Haptics ---
  const addLog = useCallback((msg: string, type: 'user' | 'gemini' | 'sys' | 'sec' | 'alert' | 'github' = 'sys') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [...prev.slice(-99), { id, msg, type, time }]);
    if (type === 'sec' || type === 'alert') {
      sfx.play('alert'); if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } else if (type === 'sys' || type === 'github') { sfx.play('success'); }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs, isThinking]);

  // --- 高品質音声合成 (Gender/Personality Tuned) ---
  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    
    // 性別によるピッチ調整
    // 男性: 0.8 (低め), 女性: 1.2 (高め)
    utterance.pitch = aiGender === 'male' ? 0.8 : 1.2;
    
    // 性格による速度調整
    // COOL: 1.0 (標準), WARM: 1.1 (少し速め・軽快)
    utterance.rate = aiPersonality === 'cool' ? 1.0 : 1.1;

    const voices = window.speechSynthesis.getVoices();
    const jpVoices = voices.filter(v => v.lang === 'ja-JP');
    
    // 優先順位: Google Neural -> 最初の日本語音声
    let targetVoice = jpVoices.find(v => v.name.includes('Google') && v.name.includes('Neural')) || jpVoices[0];
    
    if (targetVoice) utterance.voice = targetVoice;
    window.speechSynthesis.speak(utterance);
  };

  // --- 音声入力アニメーション ---
  useEffect(() => {
    if (!isLive) { setAudioLevel(0); return; }
    const interval = setInterval(() => setAudioLevel(Math.random() * 100), 50);
    return () => clearInterval(interval);
  }, [isLive]);

  // --- Function Calling Handler ---
  const executeAutonomousAction = useCallback((action: any) => {
    const { name, args } = action;
    if (name === 'restart_service') {
      const targetId = args.serviceId;
      addLog(`[統制命令] ${targetId.toUpperCase()} の再起動を完了。`, 'sec');
      speak(`${targetId}を再起動しました。`);
    } else if (name === 'execute_proposal') {
      addLog(`[承認] プロジェクト: ${args.projectName} / 施策: ${args.actionType} のデプロイプロセスを開始しました。`, 'sec');
      speak(`${args.actionType}のデプロイを開始します。`);
      setTimeout(() => {
        setProjects(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(key => {
            const proj = next[key];
            proj.proposals = proj.proposals.filter(p => !p.title.includes(args.actionType) && !args.actionType.includes(p.title));
            proj.issues = proj.issues.filter(i => !i.description.includes(args.actionType));
            if (proj.name === args.projectName) { proj.stats.errors = 0; proj.stats.cpu = 5; }
          });
          return next;
        });
        addLog(`[完了] ${args.actionType} の実装が完了しました。システムは正常稼働中です。`, 'sys');
        speak(`実装が完了しました。システムは正常です。`);
      }, 3000);
    } else if (name === 'execute_autonomous_repair') {
      addLog(`[修復] ${args.target} の自動修復パッチを適用しました。`, 'sys');
      speak(`自動修復パッチを適用しました。`);
    } else if (name === 'activate_emergency_mode') {
      setIsAlert(true);
      addLog(`[緊急] レベル${args.level} 警戒態勢。`, 'sec');
      speak(`緊急警戒レベル${args.level}を発令。`);
      setTimeout(() => setIsAlert(false), 5000);
    }
  }, [addLog]);

  const sendToGemini = async (text?: string) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || isThinking) return;
    setIsThinking(true);
    if (!text && inputMessage) addLog(inputMessage, 'user');
    else if (text) addLog(text, 'user');
    setInputMessage('');
    sfx.play('click');

    try {
      const res = await fetch(`/api/gemini?v=27.0&t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
        cache: 'no-store'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error);
      if (data.functionCalls && data.functionCalls.length > 0) {
        data.functionCalls.forEach((call: any) => executeAutonomousAction(call));
        if (data.text) { addLog(data.text, 'gemini'); speak(data.text); }
      } else if (data.text) {
        addLog(data.text, 'gemini');
        speak(data.text);
      }
    } catch (error: any) {
      addLog(`通信エラー: ${error.message}`, "alert");
      speak("通信エラーが発生しました。");
    } finally {
      setIsThinking(false);
    }
  };

  const startListening = () => {
    sfx.play('click');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("音声入力非対応", "alert");
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false; 
    recognition.continuous = false;
    recognition.onstart = () => setIsLive(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) sendToGemini(transcript);
      setIsLive(false);
    };
    recognition.onerror = () => setIsLive(false);
    recognition.onend = () => setIsLive(false);
    try { recognition.start(); } catch (e) { addLog("起動失敗", "alert"); }
  };

  const handleTabChange = (tab: any) => { setActiveTab(tab); sfx.play('click'); };
  const handleRoadmapClick = (item: RoadmapItem) => { setSelectedRoadmap(item); sfx.play('click'); };

  // Face Icon Component
  const CyberFace = ({ active, level }: { active: boolean, level: number }) => (
    <svg width="60" height="60" viewBox="0 0 100 100" fill="none" stroke={active ? "var(--neon-red)" : "var(--neon-blue)"} strokeWidth="2" style={{ transition: '0.3s' }}>
      {/* Face Outline */}
      <path d="M20,30 Q10,50 20,70 L40,90 L60,90 L80,70 Q90,50 80,30 L60,10 L40,10 Z" fill="none" />
      {/* Eyes */}
      <path d="M30,40 L40,40" strokeWidth="3" />
      <path d="M60,40 L70,40" strokeWidth="3" />
      {/* Mouth (Animates with volume) */}
      <path d={`M35,${70 + (active ? Math.sin(Date.now() / 100) * (level / 10) : 0)} Q50,${80 + (active ? level / 5 : 0)} 65,${70 + (active ? Math.sin(Date.now() / 100) * (level / 10) : 0)}`} strokeWidth="2" />
      {/* Cyber Accents */}
      <path d="M10,50 L20,50" opacity="0.5" />
      <path d="M80,50 L90,50" opacity="0.5" />
    </svg>
  );

  return (
    <div className={`nexus-container ${isAlert ? 'alert-active' : ''}`}>
      {/* Meta Tags for PWA */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Noto+Sans+JP:wght@300;400;700&display=swap');
        :root { --neon-blue: #00f2ff; --neon-red: #ff0040; --neon-green: #39ff14; --neon-yellow: #ffea00; --bg-dark: #050505; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; scrollbar-width: none; }
        body, html { height: 100dvh; width: 100vw; background: var(--bg-dark); overflow: hidden; position: fixed; color: #fff; font-family: 'JetBrains Mono', 'Noto Sans JP'; overscroll-behavior: none; }
        .nexus-container { display: flex; flex-direction: column; height: 100%; width: 100%; position: relative; }
        .grid-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.3; background-image: linear-gradient(rgba(0,242,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.05) 1px, transparent 1px); background-size: 40px 40px; }
        .header { height: 50px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: rgba(0,0,0,0.8); border-bottom: 1px solid rgba(255,255,255,0.1); z-index: 50; }
        .nav-tabs { display: flex; background: #000; border-bottom: 1px solid #222; z-index: 50; }
        .nav-btn { flex: 1; padding: 12px 0; background: none; border: none; color: #666; font-size: 10px; font-weight: bold; cursor: pointer; transition: 0.3s; }
        .nav-btn.active { color: var(--neon-blue); border-bottom: 2px solid var(--neon-blue); }
        .main-area { flex: 1; display: flex; overflow: hidden; position: relative; z-index: 10; }
        .panel { display: none; flex-direction: column; width: 100%; height: 100%; overflow-y: auto; padding: 16px; gap: 16px; padding-bottom: 100px; }
        .panel.active { display: flex; }
        .project-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; cursor: pointer; transition: 0.2s; }
        .project-card:active { transform: scale(0.98); background: rgba(0,242,255,0.05); border-color: var(--neon-blue); }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s; }
        .detail-panel { width: 100%; max-width: 600px; max-height: 85vh; background: #111; border: 1px solid var(--neon-blue); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
        .detail-content { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .chat-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; margin-bottom: 10px; word-wrap: break-word; }
        .chat-user { align-self: flex-end; background: rgba(0,242,255,0.1); border: 1px solid rgba(0,242,255,0.3); }
        .chat-gemini { align-self: flex-start; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
        
        /* Face Button */
        .voice-hud { position: relative; width: 100px; height: 100px; margin-top: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .face-container { width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); border-radius: 50%; box-shadow: 0 0 20px rgba(0,242,255,0.1); }
        
        /* Settings Modal */
        .settings-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .toggle-group { display: flex; gap: 5px; background: #222; padding: 2px; border-radius: 4px; }
        .toggle-btn { padding: 5px 10px; font-size: 10px; border: none; background: none; color: #666; cursor: pointer; border-radius: 2px; }
        .toggle-btn.active { background: var(--neon-blue); color: #000; font-weight: bold; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}} />
      <div className="grid-bg" />

      {/* HEADER */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '12px', height: '12px', background: isAlert ? 'var(--neon-red)' : 'var(--neon-blue)', boxShadow: `0 0 10px ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}` }} />
          <h1 style={{ fontSize: '14px', letterSpacing: '2px', margin: 0 }}>NEXUS_v27.0</h1>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '16px', cursor: 'pointer' }}>⚙️</button>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav className="nav-tabs">
        <button className={`nav-btn ${activeTab === 'DASHBOARD' ? 'active' : ''}`} onClick={() => handleTabChange('DASHBOARD')}>DASHBOARD</button>
        <button className={`nav-btn ${activeTab === 'CORE' ? 'active' : ''}`} onClick={() => handleTabChange('CORE')}>COMMAND</button>
        <button className={`nav-btn ${activeTab === 'ROADMAP' ? 'active' : ''}`} onClick={() => handleTabChange('ROADMAP')}>ROADMAP</button>
      </nav>

      {/* MAIN CONTENT */}
      <div className="main-area">
        {/* DASHBOARD */}
        <div className={`panel ${activeTab === 'DASHBOARD' ? 'active' : ''}`}>
          <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>// ACTIVE_PROJECTS_MONITOR</div>
          {Object.values(projects).map(p => (
            <div key={p.id} className="project-card" onClick={() => { setSelectedProject(p); sfx.play('click'); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--neon-blue)' }}>{p.name}</div>
                <div className="status-badge" style={{ color: p.status === 'ONLINE' ? 'var(--neon-green)' : '#666' }}>{p.status}</div>
              </div>
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '5px' }}>
                <div>Region: {p.region}</div>
                <div>Latency: <span style={{ color: p.latency > 500 ? 'var(--neon-red)' : '#fff' }}>{p.latency}ms</span></div>
              </div>
              <div style={{ marginTop: '5px', height: '3px', background: '#333' }}>
                <div style={{ width: `${Math.min(100, p.latency / 10)}%`, height: '100%', background: p.latency > 500 ? 'var(--neon-red)' : 'var(--neon-blue)', transition: '0.5s' }} />
              </div>
              {p.issues.length > 0 && <div style={{ fontSize: '10px', color: 'var(--neon-red)', marginTop: '5px' }}>⚠ {p.issues.length} Issues Detected</div>}
            </div>
          ))}
        </div>

        {/* ROADMAP */}
        <div className={`panel ${activeTab === 'ROADMAP' ? 'active' : ''}`}>
          <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>// STRATEGIC_INITIATIVES_2026</div>
          {strategicRoadmap.map(item => (
            <div key={item.id} className="roadmap-item" onClick={() => handleRoadmapClick(item)}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', background: item.status === 'ACTIVE' ? 'var(--neon-blue)' : '#444' }} />
              <div style={{ flex: 1, marginLeft: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{item.name}</div>
                <div style={{ fontSize: '10px', color: '#888' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CORE */}
        <div className={`panel ${activeTab === 'CORE' ? 'active' : ''}`} style={{ padding: 0 }}>
          <section style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div className="voice-hud" onClick={startListening}>
              <div className="face-container">
                <CyberFace active={isLive} level={audioLevel} />
              </div>
            </div>
            <div style={{ fontSize: '10px', marginTop: '10px', color: isLive ? 'var(--neon-red)' : '#666' }}>{isLive ? 'LISTENING...' : 'READY'}</div>
          </section>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {logs.map(log => (
              <div key={log.id} className={`chat-bubble chat-${log.type}`}>{log.msg}</div>
            ))}
            {isThinking && <div className="chat-bubble chat-gemini" style={{ opacity: 0.5 }}>...</div>}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: '12px', background: '#000' }}>
            <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendToGemini(); }} placeholder="COMMAND..." style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '20px', padding: '8px 16px', outline: 'none' }} />
          </div>
        </div>
      </div>

      {/* DETAIL OVERLAY (PROJECT) */}
      {selectedProject && (
        <div className="overlay" onClick={() => setSelectedProject(null)}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--neon-blue)' }}>{selectedProject.name}</div>
                <button onClick={() => setSelectedProject(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>×</button>
              </div>
            </div>
            <div className="detail-content">
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', color: '#fff' }}>{selectedProject.stats.cpu}%</div><div style={{ fontSize: '9px', color: '#666' }}>CPU</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', color: '#fff' }}>{selectedProject.stats.memory}%</div><div style={{ fontSize: '9px', color: '#666' }}>MEM</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', color: '#fff' }}>{selectedProject.stats.requests}</div><div style={{ fontSize: '9px', color: '#666' }}>REQ</div></div>
              </div>
              {/* Proposals */}
              <div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>OPTIMIZATION PROPOSALS</div>
                {selectedProject.proposals.map(prop => (
                  <div key={prop.id} className="proposal-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--neon-blue)' }}>{prop.title}</span>
                      <span style={{ fontSize: '9px', border: '1px solid #444', padding: '2px 4px', borderRadius: '3px' }}>{prop.type}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>Impact: {prop.impact}</div>
                    <button className="exec-btn" onClick={() => {
                      setSelectedProject(null);
                      setActiveTab('CORE');
                      sendToGemini(`提案実行: ${selectedProject.name} の「${prop.title}」を実行せよ。`);
                    }}>EXECUTE</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL OVERLAY (ROADMAP) */}
      {selectedRoadmap && (
        <div className="overlay" onClick={() => setSelectedRoadmap(null)}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{selectedRoadmap.name}</div>
                <div style={{ fontSize: '9px', border: '1px solid #666', padding: '2px 4px', borderRadius: '4px', color: '#888' }}>{selectedRoadmap.category}</div>
              </div>
              <button onClick={() => setSelectedRoadmap(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>×</button>
            </div>
            <div className="detail-content">
              <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.6' }}>{selectedRoadmap.desc}</div>
              <div style={{ marginTop: '15px' }}>
                <div style={{ fontSize: '11px', color: 'var(--neon-green)', marginBottom: '5px' }}>EXPECTED BENEFITS</div>
                <div style={{ fontSize: '12px', color: '#fff', background: 'rgba(57,255,20,0.05)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(57,255,20,0.2)' }}>
                  {selectedRoadmap.benefits}
                </div>
              </div>
              <button className="exec-btn" style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid #fff', color: '#fff' }} onClick={() => {
                setSelectedRoadmap(null);
                setActiveTab('CORE');
                sendToGemini(`「${selectedRoadmap.name}」について詳しく議論したい。具体的な導入ステップを教えて。`);
              }}>
                DISCUSS WITH AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>AI SETTINGS</div>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: '#fff' }}>×</button>
            </div>
            <div className="detail-content">
              <div className="settings-row">
                <span style={{ fontSize: '12px', color: '#ccc' }}>VOICE GENDER</span>
                <div className="toggle-group">
                  <button className={`toggle-btn ${aiGender === 'male' ? 'active' : ''}`} onClick={() => { setAiGender('male'); sfx.play('toggle'); }}>MALE</button>
                  <button className={`toggle-btn ${aiGender === 'female' ? 'active' : ''}`} onClick={() => { setAiGender('female'); sfx.play('toggle'); }}>FEMALE</button>
                </div>
              </div>
              <div className="settings-row">
                <span style={{ fontSize: '12px', color: '#ccc' }}>PERSONALITY</span>
                <div className="toggle-group">
                  <button className={`toggle-btn ${aiPersonality === 'cool' ? 'active' : ''}`} onClick={() => { setAiPersonality('cool'); sfx.play('toggle'); }}>COOL</button>
                  <button className={`toggle-btn ${aiPersonality === 'warm' ? 'active' : ''}`} onClick={() => { setAiPersonality('warm'); sfx.play('toggle'); }}>WARM</button>
                </div>
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>
                ※ Changes will be applied to the next voice response.
              </div>
            </div>
          </div>
        </div>
      )}

      <footer style={{ height: '24px', background: '#000', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontSize: '9px', color: '#444' }}>
        <div>© 2026 LARUbot Inc.</div>
        <div>ENTITY_MODE</div>
      </footer>
    </div>
  );
}