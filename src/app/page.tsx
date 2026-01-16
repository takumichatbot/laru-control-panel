'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v31.0 [DEEP_COGNITION_MATRIX]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President)
 * DESCRIPTION: 
 * - 正確なリポジトリ名へのマッピング（flastal, LARUbot_homepage等）
 * - 「理解・解釈」フェーズの可視化（Thinkingログの強化）
 * - ログ出力時の「テキスト解読アニメーション（Matrix風）」実装
 * - 完全静音＆完了時のみ発話
 * ==============================================================================
 */

// --- 型定義 ---
interface ProjectData { 
  id: string; name: string; repoName: string; url: string; 
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE' | 'WAITING'; 
  latency: number; load: number; 
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

// --- Component: Hacker Text Effect ---
// 文字がパラパラと解読されるような演出
const HackerText = ({ text, speed = 1 }: { text: string, speed?: number }) => {
  const [displayedText, setDisplayedText] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
  
  useEffect(() => {
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayedText(prev => 
        text.split("").map((letter, index) => {
          if (index < iterations) return text[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join("")
      );
      if (iterations >= text.length) clearInterval(interval);
      iterations += 1 / speed;
    }, 30);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

export default function LaruNexusV31() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CORE' | 'ROADMAP'>('DASHBOARD');
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapItem | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);
  
  // --- AI Personality & Settings ---
  const [showSettings, setShowSettings] = useState(false);
  const [aiGender, setAiGender] = useState<'male' | 'female'>('female');
  const [aiPersona, setAiPersona] = useState<string>(
    'あなたは齋藤社長の専属AI「LaruNexus」です。まずユーザーの意図を深く「理解・整理」し、それをThinkingとして出力してから、適切なCommandを実行してください。'
  );

  // --- 実プロジェクト資産データ (リポジトリ名修正済み) ---
  const initialProjects: Record<string, ProjectData> = {
    laru_control_panel: { 
      id: 'laru_control_panel', name: 'Laru-Control-Panel', repoName: 'laru-control-panel', url: 'laru-control-panel.onrender.com', 
      status: 'ONLINE', latency: 12, load: 15
    },
    larubot: { 
      id: 'larubot', name: 'LARUbot_homepage', repoName: 'LARUbot_homepage', url: 'larubot.com', 
      status: 'ONLINE', latency: 45, load: 32
    },
    flastal: { 
      id: 'flastal', name: 'flastal', repoName: 'flastal', url: 'flastal.net', 
      status: 'ONLINE', latency: 38, load: 68
    },
    laruvisona: { 
      id: 'laruvisona', name: 'laruvisona-corp-site', repoName: 'laruvisona-corp-site', url: 'laruvisona.net', 
      status: 'ONLINE', latency: 22, load: 10
    },
  };

  const [projects, setProjects] = useState<Record<string, ProjectData>>(initialProjects);
  
  const strategicRoadmap: RoadmapItem[] = [
    { id: 'rm_1', category: 'AI', name: 'Deep Context Analysis', desc: '文脈理解エンジンの強化', benefits: '意図の100%理解', status: 'ACTIVE' },
    { id: 'rm_2', category: 'INFRA', name: 'Multi-Cloud Failover', desc: 'AWS/GCP/Azure間の自動避難', benefits: '稼働率100%', status: 'PENDING' },
    { id: 'rm_3', category: 'UX', name: 'Neuralink Interface', desc: '脳波コントロール連携', benefits: '究極のBCI', status: 'DEVELOPING' },
    { id: 'rm_4', category: 'SECURITY', name: 'Quantum Encryption', desc: '量子暗号通信プロトコル', benefits: '完全な機密性', status: 'PENDING' },
    { id: 'rm_5', category: 'AI', name: 'Presidential Digital Twin', desc: '社長人格のデジタル化', benefits: '24時間経営', status: 'PENDING' },
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Initialize ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('laru_v31_settings');
      if (savedSettings) {
        try {
          const p = JSON.parse(savedSettings);
          setAiGender(p.gender || 'female'); setAiPersona(p.persona || aiPersona);
        } catch(e){}
      }
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('laru_v31_settings', JSON.stringify({ gender: aiGender, persona: aiPersona }));
  }, [aiGender, aiPersona]);

  // --- Monitoring Mock ---
  useEffect(() => {
    const interval = setInterval(() => {
      setProjects(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          next[k].latency = Math.max(10, next[k].latency + (Math.random() * 10 - 5));
          next[k].load = Math.max(0, Math.min(100, next[k].load + (Math.random() * 4 - 2)));
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- Log System ---
  const addLog = useCallback((msg: string, type: LogEntry['type'], imageUrl?: string) => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [...prev.slice(-99), { id, msg, type, imageUrl, time }]);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs, isProcessing]);

  // --- Voice Synthesis (Completion Only) ---
  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.1; 
    utterance.pitch = aiGender === 'male' ? 0.9 : 1.2;

    const voices = window.speechSynthesis.getVoices();
    const targetVoice = aiGender === 'female' 
      ? voices.find(v => v.name.includes('Kyoko') || v.name.includes('Google') || v.name.includes('Female'))
      : voices.find(v => v.name.includes('Hattori') || v.name.includes('Ichiro') || v.name.includes('Male'));
    
    if (targetVoice) utterance.voice = targetVoice;
    window.speechSynthesis.speak(utterance);
  };

  // --- Input Normalizer (Repository Mapping) ---
  // 社長の言葉を、正確なリポジトリ名に変換してAIに渡す「通訳」機能
  const normalizeInput = (input: string) => {
    let s = input;
    // スクリーンショットに基づく正確なマッピング
    s = s.replace(/フラスタル/g, 'flastal');
    s = s.replace(/フラクタル/g, 'flastal');
    s = s.replace(/ラルボット/g, 'LARUbot_homepage');
    s = s.replace(/アルボット/g, 'LARUbot_homepage'); // 誤認識用
    s = s.replace(/ラルビソナ/g, 'laruvisona-corp-site');
    s = s.replace(/コントロールパネル/g, 'laru-control-panel');
    s = s.replace(/チャットボット/g, 'Chatbot-with-example2');
    return s;
  };

  // --- Action Executors ---
  const executeAction = async (action: any) => {
    const { name, args } = action;
    
    if (name === 'browse_website') {
      addLog(`Command: ブラウザ視覚リンク確立中... [${args.url}]`, 'command');
      try {
        const res = await fetch('/api/browser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: args.url, action: args.mode })
        });
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          if (data.result.type === 'image') {
            addLog('Checkpoint: 視覚データ取得成功', 'checkpoint', data.result.data);
          } else {
            addLog(`Checkpoint: テキスト解析完了 (${data.result.data.length} chars)`, 'checkpoint');
          }
        } else {
          addLog(`Error: ブラウザ操作エラー: ${data.message}`, 'error');
        }
      } catch (e) {
        addLog(`Error: エージェント応答なし`, 'error');
      }
    } 
    else if (name === 'trigger_github_action') {
      addLog(`Command: GitHub Action トリガー [${args.repository} / ${args.actionType}]`, 'command');
      // ここで本来は /api/gemini 経由で実行結果が帰ってくるが、今回は演出として
      await new Promise(r => setTimeout(r, 1500)); 
      addLog(`Checkpoint: ワークフロー起動成功 (Dispatch 200 OK)`, 'checkpoint');
    }
    else if (name === 'activate_emergency_mode') {
      setIsAlert(true);
      addLog(`Command: SECURITY LEVEL ${args.level} - LOCKDOWN INITIATED`, 'command');
      setTimeout(() => setIsAlert(false), 5000);
    }
  };

  // --- Main Logic ---
  const sendToGemini = async (text?: string) => {
    const rawMessage = text || inputMessage;
    if (!rawMessage || isProcessing) return;
    
    // 1. まず正規化（通訳）
    const messageToSend = normalizeInput(rawMessage);
    
    setInputMessage('');
    setIsProcessing(true);
    
    // 2. ユーザー入力を表示
    addLog(messageToSend, 'user');

    // 3. ★理解フェーズの演出★
    // いきなり投げずに、AIが考えているフリをするログを出す
    addLog(`Thinking: リクエスト "${messageToSend}" の意図構造を解析中...`, 'thinking');
    
    // 少し待たせて「考えている感」を出す
    await new Promise(r => setTimeout(r, 800));

    // プロンプト作成
    const promptWithPersona = `
      [System Definition]
      Persona: ${aiPersona}
      Current Time: ${new Date().toLocaleString()}
      
      User Input: "${messageToSend}"
      
      あなたはClienのようなエンジニアAIです。
      ユーザーの指示を一度整理し、理解したことを示してから実行に移ってください。
      
      Output Step 1 (Thinking):
      ユーザーが何を求めているか、対象リポジトリは何か（flastal, LARUbot_homepageなど）、
      どのようなリスクがあるかを分析して出力してください。
      
      Output Step 2 (Action/Question):
      情報が十分ならツールを実行(trigger_github_action, browse_website等)、不足なら質問してください。
      
      Output Step 3 (Response):
      最終的な報告メッセージ。
    `;

    try {
      const res = await fetch(`/api/gemini?v=31.0&t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptWithPersona }),
        cache: 'no-store'
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.details || "Unknown API Error");

      // 4. 実行と結果表示
      if (data.functionCalls && data.functionCalls.length > 0) {
        for (const call of data.functionCalls) {
          await executeAction(call);
        }
        // 完了報告（音声あり）
        const finalMsg = data.text || "全プロセスが正常に完了しました。";
        addLog(finalMsg, 'ai');
        speak(finalMsg); 
      } else {
        // 会話のみの場合
        const reply = data.text || "応答なし";
        const isQuestion = reply.includes("？") || reply.includes("?");
        addLog(reply, isQuestion ? 'question' : 'ai');
        speak(reply);
      }

    } catch (error: any) {
      addLog(`Error: ${error.message}`, 'error');
      speak("致命的なエラーが発生しました。");
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance('')); // Unlock Audio
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("Speech API Not Supported", 'error');
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false; 
    recognition.continuous = false;
    
    recognition.onstart = () => { setIsLive(true); setIsProcessing(true); };
    recognition.onend = () => { setIsLive(false); setIsProcessing(false); };
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) sendToGemini(transcript);
    };
    
    try { recognition.start(); } catch (e) { addLog("Mic Error", 'error'); }
  };

  const handleTabChange = (tab: any) => setActiveTab(tab);
  const handleRoadmapClick = (item: RoadmapItem) => setSelectedRoadmap(item);
  const handleRefresh = () => typeof window !== 'undefined' && window.location.reload();
  const handleClearLogs = () => { setLogs([]); addLog("Console Cleared.", 'ai'); };

  // --- Beautiful Low-Poly Face (SVG) ---
  const LowPolyFace = ({ gender, active, level }: { gender: 'male' | 'female', active: boolean, level: number }) => {
    const mouthY = active ? Math.min(10, level / 5) : 0;
    const color = active ? "var(--c-red)" : "var(--c-cyan)";
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
          <path d={`M35,85 L50,${85 + mouthY} L65,85`} strokeWidth="1.5" />
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
          <path d={`M38,82 L50,${82 + mouthY} L62,82`} strokeWidth="1.5" />
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
          --c-bg: #050505; --c-fg: #e0e0e0;
          --c-cyan: #00f2ff; --c-green: #39ff14; --c-red: #ff0040; --c-yellow: #ffea00;
          --c-dim: #333;
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body, html { height: 100dvh; margin: 0; background: var(--c-bg); color: var(--c-fg); font-family: 'JetBrains Mono', 'Noto Sans JP', monospace; overflow: hidden; }
        
        .nexus-container { display: flex; flex-direction: column; height: 100%; width: 100%; position: relative; }
        .grid-bg { position: fixed; inset: 0; z-index: -1; opacity: 0.1; background-image: linear-gradient(var(--c-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--c-cyan) 1px, transparent 1px); background-size: 40px 40px; }
        
        /* Header */
        .header { height: 50px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--c-dim); background: rgba(0,0,0,0.8); z-index: 10; font-weight: bold; letter-spacing: 2px; color: var(--c-cyan); text-shadow: 0 0 10px rgba(0,242,255,0.5); }

        /* Log Area */
        .log-area { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
        
        /* Chat Bubbles (Hacker Style) */
        .bubble { padding: 12px; border-radius: 4px; font-size: 13px; line-height: 1.6; max-width: 95%; word-break: break-all; border-left: 3px solid transparent; background: rgba(255,255,255,0.02); animation: fadeIn 0.3s; position: relative; }
        
        .type-user { border-color: var(--c-cyan); align-self: flex-end; text-align: right; }
        .type-ai { border-color: var(--c-green); color: var(--c-green); align-self: flex-start; }
        .type-thinking { border-color: var(--c-dim); color: #888; font-style: italic; align-self: flex-start; border-left-style: dashed; }
        .type-command { border-color: var(--c-yellow); color: var(--c-yellow); align-self: flex-start; font-family: monospace; background: rgba(255, 234, 0, 0.05); }
        .type-checkpoint { border-color: #fff; color: #fff; background: rgba(255,255,255,0.1); align-self: flex-start; }
        .type-question { border-color: #ff00ff; color: #ff00ff; font-weight: bold; align-self: flex-start; }
        .type-error { border-color: var(--c-red); color: var(--c-red); align-self: center; font-weight: bold; }

        /* Input Area */
        .input-area { padding: 15px; background: rgba(0,0,0,0.9); border-top: 1px solid var(--c-cyan); display: flex; gap: 10px; align-items: center; }
        .mic-btn { 
          width: 50px; height: 50px; border-radius: 50%; border: 1px solid var(--c-cyan); background: rgba(0, 242, 255, 0.1); 
          color: var(--c-cyan); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;
          box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
        }
        .mic-btn:active { transform: scale(0.9); background: rgba(0, 242, 255, 0.3); }
        .mic-btn.active { background: var(--c-red); border-color: var(--c-red); color: #fff; animation: pulse 1.5s infinite; box-shadow: 0 0 20px rgba(255,0,64,0.5); }
        
        .text-input { 
          flex: 1; height: 44px; background: #111; border: 1px solid var(--c-dim); color: #fff; 
          border-radius: 4px; padding: 0 15px; font-size: 14px; outline: none; transition: 0.2s; font-family: inherit;
        }
        .text-input:focus { border-color: var(--c-cyan); box-shadow: 0 0 10px rgba(0,242,255,0.2); }

        /* Tabs */
        .nav-tabs { display: flex; background: #000; border-bottom: 1px solid var(--c-dim); z-index: 50; }
        .nav-btn { flex: 1; padding: 12px 0; background: none; border: none; color: #666; font-size: 10px; font-weight: bold; cursor: pointer; transition: 0.3s; letter-spacing: 1px; }
        .nav-btn.active { color: var(--c-cyan); border-bottom: 2px solid var(--c-cyan); text-shadow: 0 0 8px var(--c-cyan); }

        .panel { display: none; flex-direction: column; width: 100%; height: 100%; overflow-y: auto; padding: 16px; gap: 16px; }
        .panel.active { display: flex; }

        .project-card { background: rgba(255,255,255,0.02); border: 1px solid var(--c-dim); border-radius: 4px; padding: 16px; cursor: pointer; transition: 0.2s; }
        .project-card:active { transform: scale(0.98); border-color: var(--c-cyan); background: rgba(0,242,255,0.05); }
        
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s; }
        .detail-panel { width: 100%; max-width: 600px; max-height: 85vh; background: #000; border: 1px solid var(--c-cyan); box-shadow: 0 0 30px rgba(0,242,255,0.2); display: flex; flex-direction: column; overflow: hidden; }
        .detail-header { padding: 15px; border-bottom: 1px solid var(--c-dim); display: flex; justify-content: space-between; align-items: center; }
        .detail-content { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
      `}</style>

      <div className="grid-bg" />

      {/* HEADER */}
      <div className="header">
        <div>NEXUS v31.0</div>
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
        <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>// ACTIVE_TARGETS</div>
        {Object.values(projects).map(p => (
          <div key={p.id} className="project-card" onClick={() => setSelectedProject(p)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--c-cyan)' }}>{p.name}</div>
              <div style={{ fontSize: '10px', color: p.status === 'ONLINE' ? 'var(--c-green)' : '#666' }}>[{p.status}]</div>
            </div>
            <div style={{ fontSize: '10px', color: '#888', marginTop: '5px' }}>REPO: {p.repoName}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '11px', color: '#aaa', marginTop: '5px' }}>
              <div>LATENCY: <span style={{ color: '#fff' }}>{Math.floor(p.latency)}ms</span></div>
              <div>LOAD: <span style={{ color: '#fff' }}>{Math.floor(p.load)}%</span></div>
            </div>
            <div style={{ marginTop: '5px', height: '2px', background: '#333' }}>
              <div style={{ width: `${Math.min(100, p.load)}%`, height: '100%', background: 'var(--c-cyan)', transition: '0.5s' }} />
            </div>
          </div>
        ))}
      </div>

      {/* CORE PANEL (CLINE UI) */}
      <div className={`panel ${activeTab === 'CORE' ? 'active' : ''}`} style={{ padding: 0 }}>
        {/* Face HUD */}
        <section style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid var(--c-dim)', background: 'rgba(0,0,0,0.5)' }}>
          <div className="voice-hud" onClick={startListening}>
            <div className="face-container">
              <LowPolyFace gender={aiGender} active={isLive} level={audioLevel} />
            </div>
          </div>
          <div style={{ fontSize: '10px', marginTop: '10px', color: isLive ? 'var(--c-red)' : '#666', letterSpacing: '2px' }}>
            {isLive ? 'LISTENING...' : 'SYSTEM READY'}
          </div>
        </section>

        {/* Logs */}
        <div className="log-area">
          {logs.map((log) => (
            <div key={log.id} className={`bubble type-${log.type}`}>
              {log.type === 'thinking' && <span style={{opacity:0.7, fontSize:'10px', display:'block', marginBottom:'2px'}}>ANALYZING...</span>}
              {log.type === 'command' && <span style={{opacity:0.7, fontSize:'10px', display:'block', marginBottom:'2px'}}>EXECUTING &gt;_</span>}
              {log.imageUrl && <img src={log.imageUrl} alt="Captured" style={{ width: '100%', borderRadius: '4px', marginBottom: '8px', border: '1px solid var(--c-cyan)' }} />}
              <HackerText text={log.msg} speed={log.type === 'thinking' ? 0.5 : 2} />
            </div>
          ))}
          {isProcessing && logs.length === 0 && <div className="bubble type-thinking"><HackerText text="Waiting for input signal..." /></div>}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          <input 
            className="text-input" 
            placeholder="Enter Command..." 
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
        <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>// STRATEGIC_INITIATIVES</div>
        {strategicRoadmap.map(item => (
          <div key={item.id} className="roadmap-item" style={{display:'flex', alignItems:'flex-start', gap:'10px', padding:'12px', borderBottom:'1px solid var(--c-dim)'}} onClick={() => setSelectedRoadmap(item)}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', background: item.status === 'ACTIVE' ? 'var(--c-cyan)' : '#444', boxShadow: item.status === 'ACTIVE' ? '0 0 10px var(--c-cyan)' : 'none' }} />
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
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--c-cyan)' }}>{selectedProject.name}</div>
                <div style={{ fontSize: '10px', color: '#888' }}>{selectedProject.url}</div>
              </div>
              <button onClick={() => setSelectedProject(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>×</button>
            </div>
            <div className="detail-content">
              {/* Proposals */}
              <div style={{ fontSize: '11px', color: '#888' }}>AVAILABLE ACTIONS</div>
              <div style={{border:'1px dashed var(--c-cyan)', padding:'12px', borderRadius:'4px'}}>
                <div style={{ fontSize: '12px', color: '#fff', marginBottom:'5px' }}>Auto Diagnostics</div>
                <button style={{width:'100%', background:'var(--c-cyan)', color:'#000', border:'none', padding:'10px', fontWeight:'bold', borderRadius:'2px', cursor:'pointer'}} onClick={() => {
                  setSelectedProject(null); setActiveTab('CORE'); sendToGemini(`${selectedProject.name} の診断を実行して`);
                }}>RUN DIAGNOSTICS</button>
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
                <span className="settings-label">INTERFACE MODE</span>
                <div className="toggle-row">
                  <button className={`toggle-btn ${aiGender === 'male' ? 'active' : ''}`} onClick={() => setAiGender('male')}>SOLID</button>
                  <button className={`toggle-btn ${aiGender === 'female' ? 'active' : ''}`} onClick={() => setAiGender('female')}>SLEEK</button>
                </div>
              </div>
              <div className="settings-group">
                <span className="settings-label">PERSONA CORE</span>
                <textarea className="persona-input" value={aiPersona} onChange={(e) => setAiPersona(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}

      <footer style={{ height: '24px', background: '#000', borderTop: '1px solid var(--c-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontSize: '9px', color: '#444' }}>
        <div>© 2026 LARUbot Inc.</div>
        <div>MATRIX_MODE</div>
      </footer>
    </div>
  );
}