'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// --- Types ---
interface ServiceData {
  id: string;
  name: string;
  cpu: number;
  mem: number;
  status: 'NOMINAL' | 'BUSY' | 'ERROR';
  color: string;
  description: string;
}

interface LogEntry {
  id: string;
  msg: string;
  type: 'sys' | 'gem' | 'sec';
  time: string;
}

export default function LaruNexusUltimate() {
  // UI States
  const [activeTab, setActiveTab] = useState<'status' | 'nexus' | 'terminal'>('nexus');
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  // Business States
  const [services, setServices] = useState<Record<string, ServiceData>>({
    larubot: { id: 'larubot', name: 'LARUBOT AI', cpu: 12, mem: 420, status: 'NOMINAL', color: '#00f2ff', description: 'Neural Chat Engine' },
    laruvisona: { id: 'laruvisona', name: 'LARUVISONA', cpu: 8, mem: 180, status: 'NOMINAL', color: '#39ff14', description: 'Core Web Interface' },
    flastal: { id: 'flastal', name: 'FLASTAL.COM', cpu: 32, mem: 1250, status: 'BUSY', color: '#ff006e', description: 'Distributed Node' }
  });

  // --- Logging Mechanism ---
  const addLog = useCallback((msg: string, type: 'sys' | 'gem' | 'sec' = 'sys') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [{ id, msg, type, time }, ...prev.slice(0, 50)]);
  }, []);

  // --- Function Calling Implementation ---
  const executeLocalTool = useCallback((name: string, args: any) => {
    if (name === "restart_service") {
      const { serviceId } = args;
      if (services[serviceId]) {
        setServices(prev => ({
          ...prev,
          [serviceId]: { ...prev[serviceId], status: 'NOMINAL', cpu: 0 }
        }));
        addLog(`SECURE_EXEC: ${serviceId.toUpperCase()} を再起動しました。`, 'sec');
        return "SUCCESS";
      }
    }
    if (name === "optimize_all") {
      setServices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          next[k].cpu = Math.max(5, Math.floor(next[k].cpu * 0.4));
        });
        return next;
      });
      addLog("SECURE_EXEC: 全システムのリソースを最適化しました。", 'sec');
      return "SUCCESS";
    }
    return "UNKNOWN_COMMAND";
  }, [services, addLog]);

  // --- Gemini API Gateway ---
  const sendToGemini = async (text?: string) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || isThinking) return;

    setIsThinking(true);
    addLog(`USER: ${messageToSend}`, 'sys');
    setInputMessage('');

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend })
      });

      const data = await res.json();

      if (data.functionCalls && data.functionCalls.length > 0) {
        for (const call of data.functionCalls) {
          executeLocalTool(call.name, call.args);
        }
        addLog("GEMINI: コマンドを解釈し、システム操作を実行しました。", "gem");
      } else if (data.text) {
        addLog(`GEMINI: ${data.text}`, 'gem');
      }
    } catch (error) {
      addLog("CRITICAL: 通信エラーが発生しました。", "sec");
    } finally {
      setIsThinking(false);
    }
  };

  // --- Real-time Visual Simulation ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLive) setAudioLevel(Math.random() * 100);
      setServices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          const fluctuation = Math.random() * 4 - 2;
          next[key].cpu = Math.max(2, Math.min(98, next[key].cpu + fluctuation));
        });
        return next;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="nexus-fortress" style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#000', 
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .grid-overlay {
          position: fixed; inset: 0;
          background-image: linear-gradient(rgba(6,182,212,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.05) 1px, transparent 1px);
          background-size: 30px 30px; pointer-events: none; z-index: 0;
        }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .mobile-only { display: none; }
        .desktop-flex { display: flex; }
        @media (max-width: 768px) {
          .desktop-flex { display: none; }
          .mobile-only { display: flex; }
          .mobile-content { display: none; }
          .mobile-content.active { display: flex; flex-direction: column; flex: 1; overflow-y: auto; }
        }
      `}} />
      <div className="grid-overlay" />

      {/* --- Header --- */}
      <header style={{ 
        height: '60px', borderBottom: '1px solid rgba(0,242,255,0.3)', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 20px', background: 'rgba(0,0,0,0.9)', zIndex: 1100, backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#00f2ff', boxShadow: '0 0 10px #00f2ff' }} />
          <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#00f2ff', letterSpacing: '2px' }}>
            LARU NEXUS <span style={{ fontSize: '10px', color: '#444', fontWeight: 400 }}>v10.5.0-STABLE</span>
          </h1>
        </div>
        <div style={{ fontSize: '10px', color: isLive ? '#00f2ff' : '#444' }}>
          [ NEURAL_LINK: {isLive ? 'ACTIVE' : 'STANDBY'} ]
        </div>
      </header>

      {/* --- Mobile Tabs --- */}
      <nav className="mobile-only" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#000' }}>
        {(['status', 'nexus', 'terminal'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '15px 0', fontSize: '10px', fontWeight: 'bold', border: 'none',
            background: activeTab === tab ? 'rgba(0,242,255,0.1)' : 'transparent',
            color: activeTab === tab ? '#00f2ff' : '#666',
            borderBottom: activeTab === tab ? '2px solid #00f2ff' : 'none'
          }}>
            {tab.toUpperCase()}
          </button>
        ))}
      </nav>

      {/* --- Main Content --- */}
      <div className="content-container" style={{ flex: 1, display: 'flex', position: 'relative', zIndex: 10, overflow: 'hidden' }}>
        
        {/* Left: Status */}
        <aside className={`mobile-content ${activeTab === 'status' ? 'active' : ''}`} style={{
          width: '320px', borderRight: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.6)', padding: '20px'
        }}>
          <h2 style={{ fontSize: '11px', color: '#00f2ff', marginBottom: '20px', borderBottom: '1px solid #222' }}>NODE_MONITORING</h2>
          {Object.values(services).map(s => (
            <div key={s.id} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #222', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: s.color, fontWeight: 'bold', fontSize: '12px' }}>{s.name}</span>
                <span style={{ fontSize: '10px', color: '#888' }}>{s.status}</span>
              </div>
              <div style={{ height: '4px', background: '#111', marginBottom: '10px' }}>
                <div style={{ width: `${s.cpu}%`, height: '100%', backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}`, transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => sendToGemini(`${s.name}を再起動`)} style={{ flex: 1, fontSize: '9px', padding: '5px', background: 'none', border: '1px solid #333', color: '#666' }}>RESTART</button>
                <button onClick={() => sendToGemini(`${s.name}を最適化`)} style={{ flex: 1, fontSize: '9px', padding: '5px', background: 'none', border: '1px solid #333', color: '#666' }}>OPTIMIZE</button>
              </div>
            </div>
          ))}
        </aside>

        {/* Center: Nexus */}
        <main className={`mobile-content ${activeTab === 'nexus' ? 'active' : ''}`} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ position: 'relative', width: '280px', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
              position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #00f2ff',
              opacity: isLive ? 0.4 : 0.1, transform: `scale(${1 + audioLevel / 150})`, transition: 'transform 0.1s'
            }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', fontWeight: 900, color: '#fff', textShadow: '0 0 20px #00f2ff' }}>LARU</div>
              <div style={{ fontSize: '10px', color: '#00f2ff', letterSpacing: '5px', marginTop: '5px' }}>NEXUS CORE</div>
            </div>
          </div>
          <button onClick={() => setIsLive(!isLive)} style={{
            marginTop: '50px', padding: '15px 40px', background: isLive ? 'rgba(255,0,64,0.1)' : 'rgba(0,242,255,0.05)',
            border: `2px solid ${isLive ? '#ff0040' : '#00f2ff'}`, color: isLive ? '#ff0040' : '#00f2ff',
            fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s'
          }}>
            {isLive ? 'TERMINATE_LINK' : 'INITIATE_LINK'}
          </button>
        </main>

        {/* Right: Terminal */}
        <section className={`mobile-content ${activeTab === 'terminal' ? 'active' : ''}`} style={{
          width: '380px', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(5,5,5,0.95)', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #222', fontSize: '10px', color: '#666' }}>TERMINAL_LOG</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column-reverse', gap: '10px' }}>
            {isThinking && <div style={{ color: '#00f2ff', fontSize: '10px', animation: 'pulse 1s infinite' }}>THINKING...</div>}
            {logs.map(log => (
              <div key={log.id} style={{ fontSize: '11px', display: 'flex', gap: '10px' }}>
                <span style={{ color: '#444' }}>[{log.time}]</span>
                <span style={{ color: log.type === 'gem' ? '#fff' : log.type === 'sec' ? '#ff0040' : '#00b4d8' }}>{log.msg}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '20px', borderTop: '1px solid #222', background: '#000' }}>
            <input 
              type="text" 
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendToGemini()}
              placeholder="COMMAND..."
              style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #333', color: '#39ff14', padding: '5px', fontSize: '12px', outline: 'none' }}
            />
          </div>
        </section>
      </div>

      {/* --- Desktop Media Queries (CSS override) --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 769px) {
          .mobile-content { display: flex !important; }
          .mobile-only { display: none !important; }
        }
      `}} />
    </div>
  );
}