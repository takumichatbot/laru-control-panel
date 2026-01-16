'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ==============================================================================
 * LARU NEXUS FRONTEND v30.0 [CLINE_SILENT_MODE]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito
 * FEATURES:
 * - 完全静音（No SFX）
 * - 実行中は無言、完了報告のみ音声あり
 * - Cline Style Log (Thinking / Command / Output)
 * ==============================================================================
 */

// --- Types ---
// ログの種類を細分化して色分けに対応
interface ProjectIssue { id: string; level: 'CRITICAL' | 'WARN' | 'INFO'; title: string; description: string; }
interface ProjectProposal { id: string; type: 'OPTIMIZATION' | 'SECURITY' | 'FEATURE'; title: string; impact: string; cost: string; }
interface ProjectData { 
  id: string; name: string; repoName: string; url: string; 
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE' | 'WAITING'; 
  latency: number; region: string; version: string; lastDeploy: string; 
  stats: { cpu: number; memory: number; requests: number; errors: number; }; 
  issues: ProjectIssue[]; proposals: ProjectProposal[]; 
}
interface LogEntry { 
  id: string; 
  msg: string; 
  type: 'user' | 'ai' | 'thinking' | 'command' | 'output' | 'error' | 'question' | 'checkpoint'; 
  imageUrl?: string; 
  time: string; 
}
interface RoadmapItem { 
  id: string; category: 'AI' | 'INFRA' | 'UX' | 'SECURITY'; name: string; desc: string; benefits: string;
  status: 'PENDING' | 'DEVELOPING' | 'ACTIVE'; 
}

