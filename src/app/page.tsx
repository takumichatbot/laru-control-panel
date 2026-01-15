'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v18.5 [HYPER_INTEGRATED]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President / Komazawa Law Student)
 * DATE: 2026-01-16
 * DESCRIPTION: 
 * CORE(心臓部)とCHATを完全統合。最新の Gemini 2.5 Flash モデルに対応し、
 * モバイル・ファーストのハイブリッド・インターフェースを実装。
 * ==============================================================================
 */

// --- システム・データ構造定義 ---
interface ServiceData {
  id: string;
  name: string;
  cpu: number;
  mem: number;
  status: 'NOMINAL' | 'HEAVY' | 'CRITICAL';
  color: string;
}

interface LogEntry {
  id: string;
  msg: string;
  type: 'user' | 'gemini' | 'sys' | 'sec';
  time: string;
}

export default function LaruNexusV18() {
  // --- 状態管理 (State Management) ---
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'CORE'>('CORE');
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);

  // 統合サービス資産 (30個の拡張を見据えた初期リスト)
  const [services, setServices] = useState<Record<string, ServiceData>>({
    larubot: { id: 'larubot', name: 'LARUBOT-AI', cpu: 12, mem: 410, status: 'NOMINAL', color: '#00f2ff' },
    laruvisona: { id: 'laruvisona', name: 'LARUVISONA', cpu: 8, mem: 175, status: 'NOMINAL', color: '#39ff14' },
    flastal: { id: 'flastal', name: 'FLASTAL.NET', cpu: 42, mem: 1100, status: 'HEAVY', color: '#ff006e' },
    nexus_core: { id: 'nexus_core', name: 'NEXUS-CORE', cpu: 5, mem: 88, status: 'NOMINAL', color: '#7b2eff' },
    db_cluster: { id: 'db_cluster', name: 'DATA-CLUSTER', cpu: 15, mem: 1200, status: 'NOMINAL', color: '#ffea00' },
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- ログ・会話追加プロトコル ---
  const addLog = useCallback((msg: string, type: 'user' | 'gemini' | 'sys' | 'sec' = 'sys') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [...prev, { id, msg, type, time }]);
  }, []);

  // 自動スクロール
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isThinking]);

  // --- Gemini 実行プロトコル (2.5-flash 専用エンジン) ---
  const sendToGemini = async (text?: string) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || isThinking) return;

    setIsThinking(true);
    addLog(messageToSend, 'user');
    setInputMessage('');

    try {
      const res = await fetch(`/api/gemini?v=18.5&t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
        cache: 'no-store'
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.details || data.error || `HTTP_${res.status}`);

      if (data.text) {
        addLog(data.text, 'gemini');
      }
    } catch (error: any) {
      addLog(`ERR_AUTH: 通信プロトコルが遮断されました。`, "sec");
      addLog(`REASON: ${error.message.toUpperCase()}`, "sys");
    } finally {
      setIsThinking(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("ERR: 音声モジュールが非対応です。", "sec");

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.start();
    setIsLive(true);
    addLog("LISTENING: 音声入力待機中...", "sys");

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      sendToGemini(transcript);
      setIsLive(false);
    };
    recognition.onerror = () => {
      setIsLive(false);
      addLog("音声のデコードに失敗しました。", "sys");
    };
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isLive) setAudioLevel(Math.random() * 100);
      setServices(prev => {
        const next = { ...prev };
        let anyCritical = false;
        Object.keys(next).forEach(key => {
          const drift = Math.random() * 4 - 2;
          next[key].cpu = Math.max(5, Math.min(99, next[key].cpu + drift));
          if (next[key].cpu > 90) anyCritical = true;
        });
        setIsAlert(anyCritical);
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className={`nexus-container ${isAlert ? 'alert-active' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Noto+Sans+JP:wght@300;400;700&display=swap');
        
        :root { 
          --neon-blue: #00f2ff; 
          --neon-red: #ff0040; 
          --neon-green: #39ff14; 
          --bg-dark: #050505; 
          --panel-bg: rgba(10, 10, 10, 0.85);
        }

        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        
        body, html { margin: 0; padding: 0; overflow: hidden; }

        .nexus-container { 
          height: 100vh; background: var(--bg-dark); color: #fff; 
          font-family: 'JetBrains Mono', 'Noto Sans JP', sans-serif; 
          display: flex; flex-direction: column; position: relative; 
        }

        .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(0, 242, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.03) 1px, transparent 1px); background-size: 40px 40px; z-index: 0; pointer-events: none; }
        
        @keyframes pulse-red { 50% { box-shadow: inset 0 0 80px rgba(255,0,64,0.15); } }
        .alert-active { animation: pulse-red 1.5s infinite; }

        .panel-content { flex-direction: column; height: 100%; overflow: hidden; position: relative; z-index: 10; display: none; }
        .panel-content.active { display: flex; }

        .bubble { max-width: 90%; padding: 12px 16px; border-radius: 12px; font-size: 13px; line-height: 1.6; position: relative; word-wrap: break-word; margin-bottom: 8px; }
        .bubble-user { align-self: flex-end; background: rgba(0, 242, 255, 0.08); border: 1px solid rgba(0, 242, 255, 0.3); border-bottom-right-radius: 2px; }
        .bubble-gemini { align-self: flex-start; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-bottom-left-radius: 2px; }
        .bubble-sys { align-self: center; color: #666; font-size: 9px; border: none; padding: 4px; }
        .bubble-sec { align-self: center; background: rgba(255, 0, 64, 0.1); border: 1px solid var(--neon-red); color: var(--neon-red); font-size: 10px; }

        .nexus-btn { 
          background: rgba(0, 242, 255, 0.05); border: 1px solid var(--neon-blue); color: var(--neon-blue); 
          padding: 14px 28px; font-weight: bold; cursor: pointer; text-transform: uppercase; 
          letter-spacing: 2px; transition: 0.3s; font-size: 12px;
        }
        .nexus-btn:active { transform: scale(0.95); background: var(--neon-blue); color: #000; }
        .nexus-btn.listening { border-color: var(--neon-red); color: var(--neon-red); animation: blink 1s infinite; }

        .core-circle {
          position: relative; width: 220px; height: 220px; display: flex; alignItems: center; justifyContent: center;
          background: radial-gradient(circle, rgba(0, 242, 255, 0.1) 0%, transparent 70%);
          border-radius: 50%;
        }

        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 50% { opacity: 0.3; } }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .monitor-aside { width: 100% !important; border: none !important; }
          .core-circle { width: 160px; height: 160px; }
          .core-circle div { font-size: 32px !important; }
        }
      `}} />
      <div className="grid-bg" />

      {/* HEADER */}
      <header style={{ height: '56px', borderBottom: '1px solid rgba(0, 242, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'rgba(0, 0, 0, 0.95)', zIndex: 1100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '20px', height: '20px', border: `2px solid ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '20%', background: isAlert ? 'var(--neon-red)' : 'var(--neon-blue)', boxShadow: `0 0 10px ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}` }} />
          </div>
          <h1 style={{ fontSize: '13px', letterSpacing: '2px', margin: 0, fontWeight: 700 }}>NEXUS_v18.5</h1>
        </div>
        <div style={{ fontSize: '9px', color: isAlert ? 'var(--neon-red)' : 'var(--neon-green)', fontFamily: 'JetBrains Mono' }}>[ 2.5_FLASH_ACTIVE ]</div>
      </header>

      {/* TABS */}
      <nav style={{ display: 'flex', background: '#000', borderBottom: '1px solid #222', zIndex: 1100 }}>
        {(['CORE', 'MONITOR'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ 
            flex: 1, padding: '12px', border: 'none', background: 'transparent', 
            color: activeTab === tab ? 'var(--neon-blue)' : '#555', 
            borderBottom: activeTab === tab ? '2px solid var(--neon-blue)' : 'none', 
            fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s'
          }}>
            {tab === 'CORE' ? 'COMMAND_CENTER' : 'SYSTEM_MONITOR'}
          </button>
        ))}
      </nav>

      <div className="nexus-main" style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'column' }}>
        
        {/* MONITOR PANEL */}
        <aside className={`panel-content monitor-aside ${activeTab === 'MONITOR' ? 'active' : ''}`} style={{ flex: 1, padding: '20px', gap: '10px', overflowY: 'auto', background: 'rgba(0,0,0,0.8)' }}>
          <div style={{ fontSize: '10px', color: '#666', marginBottom: '10px', letterSpacing: '2px' }}>// PROJECT_TELEMETRY</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            {Object.values(services).map(s => (
              <div key={s.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}>
                  <span style={{ color: s.color, fontWeight: 'bold' }}>{s.name}</span>
                  <span style={{ color: s.cpu > 85 ? 'var(--neon-red)' : '#888' }}>{s.cpu.toFixed(0)}%</span>
                </div>
                <div style={{ height: '3px', background: '#111' }}><div style={{ width: `${s.cpu}%`, height: '100%', background: s.cpu > 85 ? 'var(--neon-red)' : s.color, transition: '0.4s' }} /></div>
              </div>
            ))}
          </div>
        </aside>

        {/* INTEGRATED CORE & CHAT PANEL */}
        <main className={`panel-content ${activeTab === 'CORE' ? 'active' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* CORE AREA */}
          <section style={{ height: '40%', minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="core-circle">
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, opacity: 0.1, transform: `scale(${1 + audioLevel / 150})`, transition: '0.1s' }} />
              <div style={{ position: 'absolute', inset: '-10px', border: `1px dashed var(--neon-blue)`, borderRadius: '50%', animation: 'rotate 40s linear infinite', opacity: 0.1 }} />
              <div style={{ textAlign: 'center', zIndex: 10 }}>
                <div style={{ fontSize: '42px', fontWeight: 900, textShadow: `0 0 20px ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, letterSpacing: '2px' }}>LARU</div>
                <div style={{ fontSize: '8px', color: 'var(--neon-blue)', letterSpacing: '4px', marginTop: '5px' }}>NEXUS CORE</div>
              </div>
            </div>
            <button onClick={startListening} className={`nexus-btn ${isLive ? 'listening' : ''}`} style={{ position: 'absolute', bottom: '15px', padding: '10px 20px', borderRadius: '30px' }}>
              {isLive ? 'LISTEN...' : 'VOICE_ON'}
            </button>
          </section>

          {/* CHAT/LOG AREA */}
          <section style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              {logs.length === 0 && (
                <div style={{ margin: 'auto', textAlign: 'center', color: '#444', fontSize: '11px', letterSpacing: '2px' }}>
                  READY FOR COMMANDS...
                </div>
              )}
              {logs.map(log => (
                <div key={log.id} className={`bubble bubble-${log.type}`}>
                  <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.2)', marginBottom: '3px', fontFamily: 'JetBrains Mono' }}>{log.type.toUpperCase()} // {log.time}</div>
                  {log.msg}
                </div>
              ))}
              {isThinking && <div className="bubble bubble-gemini" style={{ opacity: 0.4, animation: 'blink 1s infinite' }}>[ ANALYZING_STREAMS... ]</div>}
              <div ref={chatEndRef} />
            </div>

            {/* INPUT AREA */}
            <div style={{ padding: '12px 16px', background: '#000', borderTop: '1px solid #222' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '24px', padding: '4px 16px', border: '1px solid rgba(0,242,255,0.2)' }}>
                <input 
                  type="text" 
                  value={inputMessage} 
                  onChange={e => setInputMessage(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendToGemini(); } }} 
                  placeholder="DIRECT_COMMAND..." 
                  style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '14px', height: '40px' }} 
                />
                <button onClick={() => sendToGemini()} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>SEND</button>
              </div>
            </div>
          </section>
        </main>
      </div>

      <footer style={{ height: '24px', background: '#000', borderTop: '1px solid #111', display: 'flex', alignItems: 'center', fontSize: '8px', color: '#333', justifyContent: 'space-between', padding: '0 12px', zIndex: 1100 }}>
        <div>© 2026 LARUbot // NEXUS COMMAND</div>
        <div style={{ color: 'var(--neon-green)', opacity: 0.6 }}>● ENCRYPTED_CONNECTION</div>
      </footer>
    </div>
  );
}