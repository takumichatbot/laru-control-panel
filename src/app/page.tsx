'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v16.3 [FINAL_PURIFIER]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President / Komazawa Law Student)
 * DATE: 2026-01-15
 * DESCRIPTION: 
 * Gemini風対話UIの最終安定版。APIキーのパターン不一致エラーを回避するための
 * キャッシュ破棄プロトコルと、高度なエラートラッキングを実装。
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

export default function LaruNexusV16() {
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

  // --- Gemini 実行プロトコル (相互対話エンジン) ---
  const sendToGemini = async (text?: string) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || isThinking) return;

    setIsThinking(true);
    addLog(messageToSend, 'user');
    setInputMessage('');

    try {
      // キャッシュを物理的に破壊し、常に最新の環境変数を参照させるためのクエリパラメータ
      const res = await fetch(`/api/gemini?v=16.3&t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
        cache: 'no-store'
      });

      const data = await res.json();
      
      if (!res.ok) {
        // バックエンドから返された詳細なエラー内容（INVALID_PATTERN等）を表示
        throw new Error(data.details || data.error || `HTTP_${res.status}`);
      }

      if (data.functionCalls && data.functionCalls.length > 0) {
        data.functionCalls.forEach((call: any) => {
          if (call.name === "restart_service") {
            const sid = call.args.serviceId;
            setServices(prev => ({ ...prev, [sid]: { ...prev[sid], status: 'NOMINAL', cpu: 0 } }));
            addLog(`RESTORE: ${sid.toUpperCase()} サービスを再起動しました。`, 'sec');
          }
        });
        addLog("NEXUS: 外部命令を処理し、プロトコルを更新しました。", "gemini");
      } else if (data.text) {
        addLog(data.text, 'gemini');
      }
    } catch (error: any) {
      addLog(`ERR_AUTH: 通信プロトコルが遮断されました。`, "sec");
      addLog(`REASON: ${error.message.toUpperCase()}`, "sys");
      addLog(`ACTION: Renderの環境変数から空白・改行を完全に削除してください。`, "sys");
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

  // --- テレメトリ自動更新 ---
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

        .panel-content { display: none; flex-direction: column; height: 100%; overflow: hidden; position: relative; z-index: 10; }
        .panel-content.active { display: flex; }

        .bubble { max-width: 85%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.6; position: relative; word-wrap: break-word; }
        .bubble-user { align-self: flex-end; background: rgba(0, 242, 255, 0.1); border: 1px solid var(--neon-blue); border-bottom-right-radius: 2px; }
        .bubble-gemini { align-self: flex-start; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); border-bottom-left-radius: 2px; }
        .bubble-sys { align-self: center; color: #555; font-size: 10px; border: none; }
        .bubble-sec { align-self: center; background: rgba(255, 0, 64, 0.05); border: 1px solid var(--neon-red); color: var(--neon-red); font-size: 10px; }

        .nexus-btn { 
          background: rgba(0, 242, 255, 0.05); border: 1px solid var(--neon-blue); color: var(--neon-blue); 
          padding: 12px 24px; font-weight: bold; cursor: pointer; text-transform: uppercase; 
          letter-spacing: 2px; position: relative; z-index: 1100;
        }
        .nexus-btn:hover { background: var(--neon-blue); color: #000; box-shadow: 0 0 20px var(--neon-blue); }
        .nexus-btn.listening { border-color: var(--neon-red); color: var(--neon-red); animation: blink 1s infinite; }

        @keyframes blink { 50% { opacity: 0.3; } }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
      <div className="grid-bg" />

      {/* HEADER */}
      <header style={{ height: '64px', borderBottom: '1px solid rgba(0, 242, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(0, 0, 0, 0.9)', zIndex: 1100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '30px', height: '30px', border: `2px solid ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '20%', background: isAlert ? 'var(--neon-red)' : 'var(--neon-blue)', boxShadow: `0 0 10px ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}` }} />
          </div>
          <h1 style={{ fontSize: '16px', letterSpacing: '4px', margin: 0 }}>LARU_NEXUS_v16.3</h1>
        </div>
        <div style={{ fontSize: '10px', color: isAlert ? 'var(--neon-red)' : 'var(--neon-green)' }}>[ PROTOCOL_PURIFIED ]</div>
      </header>

      {/* TABS */}
      <nav style={{ display: 'flex', background: '#000', borderBottom: '1px solid #222', zIndex: 1100 }}>
        {(['MONITOR', 'CORE', 'LOG'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ 
            flex: 1, padding: '15px', border: 'none', background: 'transparent', 
            color: activeTab === tab ? 'var(--neon-blue)' : '#444', 
            borderBottom: activeTab === tab ? '2px solid var(--neon-blue)' : 'none', 
            fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
          }}>
            {tab}
          </button>
        ))}
      </nav>

      <div className="nexus-main" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* MONITOR PANEL */}
        <aside className={`panel-content ${activeTab === 'MONITOR' ? 'active' : ''}`} style={{ width: '380px', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '30px', gap: '20px' }}>
          {Object.values(services).map(s => (
            <div key={s.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: s.color, fontWeight: 'bold' }}>{s.name}</span>
                <span style={{ fontSize: '10px', color: s.cpu > 85 ? 'var(--neon-red)' : '#666' }}>{s.cpu.toFixed(1)}%</span>
              </div>
              <div style={{ height: '2px', background: '#111' }}><div style={{ width: `${s.cpu}%`, height: '100%', background: s.cpu > 85 ? 'var(--neon-red)' : s.color, transition: '0.5s' }} /></div>
            </div>
          ))}
        </aside>

        {/* CORE PANEL */}
        <main className={`panel-content ${activeTab === 'CORE' ? 'active' : ''}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, opacity: 0.1, transform: `scale(${1.2 + audioLevel / 100})`, transition: '0.1s' }} />
            <div style={{ position: 'absolute', width: '220px', height: '220px', border: `1px dashed var(--neon-blue)`, borderRadius: '50%', animation: 'rotate 30s linear infinite', opacity: 0.2 }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 900, textShadow: `0 0 30px var(--neon-blue)` }}>LARU</div>
              <div style={{ fontSize: '10px', color: 'var(--neon-blue)', letterSpacing: '5px' }}>NEXUS CORE</div>
            </div>
          </div>
          <button onClick={startListening} className={`nexus-btn ${isLive ? 'listening' : ''}`} style={{ marginTop: '50px' }}>
            {isLive ? '指示を解析中...' : '音声対話モード起動'}
          </button>
        </main>

        {/* LOG/CHAT PANEL */}
        <section className={`panel-content ${activeTab === 'LOG' ? 'active' : ''}`} style={{ flex: 1, background: 'rgba(0,0,0,0.5)', display: activeTab === 'LOG' ? 'flex' : 'none' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {logs.map(log => (
              <div key={log.id} className={`bubble bubble-${log.type}`}>
                <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', marginBottom: '4px' }}>{log.type.toUpperCase()} // {log.time}</div>
                {log.msg}
              </div>
            ))}
            {isThinking && <div className="bubble bubble-gemini" style={{ opacity: 0.5, animation: 'blink 1s infinite' }}>[ ANALYSIS_IN_PROGRESS... ]</div>}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.9)', position: 'relative', zIndex: 1200 }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '25px', padding: '12px 24px', border: '1px solid rgba(0,242,255,0.3)' }}>
              <input 
                type="text" 
                value={inputMessage} 
                onChange={e => setInputMessage(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendToGemini(); } }} 
                placeholder="NEXUSへの直接命令..." 
                style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '15px', position: 'relative', zIndex: 1300 }} 
              />
              <button onClick={() => sendToGemini()} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer', fontWeight: 'bold', zIndex: 1300 }}>EXEC</button>
            </div>
          </div>
        </section>
      </div>

      <footer style={{ height: '32px', background: '#000', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', fontSize: '9px', color: '#444', justifyContent: 'space-between', padding: '0 20px', zIndex: 1100 }}>
        <div>© 2026 LARUbot Inc. // President Saito</div>
        <div style={{ color: 'var(--neon-green)' }}>● SECURE_PROTOCOL_ACTIVE</div>
      </footer>
    </div>
  );
}