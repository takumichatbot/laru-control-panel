'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * LARU NEXUS COMMAND SYSTEM v15.8 [ULTIMATE]
 */

interface LogEntry { id: string; msg: string; type: 'user' | 'gemini' | 'sys' | 'sec'; time: string; }

export default function LaruNexusV15() {
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'CORE' | 'LOG'>('CORE');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string, type: 'user' | 'gemini' | 'sys' | 'sec' = 'sys') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [...prev, { id, msg, type, time }]);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs, isThinking]);

  const sendToGemini = async (text?: string) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || isThinking) return;

    setIsThinking(true);
    addLog(messageToSend, 'user');
    setInputMessage('');

    try {
      const res = await fetch(`/api/gemini?v=15.8&t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(`${data.error}: ${data.details}`);

      if (data.text) addLog(data.text, 'gemini');
    } catch (error: any) {
      addLog(`ERR_AUTH: 通信プロトコルが遮断されました。`, "sec");
      addLog(`REASON: ${error.message}`, "sys");
    } finally { setIsThinking(false); }
  };

  return (
    <div className="nexus-container" style={{ height: '100vh', background: '#050505', color: '#fff', fontFamily: 'JetBrains Mono, sans-serif', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .nexus-container::before { content: ""; position: absolute; inset: 0; background: linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.2) 50%), linear-gradient(90deg, rgba(255,0,0,0.03), rgba(0,255,0,0.01), rgba(0,0,255,0.03)); background-size: 100% 4px, 3px 100%; pointer-events: none; z-index: 1000; }
        .bubble { max-width: 85%; padding: 12px; border-radius: 10px; font-size: 14px; margin-bottom: 10px; border: 1px solid rgba(0,242,255,0.2); }
        .bubble-user { align-self: flex-end; background: rgba(0,242,255,0.05); }
        .bubble-gemini { align-self: flex-start; background: rgba(255,255,255,0.03); }
        .bubble-sys { align-self: center; border: none; color: #555; font-size: 10px; }
        .bubble-sec { align-self: center; border-color: #ff0040; color: #ff0040; background: rgba(255,0,64,0.05); }
        .nav-btn { flex: 1; padding: 15px; background: none; border: none; color: #444; cursor: pointer; border-bottom: 2px solid #222; }
        .nav-btn.active { color: #00f2ff; border-bottom-color: #00f2ff; }
      `}} />

      <header style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '14px', letterSpacing: '3px', margin: 0 }}>LARU_NEXUS_v15.8</h1>
        <div style={{ fontSize: '10px', color: '#00f2ff' }}>[ ENCRYPTED_CORE ]</div>
      </header>

      <nav style={{ display: 'flex' }}>
        {(['MONITOR', 'CORE', 'LOG'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`nav-btn ${activeTab === tab ? 'active' : ''}`}>{tab}</button>
        ))}
      </nav>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 'LOG' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              {logs.map(log => (
                <div key={log.id} className={`bubble bubble-${log.type}`}>
                  <div style={{ fontSize: '8px', opacity: 0.3, marginBottom: '4px' }}>{log.type.toUpperCase()} // {log.time}</div>
                  {log.msg}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '20px', background: '#000', borderTop: '1px solid #222' }}>
              <div style={{ display: 'flex', gap: '10px', background: '#111', padding: '10px 20px', borderRadius: '30px', border: '1px solid #333' }}>
                <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendToGemini()} placeholder="COMMAND..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none' }} />
                <button onClick={() => sendToGemini()} style={{ background: 'none', border: 'none', color: '#00f2ff', cursor: 'pointer', fontWeight: 'bold' }}>EXEC</button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'CORE' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '200px', height: '200px', border: '1px solid #00f2ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(0,242,255,0.1)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>LARU</div>
                <div style={{ fontSize: '8px', color: '#00f2ff' }}>NEXUS CORE</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer style={{ padding: '10px 20px', fontSize: '9px', color: '#333', borderTop: '1px solid #222' }}>
        © 2026 LARUbot // President T. Saito
      </footer>
    </div>
  );
}