export default function LaruNexusV30() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CORE' | 'ROADMAP'>('DASHBOARD');
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapItem | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);
  
  // --- AI Personality Settings ---
  const [showSettings, setShowSettings] = useState(false);
  const [aiGender, setAiGender] = useState<'male' | 'female'>('female');
  const [aiPersona, setAiPersona] = useState<string>('あなたは高度な自律型エンジニアAIです。ユーザーの指示に対し、Thinking(思考)、Command(実行)、Response(回答)を使い分けて応答してください。');

  // --- 実プロジェクト資産データ (既存データの維持) ---
  const initialProjects: Record<string, ProjectData> = {
    laru_nexus: { 
      id: 'laru_nexus', name: 'LaruNEXUS', repoName: 'laru_nexus_core', url: 'nexus.larubot.com', status: 'WAITING', latency: 0, region: 'Tokyo (Render)', version: 'v30.0', lastDeploy: '2026-01-16 21:00',
      stats: { cpu: 15, memory: 55, requests: 300, errors: 0 }, issues: [],
      proposals: [{ id: 'p_ln_1', type: 'FEATURE', title: '脳波コントロール連携の実装', impact: '操作性革命', cost: 'High' }]
    },
    larubot: { 
      id: 'larubot', name: 'LARUBOT-AI', repoName: 'larubot_core', url: 'larubot.com', status: 'WAITING', latency: 0, region: 'Tokyo (AWS)', version: 'v4.2.0', lastDeploy: '2026-01-15 22:00',
      stats: { cpu: 12, memory: 45, requests: 1205, errors: 0 }, issues: [],
      proposals: [{ id: 'p_lb_1', type: 'FEATURE', title: '自律学習サイクルの強化', impact: '精度向上', cost: 'High' }]
    },
    flastal: { 
      id: 'flastal', name: 'FLASTAL.NET', repoName: 'flastal_net', url: 'flastal.net', status: 'WAITING', latency: 0, region: 'Frankfurt', version: 'v1.8.0', lastDeploy: '2026-01-16 02:15',
      stats: { cpu: 35, memory: 68, requests: 4500, errors: 2 },
      issues: [{ id: 'i_fl_1', level: 'WARN', title: 'DB接続数警告', description: 'ピーク時80%到達' }],
      proposals: [{ id: 'p_fl_2', type: 'OPTIMIZATION', title: 'DB水平分割', impact: '接続数10x', cost: 'High' }]
    },
    laruvisona: { 
      id: 'laruvisona', name: 'LARUVISONA', repoName: 'laruvisona_app', url: 'laruvisona.net', status: 'WAITING', latency: 0, region: 'Oregon', version: 'v2.1.5', lastDeploy: '2026-01-10 10:30',
      stats: { cpu: 8, memory: 22, requests: 890, errors: 0 },
      issues: [],
      proposals: []
    },
  };

  const [projects, setProjects] = useState<Record<string, ProjectData>>(initialProjects);
  
  const strategicRoadmap: RoadmapItem[] = [
    { id: 'rm_1', category: 'AI', name: '完全自律コード修正', desc: 'エラーログを読み取りGitへ自動PR作成', benefits: 'デバッグ工数ゼロ', status: 'DEVELOPING' },
    { id: 'rm_2', category: 'INFRA', name: 'マルチクラウド・フェイルオーバー', desc: 'AWS/GCP/Azure間の自動避難', benefits: '稼働率100%', status: 'PENDING' },
    { id: 'rm_3', category: 'UX', name: '脳波コントロール連携', desc: 'Neuralink経由での思考コマンド入力', benefits: '究極のBCI', status: 'ACTIVE' },
    { id: 'rm_4', category: 'SECURITY', name: '量子暗号通信プロトコル', desc: '理論上解読不可能な通信網', benefits: '完全な機密性', status: 'PENDING' },
    { id: 'rm_5', category: 'AI', name: '社長人格デジタルツイン', desc: '不在時の自動決裁AI', benefits: '24時間経営', status: 'PENDING' },
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Voice Synthesis (完了時のみ) ---
  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.2; 
    utterance.pitch = aiGender === 'male' ? 0.9 : 1.1; 

    // Googleの日本語音声があれば優先
    const voices = window.speechSynthesis.getVoices();
    const jpVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ja')) || voices.find(v => v.lang.includes('ja'));
    if (jpVoice) utterance.voice = jpVoice;

    window.speechSynthesis.speak(utterance);
  };

  // --- Log System ---
  const addLog = useCallback((msg: string, type: LogEntry['type'], imageUrl?: string) => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [...prev.slice(-99), { id, msg, type, imageUrl, time }]);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs, isProcessing]);

  // --- Initialize & Persistence ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('laru_nexus_v30_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setAiGender(settings.gender || 'female');
          setAiPersona(settings.persona || aiPersona);
        } catch(e){}
      }
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('laru_nexus_v30_settings', JSON.stringify({ gender: aiGender, persona: aiPersona }));
    }
  }, [aiGender, aiPersona]);

  // --- Realtime Monitoring (Mock Ping) ---
  useEffect(() => {
    const interval = setInterval(async () => {
      setProjects(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          next[k].latency = Math.max(10, next[k].latency + (Math.random() * 10 - 5));
          next[k].stats.cpu = Math.max(0, Math.min(100, next[k].stats.cpu + (Math.random() * 4 - 2)));
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- Main Logic ---
  const sendToGemini = async (text?: string) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || isProcessing) return;

    setInputMessage('');
    setIsProcessing(true);
    
    // 1. ユーザー入力表示
    addLog(messageToSend, 'user');

    // 2. 思考中表示 (Cline風)
    addLog("Thinking: 解析中...", 'thinking');

    try {
      const res = await fetch(`/api/gemini?v=30.0&t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
        cache: 'no-store'
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.details || "API Error");

      // 3. ツール実行があった場合の表示
      if (data.functionCalls && data.functionCalls.length > 0) {
        data.functionCalls.forEach((call: any) => {
          const args = JSON.stringify(call.args).replace(/"/g, '');
          addLog(`Command: ${call.name}(${args})`, 'command');
        });
      }

      // 4. 実行結果があった場合の表示
      if (data.executionResults && data.executionResults.length > 0) {
        data.executionResults.forEach((res: any) => {
          const resultMsg = res.functionResponse.response.message || JSON.stringify(res.functionResponse.response);
          const status = res.functionResponse.response.status === 'success' ? '✔' : '✖';
          addLog(`Output [${status}]: ${resultMsg}`, res.functionResponse.response.status === 'success' ? 'output' : 'error');
        });
      }

      // 5. 最終回答（音声あり）
      if (data.text) {
        addLog(data.text, 'ai');
        speak(data.text); // ★ここで初めて喋る
      }

    } catch (error: any) {
      addLog(`Error: ${error.message}`, 'error');
      speak("システムエラーが発生しました。");
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    // スマホ対応: 音声コンテキストのアンロック（無音再生）
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const dummy = new SpeechSynthesisUtterance('');
        dummy.volume = 0; 
        window.speechSynthesis.speak(dummy);
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("このブラウザは音声入力に対応していません", 'error');
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false; 
    recognition.continuous = false;
    
    recognition.onstart = () => {
      setIsLive(true);
      setIsProcessing(true); // 録音中は処理中扱い
    };
    recognition.onend = () => {
      setIsLive(false);
      setIsProcessing(false);
    };
    
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) sendToGemini(transcript);
    };
    
    try { recognition.start(); } catch (e) { addLog("マイク起動失敗", 'error'); }
  };

  const handleTabChange = (tab: any) => setActiveTab(tab);
  const handleRoadmapClick = (item: RoadmapItem) => setSelectedRoadmap(item);
  const handleRefresh = () => typeof window !== 'undefined' && window.location.reload();
  const handleClearLogs = () => { setLogs([]); addLog("ログをクリアしました", 'ai'); };

  // --- Beautiful Low-Poly Face (SVG) ---
  const LowPolyFace = ({ gender, active, level }: { gender: 'male' | 'female', active: boolean, level: number }) => {
    const color = active ? "var(--neon-red)" : "var(--neon-blue)";
    const opacity = active ? 1 : 0.6;

    if (gender === 'male') {
      return (
        <svg width="100" height="120" viewBox="0 0 100 120" fill="none" stroke={color} strokeWidth="1" style={{ transition: '0.2s', filter: 'drop-shadow(0 0 5px rgba(0,242,255,0.3))' }}>
          <path d="M20,30 L50,10 L80,30 L85,60 L70,100 L30,100 L15,60 L20,30 Z" opacity={opacity} />
          <path d="M20,30 L50,40 L80,30 M50,10 L50,40" opacity="0.5" />
          <path d="M15,60 L30,50 L50,60 L70,50 L85,60" />
          <path d="M30,50 L20,30 M70,50 L80,30" opacity="0.5" />
          <path d="M25,45 L35,40 L45,45 L35,50 Z" fill={active ? "rgba(255,0,64,0.1)" : "rgba(0,242,255,0.1)"} />
          <path d="M55,45 L65,40 L75,45 L65,50 Z" fill={active ? "rgba(255,0,64,0.1)" : "rgba(0,242,255,0.1)"} />
          <path d="M50,40 L45,65 L50,75 L55,65 Z" />
          <path d="M30,100 L50,90 L70,100" opacity="0.5" />
        </svg>
      );
    } else {
      return (
        <svg width="100" height="120" viewBox="0 0 100 120" fill="none" stroke={color} strokeWidth="1" style={{ transition: '0.2s', filter: 'drop-shadow(0 0 5px rgba(0,242,255,0.3))' }}>
          <path d="M15,30 L50,5 L85,30 L90,55 L50,110 L10,55 L15,30 Z" opacity={opacity} />
          <path d="M15,30 L50,35 L85,30 M50,5 L50,35" opacity="0.5" />
          <path d="M10,55 L30,50 L50,60 L70,50 L90,55" />
          <path d="M20,45 L35,38 L50,45 L35,52 Z" fill={active ? "rgba(255,0,64,0.1)" : "rgba(0,242,255,0.1)"} />
          <path d="M50,45 L65,38 L80,45 L65,52 Z" fill={active ? "rgba(255,0,64,0.1)" : "rgba(0,242,255,0.1)"} />
          <path d="M50,35 L46,65 L50,70 L54,65 Z" />
          <path d="M35,90 L50,110 L65,90" opacity="0.5" />
        </svg>
      );
    }
  };

  return (
    <div className="nexus-container">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Noto+Sans+JP:wght@300;400;700&display=swap');
        :root { 
          --bg: #0d1117; /* GitHub Dark Dimmed風 */
          --fg: #c9d1d9;
          --accent: #58a6ff; 
          --success: #3fb950;
          --error: #f85149;
          --thinking: #8b949e;
          --command: #d29922;
          --neon-blue: #00f2ff;
          --neon-red: #ff0040;
          --neon-green: #39ff14;
          --neon-yellow: #ffea00;
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body, html { height: 100dvh; margin: 0; background: var(--bg); color: var(--fg); font-family: 'JetBrains Mono', 'Noto Sans JP', sans-serif; overflow: hidden; }
        
        .nexus-container { display: flex; flex-direction: column; height: 100%; width: 100%; position: relative; }
        
        /* Header */
        .header { height: 50px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #30363d; background: #161b22; z-index: 10; font-weight: bold; letter-spacing: 1px; color: var(--accent); }

        /* Log Area */
        .log-area { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
        
        /* Chat Bubbles (Cline Style) */
        .bubble { padding: 10px 14px; border-radius: 6px; font-size: 13px; line-height: 1.6; max-width: 95%; word-break: break-all; animation: fadeIn 0.2s; }
        
        .type-user { align-self: flex-end; background: #1f6feb; color: #fff; border-radius: 12px 12px 0 12px; }
        .type-ai { align-self: flex-start; background: #161b22; border: 1px solid #30363d; border-radius: 12px 12px 12px 0; }
        
        /* System Logs */
        .type-thinking { align-self: flex-start; color: var(--thinking); font-style: italic; border-left: 2px solid var(--thinking); padding-left: 10px; font-size: 12px; }
        .type-command { align-self: flex-start; color: var(--command); background: rgba(210, 153, 34, 0.1); border: 1px solid rgba(210, 153, 34, 0.3); font-family: monospace; }
        .type-output { align-self: flex-start; color: var(--success); background: rgba(63, 185, 80, 0.1); border: 1px solid rgba(63, 185, 80, 0.3); }
        .type-error { align-self: center; color: var(--error); background: rgba(248, 81, 73, 0.1); border: 1px solid var(--error); font-weight: bold; }
        .type-question { align-self: flex-start; color: var(--accent); border: 1px solid var(--accent); font-weight: bold; background: rgba(88, 166, 255, 0.1); }

        /* Input Area */
        .input-area { padding: 12px; background: #161b22; border-top: 1px solid #30363d; display: flex; gap: 10px; align-items: center; }
        .mic-btn { 
          width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--accent); background: rgba(88, 166, 255, 0.1); 
          color: var(--accent); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;
        }
        .mic-btn:active { transform: scale(0.9); background: rgba(88, 166, 255, 0.3); }
        .mic-btn.active { background: var(--error); border-color: var(--error); color: #fff; animation: pulse 1.5s infinite; }
        
        .text-input { 
          flex: 1; height: 44px; background: #0d1117; border: 1px solid #30363d; color: #fff; 
          border-radius: 22px; padding: 0 20px; font-size: 14px; outline: none; transition: 0.2s;
        }
        .text-input:focus { border-color: var(--accent); }

        /* Tab Navigation */
        .nav-tabs { display: flex; background: #000; border-bottom: 1px solid #222; z-index: 50; }
        .nav-btn { flex: 1; padding: 12px 0; background: none; border: none; color: #666; font-size: 10px; font-weight: bold; cursor: pointer; transition: 0.3s; }
        .nav-btn.active { color: var(--neon-blue); border-bottom: 2px solid var(--neon-blue); }

        /* Panels */
        .panel { display: none; flex-direction: column; width: 100%; height: 100%; overflow-y: auto; padding: 16px; gap: 16px; }
        .panel.active { display: flex; }

        /* Project Card */
        .project-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; cursor: pointer; transition: 0.2s; }
        .project-card:active { transform: scale(0.98); background: rgba(0,242,255,0.05); border-color: var(--neon-blue); }
        
        /* Overlay */
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s; }
        .detail-panel { width: 100%; max-width: 600px; max-height: 85vh; background: #111; border: 1px solid var(--neon-blue); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
        .detail-header { padding: 16px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; background: rgba(0,242,255,0.05); }
        .detail-content { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(248, 81, 73, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(248, 81, 73, 0); } 100% { box-shadow: 0 0 0 0 rgba(248, 81, 73, 0); } }
      `}</style>

      {/* HEADER */}
      <div className="header">
        <div>LARU NEXUS v30.0</div>
        <div style={{ position: 'absolute', right: '15px', display: 'flex', gap: '15px' }}>
          <button onClick={handleRefresh} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>🔄</button>
          <button onClick={handleClearLogs} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>🗑️</button>
          <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>⚙️</button>
        </div>
      </div>

      {/* TABS */}
      <nav className="nav-tabs">
        <button className={`nav-btn ${activeTab === 'DASHBOARD' ? 'active' : ''}`} onClick={() => setActiveTab('DASHBOARD')}>DASHBOARD</button>
        <button className={`nav-btn ${activeTab === 'CORE' ? 'active' : ''}`} onClick={() => setActiveTab('CORE')}>COMMAND</button>
        <button className={`nav-btn ${activeTab === 'ROADMAP' ? 'active' : ''}`} onClick={() => setActiveTab('ROADMAP')}>ROADMAP</button>
      </nav>

      {/* DASHBOARD PANEL */}
      <div className={`panel ${activeTab === 'DASHBOARD' ? 'active' : ''}`}>
        <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>// ACTIVE_PROJECTS_MONITOR</div>
        {Object.values(projects).map(p => (
          <div key={p.id} className="project-card" onClick={() => setSelectedProject(p)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--neon-blue)' }}>{p.name}</div>
              <div className="status-badge" style={{ color: p.status === 'ONLINE' ? 'var(--neon-green)' : '#666' }}>{p.status}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '11px', color: '#aaa', marginTop: '5px' }}>
              <div>Region: {p.region}</div>
              <div>Latency: <span style={{ color: p.latency > 500 ? 'var(--neon-red)' : '#fff' }}>{p.latency}ms</span></div>
            </div>
            <div style={{ marginTop: '5px', height: '3px', background: '#333' }}>
              <div style={{ width: `${Math.min(100, p.latency / 10)}%`, height: '100%', background: p.latency > 500 ? 'var(--neon-red)' : 'var(--neon-blue)', transition: '0.5s' }} />
            </div>
          </div>
        ))}
      </div>

      {/* CORE PANEL (CLINE UI) */}
      <div className={`panel ${activeTab === 'CORE' ? 'active' : ''}`} style={{ padding: 0 }}>
        {/* Face HUD */}
        <section style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid #30363d', background: '#0d1117' }}>
          <div className="voice-hud" onClick={startListening}>
            <div className="face-container">
              <LowPolyFace gender={aiGender} active={isLive} level={audioLevel} />
            </div>
          </div>
          <div style={{ fontSize: '10px', marginTop: '10px', color: isLive ? 'var(--neon-red)' : '#666' }}>{isLive ? 'LISTENING...' : 'READY'}</div>
        </section>

        {/* Logs */}
        <div className="log-area">
          {logs.map((log) => (
            <div key={log.id} className={`bubble type-${log.type}`}>
              {log.type === 'command' && <span style={{opacity:0.7, fontSize:'10px', display:'block', marginBottom:'2px'}}>COMMAND &gt;_</span>}
              {log.type === 'thinking' && <span style={{opacity:0.7, fontSize:'10px', display:'block', marginBottom:'2px'}}>THINKING...</span>}
              {log.imageUrl && <img src={log.imageUrl} alt="Captured" style={{ width: '100%', borderRadius: '8px', marginBottom: '8px', border: '1px solid #333' }} />}
              {log.msg}
            </div>
          ))}
          {isProcessing && logs.length === 0 && <div className="bubble type-thinking">Thinking...</div>}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          <input 
            className="text-input" 
            placeholder="Command..." 
            value={inputMessage} 
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendToGemini(); }}
          />
          <button className={`mic-btn ${isProcessing ? 'active' : ''}`} onClick={startListening}>
            🎤
          </button>
        </div>
      </div>

      {/* ROADMAP PANEL */}
      <div className={`panel ${activeTab === 'ROADMAP' ? 'active' : ''}`}>
        <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>// STRATEGIC_INITIATIVES_2026</div>
        {strategicRoadmap.map(item => (
          <div key={item.id} className="roadmap-item" style={{display:'flex', alignItems:'flex-start', gap:'10px', padding:'12px', borderBottom:'1px solid #222'}} onClick={() => setSelectedRoadmap(item)}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', background: item.status === 'ACTIVE' ? 'var(--neon-blue)' : '#444' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{item.name}</div>
              <div style={{ fontSize: '10px', color: '#888' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* DETAIL OVERLAY */}
      {selectedProject && (
        <div className="overlay" onClick={() => setSelectedProject(null)}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--neon-blue)' }}>{selectedProject.name}</div>
                <div style={{ fontSize: '10px', color: '#888' }}>{selectedProject.url}</div>
              </div>
              <button onClick={() => setSelectedProject(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>×</button>
            </div>
            <div className="detail-content">
              <div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>OPTIMIZATION PROPOSALS</div>
                {selectedProject.proposals.map(prop => (
                  <div key={prop.id} style={{border:'1px dashed var(--neon-blue)', padding:'12px', borderRadius:'6px', marginBottom:'10px'}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--neon-blue)' }}>{prop.title}</span>
                      <span style={{ fontSize: '9px', border: '1px solid #444', padding: '2px 4px', borderRadius: '3px' }}>{prop.type}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>Impact: {prop.impact}</div>
                    <button style={{width:'100%', background:'var(--neon-blue)', color:'#000', border:'none', padding:'10px', fontWeight:'bold', borderRadius:'4px', marginTop:'5px', cursor:'pointer'}} onClick={() => {
                      setSelectedProject(null); setActiveTab('CORE'); sendToGemini(`提案実行: ${selectedProject.name} の「${prop.title}」を実行せよ。`);
                    }}>EXECUTE</button>
                  </div>
                ))}
              </div>
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
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>×</button>
            </div>
            <div className="detail-content">
              <div className="settings-group">
                <span className="settings-label">VOICE GENDER / APPEARANCE</span>
                <div className="toggle-row">
                  <button className={`toggle-btn ${aiGender === 'male' ? 'active' : ''}`} onClick={() => setAiGender('male')}>MALE</button>
                  <button className={`toggle-btn ${aiGender === 'female' ? 'active' : ''}`} onClick={() => setAiGender('female')}>FEMALE</button>
                </div>
              </div>
              <div className="settings-group">
                <span className="settings-label">PERSONA DEFINITION</span>
                <textarea className="persona-input" value={aiPersona} onChange={(e) => setAiPersona(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}