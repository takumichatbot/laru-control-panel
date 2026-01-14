'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * LARU NEXUS COMMAND SYSTEM v15.6 [STABLE_INTERFACE]
 * 齋藤拓海社長専用：キャッシュ破棄プロトコル実装
 */

interface ServiceData {
  id: string;
  name: string;
  cpu: number;
  status: 'NOMINAL' | 'CRITICAL';
  color: string;
}

interface LogEntry {
  id: string;
  msg: string;
  type: 'user' | 'gemini' | 'sys' | 'sec';
  time: string;
}

export default function LaruNexusV15() {
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'CORE' | 'LOG'>('CORE');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [services, setServices] = useState<Record<string, ServiceData>>({
    larubot: { id: 'larubot', name: 'LARUBOT-AI', cpu: 12, status: 'NOMINAL', color: '#00f2ff' },
    laruvisona: { id: 'laruvisona', name: 'LARUVISONA', cpu: 8, status: 'NOMINAL', color: '#39ff14' },
    flastal: { id: 'flastal', name: 'FLASTAL.NET', cpu: 42, status: 'NOMINAL', color: '#ff006e' }
  });

  const addLog = useCallback((msg: string, type: 'user' | 'gemini' | 'sys' | 'sec' = 'sys') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [...prev, { id, msg, type, time }]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isThinking]);

  const sendToGemini = async (text?: string) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || isThinking) return;

    setIsThinking(true);
    addLog(messageToSend, 'user');
    setInputMessage('');

    try {
      // キャッシュを強制的に回避するためのタイムスタンプを追加
      const res = await fetch(`/api/gemini?timestamp=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(`${data.error}: ${data.details || 'Unknown Error'}`);
      }

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

  // テレメトリのダミー更新
  useEffect(() => {
    const interval = setInterval(() => {
      setServices(prev => {
        const next = { ...prev };
        let anyCritical = false;
        Object.keys(next).forEach(key => {
          const drift = Math.random() * 10 - 5;
          next[key].cpu = Math.max(5, Math.min(99, next[key].cpu + drift));
          if (next[key].cpu > 90) anyCritical = true;
        });
        setIsAlert(anyCritical);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`nexus-container ${isAlert ? 'alert-active' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Noto+Sans+JP:wght@300;400;700&display=swap');
        :root { --neon-blue: #00f2ff; --neon-red: #ff0040; --neon-green: #39ff14; --bg-dark: #050505; }
        .nexus-container { height: 100vh; background: var(--bg-dark); color: #fff; font-family: 'JetBrains Mono', 'Noto Sans JP', sans-serif; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(0, 242, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.03) 1px, transparent 1px); background-size: 50px 50px; z-index: 0; }
        .panel-content { display: none; flex-direction: column; height: 100%; overflow: hidden; }
        .panel-content.active { display: flex; }
        .bubble { max-width: 85%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.6; margin-bottom: 8px; }
        .bubble-user { align-self: flex-end; background: rgba(0, 242, 255, 0.1); border: 1px solid var(--neon-blue); border-bottom-right-radius: 2px; }
        .bubble-gemini { align-self: flex-start; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); border-bottom-left-radius: 2px; }
        .bubble-sys { align-self: center; color: #666; font-size: 11px; }
        .bubble-sec { align-self: center; background: rgba(255, 0, 64, 0.1); border: 1px solid var(--neon-red); color: var(--neon-red); font-size: 11px; }
        @keyframes pulse-red { 50% { border-color: var(--neon-red); box-shadow: inset 0 0 20px rgba(255,0,64,0.2); } }
        .alert-active { animation: pulse-red 1s infinite; }
      `}} />
      <div className="grid-bg" />

      {/* HEADER */}
      <header style={{ height: '60px', borderBottom: '1px solid rgba(0, 242, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'rgba(0,0,0,0.8)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '20px', height: '20px', background: isAlert ? 'var(--neon-red)' : 'var(--neon-blue)' }} />
          <h1 style={{ fontSize: '14px', letterSpacing: '2px' }}>LARU_NEXUS_OS v15.6</h1>
        </div>
        <div style={{ fontSize: '10px', color: '#444' }}>USER: Saito_Takumi // STATUS: {isAlert ? 'CRITICAL' : 'STABLE'}</div>
      </header>

      {/* NAV */}
      <nav style={{ display: 'flex', borderBottom: '1px solid #222', zIndex: 100 }}>
        {(['MONITOR', 'CORE', 'LOG'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: activeTab === tab ? 'var(--neon-blue)' : '#444', borderBottom: activeTab === tab ? '2px solid var(--neon-blue)' : 'none', fontWeight: 'bold', cursor: 'pointer' }}>{tab}</button>
        ))}
      </nav>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', zIndex: 10 }}>
        
        {/* MONITOR */}
        <aside className={`panel-content ${activeTab === 'MONITOR' ? 'active' : ''}`} style={{ width: '300px', borderRight: '1px solid #222', padding: '20px', gap: '15px' }}>
          {Object.values(services).map(s => (
            <div key={s.id} style={{ background: '#111', padding: '15px', border: '1px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span style={{ color: s.color }}>{s.name}</span>
                <span>{s.cpu.toFixed(0)}%</span>
              </div>
              <div style={{ height: '2px', background: '#222' }}><div style={{ width: `${s.cpu}%`, height: '100%', background: s.color }} /></div>
            </div>
          ))}
        </aside>

        {/* CORE */}
        <main className={`panel-content ${activeTab === 'CORE' ? 'active' : ''}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--neon-blue)', borderRadius: '50%', boxShadow: '0 0 20px rgba(0,242,255,0.2)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>LARU</div>
              <div style={{ fontSize: '8px', color: 'var(--neon-blue)' }}>NEXUS CORE</div>
            </div>
          </div>
        </main>

        {/* LOG (CHAT) */}
        <section className={`panel-content ${activeTab === 'LOG' ? 'active' : ''}`} style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            {logs.map(log => (
              <div key={log.id} className={`bubble bubble-${log.type}`}>
                <div style={{ fontSize: '8px', opacity: 0.3 }}>{log.type.toUpperCase()} // {log.time}</div>
                {log.msg}
              </div>
            ))}
            {isThinking && <div style={{ fontSize: '10px', color: 'var(--neon-blue)', padding: '10px' }}>分析中...</div>}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '20px', background: '#000', borderTop: '1px solid #222' }}>
            <div style={{ display: 'flex', gap: '10px', background: '#111', padding: '10px 15px', borderRadius: '20px', border: '1px solid #333' }}>
              <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendToGemini()} placeholder="コマンドを入力..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none' }} />
              <button onClick={() => sendToGemini()} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer', fontWeight: 'bold' }}>EXEC</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}