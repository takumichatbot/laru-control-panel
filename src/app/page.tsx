'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v18.5 [HYBRID_INTEGRATION]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President / Komazawa Law Student)
 * DATE: 2026-01-16
 * DESCRIPTION: 
 * Gemini 2.5 Flash 対応。COREとLOGを物理的に統合したハイブリッド・インターフェース。
 * 30項目以上の監視拡張に対応するためのベース・グリッドを構築。
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
  const [activeTab, setActiveTab] = useState<'SYSTEM' | 'CONFIG'>('SYSTEM'); // 統合によりタブ構成を変更
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);

  // 統合サービス資産 (将来的に30項目へ拡張予定)
  const [services, setServices] = useState<Record<string, ServiceData>>({
    larubot: { id: 'larubot', name: 'LARUBOT-AI', cpu: 12, mem: 410, status: 'NOMINAL', color: '#00f2ff' },
    laruvisona: { id: 'laruvisona', name: 'LARUVISONA', cpu: 8, mem: 175, status: 'NOMINAL', color: '#39ff14' },
    flastal: { id: 'flastal', name: 'FLASTAL.NET', cpu: 42, mem: 1100, status: 'HEAVY', color: '#ff006e' },
    nexus_core: { id: 'nexus_core', name: 'NEXUS-CORE-v2.5', cpu: 5, mem: 890, status: 'NOMINAL', color: '#ffffff' }
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

  // --- Gemini 実行プロトコル (最新 2.5 Flash 対応) ---
  const sendToGemini = async (text?: string) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || isThinking) return;

    setIsThinking(true);
    addLog(messageToSend, 'user');
    setInputMessage('');

    try {
      // 2026年最新モデルを明示的に呼び出すエンドポイント。キャッシュ破壊を継続。
      const res = await fetch(`/api/gemini?v=18.5&t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
        cache: 'no-store'
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || `HTTP_${res.status}`);
      }

      if (data.text) {
        addLog(data.text, 'gemini');
      }
    } catch (error: any) {
      addLog(`ERR_AUTH: 通信プロトコルが遮断されました。`, "sec");
      addLog(`REASON: ${error.message.toUpperCase()}`, "sys");
      addLog(`ACTION: モデル名が 'gemini-2.5-flash' であることを確認してください。`, "sys");
    } finally {
      setIsThinking(false);
    }
  };

  // --- 音声認識プロトコル ---
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

  // --- テレメトリ自動更新 (モニター拡張の基礎) ---
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

        .nexus-container { 
          height: 100vh; background: var(--bg-dark); color: #fff; 
          font-family: 'JetBrains Mono', 'Noto Sans JP', sans-serif; 
          display: flex; flex-direction: column; overflow: hidden; position: relative; 
        }

        .nexus-container::before { 
          content: ""; position: absolute; inset: 0; 
          background: linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.2) 50%), linear-gradient(90deg, rgba(255,0,0,0.03), rgba(0,255,0,0.01), rgba(0,0,255,0.03)); 
          background-size: 100% 4px, 3px 100%; pointer-events: none; z-index: 1000; 
        }

        .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(0, 242, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.03) 1px, transparent 1px); background-size: 50px 50px; z-index: 0; pointer-events: none; }
        
        @keyframes pulse-red { 50% { box-shadow: inset 0 0 100px rgba(255,0,64,0.2); } }
        .alert-active { animation: pulse-red 1.5s infinite; }

        .bubble { max-width: 90%; padding: 10px 14px; border-radius: 8px; font-size: 13px; line-height: 1.5; position: relative; word-wrap: break-word; margin-bottom: 8px; }
        .bubble-user { align-self: flex-end; background: rgba(0, 242, 255, 0.1); border: 1px solid var(--neon-blue); border-bottom-right-radius: 2px; }
        .bubble-gemini { align-self: flex-start; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); border-bottom-left-radius: 2px; }
        .bubble-sys { align-self: flex-start; color: #777; font-size: 9px; border: none; font-style: italic; }
        .bubble-sec { align-self: center; background: rgba(255, 0, 64, 0.05); border: 1px solid var(--neon-red); color: var(--neon-red); font-size: 9px; width: 100%; text-align: center; }

        .nexus-btn { 
          background: rgba(0, 242, 255, 0.05); border: 1px solid var(--neon-blue); color: var(--neon-blue); 
          padding: 8px 16px; font-size: 11px; font-weight: bold; cursor: pointer; text-transform: uppercase; 
          letter-spacing: 2px; position: relative; z-index: 1100; transition: 0.3s;
        }
        .nexus-btn:hover { background: var(--neon-blue); color: #000; box-shadow: 0 0 20px var(--neon-blue); }
        .nexus-btn.listening { border-color: var(--neon-red); color: var(--neon-red); animation: blink 1s infinite; }

        @keyframes blink { 50% { opacity: 0.3; } }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .service-bar { height: 1px; background: #111; margin-top: 4px; overflow: hidden; }
        .service-fill { height: 100%; transition: 0.5s; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--neon-blue); border-radius: 10px; }
      `}} />
      <div className="grid-bg" />

      {/* HEADER */}
      <header style={{ height: '50px', borderBottom: '1px solid rgba(0, 242, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'rgba(0, 0, 0, 0.9)', zIndex: 1100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '24px', height: '24px', border: `2px solid ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '20%', background: isAlert ? 'var(--neon-red)' : 'var(--neon-blue)', boxShadow: `0 0 10px ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}` }} />
          </div>
          <h1 style={{ fontSize: '14px', letterSpacing: '3px', margin: 0 }}>LARU_NEXUS_v18.5 [HYBRID]</h1>
        </div>
        <div style={{ fontSize: '9px', color: isAlert ? 'var(--neon-red)' : 'var(--neon-green)' }}>[ STABLE: GEMINI-2.5-FLASH ]</div>
      </header>

      {/* 3-COLUMN HYBRID INTERFACE */}
      <div className="nexus-main" style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 10 }}>
        
        {/* LEFT: MONITOR PANEL (将来的に30項目拡張) */}
        <aside style={{ width: '280px', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: '10px', color: '#444', borderBottom: '1px solid #222', paddingBottom: '5px' }}>TELEMETRY_STATUS</div>
          {Object.values(services).map(s => (
            <div key={s.id} style={{ marginBottom: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: s.color }}>{s.name}</span>
                <span style={{ color: s.cpu > 85 ? 'var(--neon-red)' : '#666' }}>{s.cpu.toFixed(0)}%</span>
              </div>
              <div className="service-bar">
                <div className="service-fill" style={{ width: `${s.cpu}%`, background: s.cpu > 85 ? 'var(--neon-red)' : s.color }} />
              </div>
            </div>
          ))}
          {/* 追加機能スロット（将来の30個の枠） */}
          <div style={{ marginTop: 'auto', fontSize: '9px', color: '#333' }}>
            SLOT_EXT_04-30: [OFFLINE]
          </div>
        </aside>

        {/* CENTER: CORE VIZUALIZER */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ position: 'relative', width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, opacity: 0.1, transform: `scale(${1.1 + audioLevel / 80})`, transition: '0.1s' }} />
            <div style={{ position: 'absolute', width: '180px', height: '180px', border: `1px dashed var(--neon-blue)`, borderRadius: '50%', animation: 'rotate 40s linear infinite', opacity: 0.2 }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 900, textShadow: `0 0 20px var(--neon-blue)` }}>LARU</div>
              <div style={{ fontSize: '8px', color: 'var(--neon-blue)', letterSpacing: '4px' }}>INTELLIGENCE</div>
            </div>
          </div>
          <button onClick={startListening} className={`nexus-btn ${isLive ? 'listening' : ''}`} style={{ marginTop: '40px' }}>
            {isLive ? 'ANALYZING VOICE...' : 'START VOICE AI'}
          </button>
        </main>

        {/* RIGHT: INTEGRATED CHAT & LOG */}
        <section style={{ width: '450px', background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 20px', borderBottom: '1px solid #222', fontSize: '10px', color: '#444' }}>HYBRID_COMM_LOG</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column' }}>
            {logs.map(log => (
              <div key={log.id} className={`bubble bubble-${log.type}`}>
                <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', marginBottom: '3px' }}>{log.type.toUpperCase()} // {log.time}</div>
                {log.msg}
              </div>
            ))}
            {isThinking && <div className="bubble bubble-gemini" style={{ opacity: 0.5, animation: 'blink 1s infinite' }}>[ SEARCHING_GEN_2.5_KNOWLEDGE... ]</div>}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT AREA */}
          <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', padding: '8px 12px', border: '1px solid rgba(0,242,255,0.2)' }}>
              <input 
                type="text" 
                value={inputMessage} 
                onChange={e => setInputMessage(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendToGemini(); } }} 
                placeholder="命令を入力..." 
                style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '13px' }} 
              />
              <button onClick={() => sendToGemini()} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>SEND</button>
            </div>
          </div>
        </section>
      </div>

      <footer style={{ height: '28px', background: '#000', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', fontSize: '8px', color: '#333', justifyContent: 'space-between', padding: '0 15px', zIndex: 1100 }}>
        <div>© 2026 LARUbot Inc. // Project LaruNexus</div>
        <div style={{ color: 'var(--neon-green)', opacity: 0.5 }}>CONNECTED_TO_GEMINI_2.5_FLASH</div>
      </footer>
    </div>
  );
}