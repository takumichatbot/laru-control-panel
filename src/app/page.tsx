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
}

interface LogEntry {
  id: string;
  msg: string;
  type: 'sys' | 'gem' | 'sec';
  time: string;
}

export default function LaruNexusSecure() {
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [services, setServices] = useState<Record<string, ServiceData>>({
    larubot: { id: 'larubot', name: 'LARUBOT AI', cpu: 12, mem: 420, status: 'NOMINAL', color: '#00f2ff' },
    laruvisona: { id: 'laruvisona', name: 'LARUVISONA', cpu: 8, mem: 180, status: 'NOMINAL', color: '#39ff14' },
    flastal: { id: 'flastal', name: 'FLASTAL.COM', cpu: 32, mem: 1250, status: 'BUSY', color: '#ff006e' }
  });

  const addLog = useCallback((msg: string, type: 'sys' | 'gem' | 'sec' = 'sys') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [{ id, msg, type, time }, ...prev.slice(0, 40)]);
  }, []);

  // --- 実際の状態を操作する関数 ---
  const executeLocalTool = (name: string, args: any) => {
    if (name === "restart_service") {
      const { serviceId } = args;
      setServices(prev => ({
        ...prev,
        [serviceId]: { ...prev[serviceId], status: 'NOMINAL', cpu: 0 }
      }));
      addLog(`SYSTEM_ACTION: ${serviceId} を再起動しました。`, 'sec');
      return "完了しました。";
    }
    if (name === "optimize_all") {
      setServices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { next[k].cpu = Math.max(5, next[k].cpu - 15); });
        return next;
      });
      addLog("SYSTEM_ACTION: 全システムを最適化しました。", 'sec');
      return "完了しました。";
    }
    return "未知のコマンドです。";
  };

  // --- バックエンドAPI経由でGeminiを実行 ---
  const sendToGemini = async (userInput: string) => {
    setIsThinking(true);
    addLog(`USER: ${userInput}`, 'sys');

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput })
      });

      const data = await res.json();

      if (data.functionCalls) {
        // 関数呼び出しが必要な場合、ローカルで実行
        for (const call of data.functionCalls) {
          executeLocalTool(call.name, call.args);
        }
        addLog("GEMINI: コマンドを実行し、システムの状態を更新しました。", "gem");
      } else {
        addLog(`GEMINI: ${data.text}`, 'gem');
      }
    } catch (error) {
      addLog("ERROR: バックエンド通信に失敗しました。", "sec");
    } finally {
      setIsThinking(false);
    }
  };

  // シミュレーション
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLive) setAudioLevel(Math.random() * 100);
      setServices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          next[key].cpu = Math.max(5, Math.min(95, next[key].cpu + (Math.random() * 4 - 2)));
        });
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="nexus-fortress" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="grid-overlay" />
      <header style={{ height: '60px', borderBottom: '1px solid rgba(0,242,255,0.2)', display: 'flex', alignItems: 'center', padding: '0 25px', background: 'rgba(0,0,0,0.9)', zIndex: 1100 }}>
        <h1 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--neon-cyan)', letterSpacing: '2px' }}>LARU COMMAND <span style={{ fontSize: '10px', color: '#666' }}>v9.0-SECURE</span></h1>
      </header>

      <div className="desktop-layout" style={{ flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr 400px', overflow: 'hidden' }}>
        <aside style={{ borderRight: '1px solid rgba(255,255,255,0.1)', padding: '20px', background: 'rgba(0,0,0,0.6)' }}>
          <h2 style={{ fontSize: '11px', color: 'var(--neon-cyan)', marginBottom: '20px' }}>SECURE_NODES</h2>
          {Object.values(services).map(s => (
            <div key={s.id} style={{ marginBottom: '25px', padding: '15px', border: '1px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '12px', color: s.color }}>{s.name}</span>
              </div>
              <div className="progress-container"><div className="progress-fill" style={{ width: `${s.cpu}%`, backgroundColor: s.color }} /></div>
            </div>
          ))}
        </aside>

        <main style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '250px', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--neon-cyan)', transform: `scale(${1 + audioLevel/150})`, opacity: 0.3 }} />
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>LARU</div>
          </div>
          <button onClick={() => setIsLive(!isLive)} style={{ marginTop: '40px', padding: '10px 30px', background: 'none', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)', cursor: 'pointer' }}>
            {isLive ? 'TERMINATE' : 'INITIATE'}
          </button>
        </main>

        <section style={{ display: 'flex', flexDirection: 'column', background: 'var(--terminal-bg)', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column-reverse' }}>
            {isThinking && <div className="log-entry type-gem">SECURE_QUERYING...</div>}
            {logs.map(log => (
              <div key={log.id} className={`log-entry type-${log.type}`}>
                <span style={{ color: '#444', marginRight: '8px' }}>[{log.time}]</span>
                <span>{log.msg}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '20px', borderTop: '1px solid #222' }}>
            <input type="text" placeholder="SECURE COMMAND..." style={{ background: 'none', border: 'none', color: 'var(--neon-green)', width: '100%', outline: 'none' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value;
                  if (val) { sendToGemini(val); (e.target as HTMLInputElement).value = ''; }
                }
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}