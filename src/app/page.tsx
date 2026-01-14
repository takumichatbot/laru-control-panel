'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v15.3 [CONVERSATIONAL AI MODE]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President / Komazawa Law Student)
 * DATE: 2026-01-15
 * DESCRIPTION: 
 * Geminiライクな対話インターフェースを統合したサイバーパンク・コマンドセンター。
 * ログセクションを「相互会話」に最適化。
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

export default function LaruNexusV15() {
  // --- 状態管理 (State Management) ---
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'CORE' | 'LOG'>('CORE');
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
    flastal: { id: 'flastal', name: 'FLASTAL.NET', cpu: 42, mem: 1100, status: 'HEAVY', color: '#ff006e' }
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ログ・会話の追加プロトコル
  const addLog = useCallback((msg: string, type: 'user' | 'gemini' | 'sys' | 'sec' = 'sys') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [...prev, { id, msg, type, time }]); // 会話の流れを重視するため下に追加
  }, []);

  // 自動スクロール
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isThinking]);

  // --- Gemini 実行プロトコル (相互対話エンジン) ---
  const sendToGemini = async (text?: string) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || isThinking) return;

    setIsThinking(true);
    addLog(messageToSend, 'user'); // ユーザーの発言として記録
    setInputMessage('');

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend })
      });

      if (!res.ok) throw new Error(`ERR_CONN_FAILED: ${res.status}`);
      const data = await res.json();

      if (data.functionCalls) {
        data.functionCalls.forEach((call: any) => {
          if (call.name === "restart_service") {
            const sid = call.args.serviceId;
            setServices(prev => ({ ...prev, [sid]: { ...prev[sid], status: 'NOMINAL', cpu: 0 } }));
            addLog(`RESTORE: ${sid.toUpperCase()} サービスを再起動しました。`, 'sec');
          }
        });
        addLog("命令を処理しました。システムを最適化済みです。", "gemini");
      } else if (data.text) {
        addLog(data.text, 'gemini'); // AIの回答として記録
      }
    } catch (error: any) {
      addLog(`ERR_AUTH: 通信プロトコルが遮断されました。`, "sec");
      addLog(`INFO: Renderの環境変数(GEMINI_API_KEY)を再検証してください。`, "sys");
    } finally {
      setIsThinking(false);
    }
  };

  // --- 音声認識プロトコル ---
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("ERR: 音声認識未対応ブラウザです。", "sec");

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.start();
    setIsLive(true);

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

  // テレメトリ自動更新
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
        
        :root { --neon-blue: #00f2ff; --neon-red: #ff0040; --neon-green: #39ff14; --bg-dark: #050505; }
        .nexus-container { height: 100vh; background: var(--bg-dark); color: #fff; font-family: 'JetBrains Mono', 'Noto Sans JP', sans-serif; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(0, 242, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.03) 1px, transparent 1px); background-size: 50px 50px; z-index: 0; }
        
        .panel-content { display: none; flex-direction: column; height: 100%; overflow: hidden; }
        .panel-content.active { display: flex; }

        /* チャット吹き出しデザイン */
        .bubble { max-width: 85%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.6; position: relative; }
        .bubble-user { align-self: flex-end; background: rgba(0, 242, 255, 0.1); border: 1px solid var(--neon-blue); color: #fff; border-bottom-right-radius: 2px; }
        .bubble-gemini { align-self: flex-start; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); color: #e0e0e0; border-bottom-left-radius: 2px; }
        .bubble-sys { align-self: center; background: transparent; border: none; color: #666; font-size: 11px; text-transform: uppercase; }
        .bubble-sec { align-self: center; background: rgba(255, 0, 64, 0.1); border: 1px solid var(--neon-red); color: var(--neon-red); font-size: 11px; }

        @media (max-width: 1024px) { .side-panel { position: absolute; inset: 0; width: 100%; z-index: 300; background: var(--bg-dark); display: none; } .side-panel.active { display: flex; } }
        .nexus-btn { background: transparent; border: 1px solid var(--neon-blue); color: var(--neon-blue); padding: 12px 24px; font-weight: bold; cursor: pointer; text-transform: uppercase; letter-spacing: 2px; transition: 0.2s; }
        .nexus-btn:hover { background: var(--neon-blue); color: #000; box-shadow: 0 0 20px var(--neon-blue); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
      <div className="grid-bg" />

      {/* HEADER */}
      <header style={{ height: '64px', borderBottom: '1px solid rgba(0, 242, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '40px', height: '40px', border: `2px solid ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '60%', height: '60%', background: isAlert ? 'var(--neon-red)' : 'var(--neon-blue)', boxShadow: `0 0 15px ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}` }} />
          </div>
          <div><h1 style={{ fontSize: '16px', letterSpacing: '4px', margin: 0 }}>LARU_NEXUS_OS</h1></div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '10px', color: isAlert ? 'var(--neon-red)' : 'var(--neon-green)' }}>&lt; SECURE_CONNECTION_ESTABLISHED &gt;</div>
      </header>

      {/* TAB NAV (Mobile/Desktop統合) */}
      <nav style={{ display: 'flex', background: '#000', borderBottom: '1px solid #222', zIndex: 400 }}>
        {(['MONITOR', 'CORE', 'LOG'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '15px', border: 'none', background: 'transparent', color: activeTab === tab ? 'var(--neon-blue)' : '#444', borderBottom: activeTab === tab ? '2px solid var(--neon-blue)' : 'none', fontSize: '11px', fontWeight: 'bold' }}>{tab}</button>
        ))}
      </nav>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', zIndex: 10 }}>
        
        {/* MONITOR PANEL */}
        <aside className={`panel-content ${activeTab === 'MONITOR' ? 'active' : ''}`} style={{ width: '380px', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '30px', gap: '20px' }}>
          {Object.values(services).map(s => (
            <div key={s.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: s.color, fontWeight: 'bold' }}>{s.name}</span>
                <span style={{ fontSize: '10px', color: s.cpu > 80 ? 'var(--neon-red)' : '#666' }}>{s.cpu.toFixed(1)}%</span>
              </div>
              <div style={{ height: '2px', background: '#111' }}><div style={{ width: `${s.cpu}%`, height: '100%', background: s.cpu > 80 ? 'var(--neon-red)' : s.color, transition: '0.5s' }} /></div>
            </div>
          ))}
        </aside>

        {/* CORE PANEL */}
        <main className={`panel-content ${activeTab === 'CORE' ? 'active' : ''}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '320px', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, opacity: 0.1, transform: `scale(${1.2 + audioLevel / 100})`, transition: '0.1s' }} />
            <div style={{ position: 'absolute', width: '250px', height: '250px', border: `1px dashed var(--neon-blue)`, borderRadius: '50%', animation: 'spin 30s linear infinite', opacity: 0.2 }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '50px', fontWeight: 900, textShadow: `0 0 30px var(--neon-blue)` }}>LARU</div>
              <div style={{ fontSize: '10px', color: 'var(--neon-blue)', letterSpacing: '5px' }}>NEXUS CORE</div>
            </div>
          </div>
          <button onClick={startListening} className={`nexus-btn ${isLive ? 'listening' : ''}`} style={{ marginTop: '50px' }}>{isLive ? '指示を解析中...' : '音声対話モード'}</button>
        </main>

        {/* CHAT/LOG PANEL (Gemini Like UI) */}
        <section className={`panel-content ${activeTab === 'LOG' ? 'active' : ''}`} style={{ flex: 1, background: 'rgba(0,0,0,0.4)', display: activeTab === 'LOG' ? 'flex' : 'none' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {logs.length === 0 && <div className="bubble bubble-sys">システムオンライン。対話プロトコル待機中。</div>}
            {logs.map(log => (
              <div key={log.id} className={`bubble bubble-${log.type}`}>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>{log.type.toUpperCase()} // {log.time}</div>
                {log.msg}
              </div>
            ))}
            {isThinking && (
              <div className="bubble bubble-gemini" style={{ opacity: 0.6 }}>
                <span style={{ animation: 'blink 1s infinite' }}>● ● ●</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT AREA */}
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '25px', padding: '10px 20px', border: '1px solid rgba(0,242,255,0.2)' }}>
              <input 
                type="text" 
                value={inputMessage} 
                onChange={e => setInputMessage(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && sendToGemini()} 
                placeholder="NEXUSに指示を入力..." 
                style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '15px' }} 
              />
              <button onClick={() => sendToGemini()} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer', fontWeight: 'bold' }}>SEND</button>
            </div>
          </div>
        </section>
      </div>

      <footer style={{ height: '32px', background: '#000', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', fontSize: '9px', color: '#444', justifyContent: 'space-between', padding: '0 20px' }}>
        <div>© 2026 LARUbot Inc. // President Saito</div>
        <div style={{ color: 'var(--neon-green)' }}>● PROTOCOL_SECURE</div>
      </footer>
    </div>
  );
}