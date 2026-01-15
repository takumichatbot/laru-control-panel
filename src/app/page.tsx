'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v18.6 [DISPLAY_PERFECT]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President / Komazawa Law Student)
 * DATE: 2026-01-16
 * DESCRIPTION: 
 * PC/スマホの表示ズレを完全修正。システムモニターを監視特化型へ整理。
 * 2026年最新の Gemini 2.5 Flash 対応統合インターフェース。
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

  // 統合サービス資産
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
      const res = await fetch(`/api/gemini?v=18.6&t=${Date.now()}`, {
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
        }

        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; margin: 0; padding: 0; }
        
        body, html { 
          height: 100dvh; 
          width: 100vw;
          background: var(--bg-dark); 
          overflow: hidden; 
        }

        .nexus-container { 
          height: 100dvh; width: 100vw;
          background: var(--bg-dark); color: #fff; 
          font-family: 'JetBrains Mono', 'Noto Sans JP', sans-serif; 
          display: flex; flex-direction: column; position: relative; 
          overflow: hidden;
        }

        .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(0, 242, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.03) 1px, transparent 1px); background-size: 40px 40px; z-index: 0; pointer-events: none; }
        
        @keyframes pulse-red { 50% { box-shadow: inset 0 0 80px rgba(255,0,64,0.1); } }
        .alert-active { animation: pulse-red 1.5s infinite; }

        .panel-content { flex-direction: column; height: 100%; width: 100%; overflow: hidden; position: relative; z-index: 10; display: none; }
        .panel-content.active { display: flex; }

        .bubble { max-width: 88%; padding: 10px 14px; border-radius: 10px; font-size: 13px; line-height: 1.5; position: relative; word-wrap: break-word; margin-bottom: 8px; }
        .bubble-user { align-self: flex-end; background: rgba(0, 242, 255, 0.06); border: 1px solid rgba(0, 242, 255, 0.2); border-bottom-right-radius: 2px; }
        .bubble-gemini { align-self: flex-start; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-bottom-left-radius: 2px; }
        .bubble-sys { align-self: center; color: #555; font-size: 8px; border: none; padding: 2px; }
        .bubble-sec { align-self: center; background: rgba(255, 0, 64, 0.05); border: 1px solid var(--neon-red); color: var(--neon-red); font-size: 9px; }

        .nexus-btn { 
          background: rgba(0, 242, 255, 0.05); border: 1px solid var(--neon-blue); color: var(--neon-blue); 
          padding: 12px 24px; font-weight: bold; cursor: pointer; text-transform: uppercase; 
          letter-spacing: 2px; transition: 0.2s; font-size: 11px; outline: none;
        }
        .nexus-btn:active { transform: scale(0.96); background: var(--neon-blue); color: #000; }
        .nexus-btn.listening { border-color: var(--neon-red); color: var(--neon-red); animation: blink 1s infinite; }

        .core-circle-container {
          position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 20px 0;
        }

        .core-circle {
          position: relative; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center;
          background: radial-gradient(circle, rgba(0, 242, 255, 0.08) 0%, transparent 75%);
          border-radius: 50%;
        }

        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 50% { opacity: 0.3; } }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .core-circle { width: 140px; height: 140px; }
          .core-circle div:first-child { font-size: 28px !important; }
          .bubble { max-width: 92%; font-size: 12px; }
        }
      `}} />
      <div className="grid-bg" />

      {/* HEADER */}
      <header style={{ height: '50px', borderBottom: '1px solid rgba(0, 242, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'rgba(0, 0, 0, 0.95)', zIndex: 1100, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '18px', height: '18px', border: `2px solid ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '20%', background: isAlert ? 'var(--neon-red)' : 'var(--neon-blue)', boxShadow: `0 0 8px ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}` }} />
          </div>
          <h1 style={{ fontSize: '12px', letterSpacing: '2px', margin: 0, fontWeight: 700 }}>NEXUS_v18.6</h1>
        </div>
        <div style={{ fontSize: '8px', color: isAlert ? 'var(--neon-red)' : 'var(--neon-green)', fontFamily: 'JetBrains Mono' }}>[ 2.5_FLASH_ACTIVE ]</div>
      </header>

      {/* TABS */}
      <nav style={{ display: 'flex', background: '#000', borderBottom: '1px solid #1a1a1a', zIndex: 1100, flexShrink: 0 }}>
        {(['CORE', 'MONITOR'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ 
            flex: 1, padding: '12px 0', border: 'none', background: 'transparent', 
            color: activeTab === tab ? 'var(--neon-blue)' : '#444', 
            borderBottom: activeTab === tab ? '2px solid var(--neon-blue)' : 'none', 
            fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px'
          }}>
            {tab === 'CORE' ? 'COMMAND_CENTER' : 'SYSTEM_MONITOR'}
          </button>
        ))}
      </nav>

      <div className="nexus-main" style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* MONITOR PANEL (Pure Monitoring) */}
        <aside className={`panel-content ${activeTab === 'MONITOR' ? 'active' : ''}`} style={{ padding: '20px', overflowY: 'auto' }}>
          <div style={{ fontSize: '9px', color: '#444', marginBottom: '15px', letterSpacing: '2px', textAlign: 'center' }}>// REALTIME_TELEMETRY_STREAM</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            {Object.values(services).map(s => (
              <div key={s.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '10px' }}>
                  <span style={{ color: s.color, fontWeight: 'bold' }}>{s.name}</span>
                  <span style={{ color: s.cpu > 85 ? 'var(--neon-red)' : '#666' }}>{s.cpu.toFixed(0)}%</span>
                </div>
                <div style={{ height: '2px', background: '#111' }}><div style={{ width: `${s.cpu}%`, height: '100%', background: s.cpu > 85 ? 'var(--neon-red)' : s.color, transition: '0.4s' }} /></div>
              </div>
            ))}
          </div>
        </aside>

        {/* INTEGRATED CORE & CHAT PANEL */}
        <main className={`panel-content ${activeTab === 'CORE' ? 'active' : ''}`} style={{ display: activeTab === 'CORE' ? 'flex' : 'none' }}>
          
          {/* CORE SECTION */}
          <section className="core-circle-container" style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div className="core-circle">
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, opacity: 0.1, transform: `scale(${1 + audioLevel / 180})`, transition: '0.1s' }} />
              <div style={{ position: 'absolute', inset: '-8px', border: `1px dashed var(--neon-blue)`, borderRadius: '50%', animation: 'rotate 60s linear infinite', opacity: 0.08 }} />
              <div style={{ textAlign: 'center', zIndex: 10 }}>
                <div style={{ fontSize: '36px', fontWeight: 900, textShadow: `0 0 15px ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, letterSpacing: '3px' }}>LARU</div>
                <div style={{ fontSize: '7px', color: 'var(--neon-blue)', letterSpacing: '3px', marginTop: '4px', opacity: 0.8 }}>NEXUS CORE</div>
              </div>
            </div>
            <button onClick={startListening} className={`nexus-btn ${isLive ? 'listening' : ''}`} style={{ marginTop: '15px', padding: '8px 16px', borderRadius: '20px', fontSize: '10px' }}>
              {isLive ? 'LISTEN_ACTIVE' : 'VOICE_COMMAND'}
            </button>
          </section>

          {/* CHAT SECTION */}
          <section style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', scrollBehavior: 'smooth' }}>
              {logs.length === 0 && (
                <div style={{ margin: 'auto', textAlign: 'center', color: '#333', fontSize: '10px', letterSpacing: '3px' }}>
                  AWAITING_INPUT_SEQUENCE...
                </div>
              )}
              {logs.map(log => (
                <div key={log.id} className={`bubble bubble-${log.type}`}>
                  <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.15)', marginBottom: '2px' }}>{log.type.toUpperCase()} // {log.time}</div>
                  {log.msg}
                </div>
              ))}
              {isThinking && <div className="bubble bubble-gemini" style={{ opacity: 0.4, animation: 'blink 1.5s infinite' }}>[ PROCESSING_NEURAL_STREAMS ]</div>}
              <div ref={chatEndRef} />
            </div>

            {/* INPUT BOX */}
            <div style={{ padding: '10px 12px', background: '#000', borderTop: '1px solid #111', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '2px 14px', border: '1px solid rgba(0,242,255,0.15)' }}>
                <input 
                  type="text" 
                  value={inputMessage} 
                  onChange={e => setInputMessage(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendToGemini(); } }} 
                  placeholder="INPUT_COMMAND_STRING..." 
                  style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '13px', height: '36px' }} 
                />
                <button onClick={() => sendToGemini()} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px' }}>RUN</button>
              </div>
            </div>
          </section>
        </main>
      </div>

      <footer style={{ height: '20px', background: '#000', borderTop: '1px solid #0a0a0a', display: 'flex', alignItems: 'center', fontSize: '7px', color: '#222', justifyContent: 'space-between', padding: '0 10px', zIndex: 1100, flexShrink: 0 }}>
        <div>© 2026 LARUbot // NEXUS COMMAND UNIT</div>
        <div style={{ color: 'var(--neon-green)', opacity: 0.4 }}>SYSTEM_STABLE</div>
      </footer>
    </div>
  );
}