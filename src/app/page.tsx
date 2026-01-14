'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// 型定義
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

export default function LaruNexusPro() {
  // 状態管理
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [services, setServices] = useState<Record<string, ServiceData>>({
    larubot: { id: 'larubot', name: 'LARUBOT AI', cpu: 12, mem: 420, status: 'NOMINAL', color: '#00f2ff' },
    laruvisona: { id: 'laruvisona', name: 'LARUVISONA', cpu: 8, mem: 180, status: 'NOMINAL', color: '#39ff14' },
    flastal: { id: 'flastal', name: 'FLASTAL.COM', cpu: 32, mem: 1250, status: 'BUSY', color: '#ff006e' }
  });

  // ログ追加関数
  const addLog = useCallback((msg: string, type: 'sys' | 'gem' | 'sec' = 'sys') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [{ id, msg, type, time }, ...prev.slice(0, 40)]);
  }, []);

  // Geminiの思考プロセスシミュレーター
  const executeCommand = useCallback(async (input: string) => {
    setIsThinking(true);
    addLog(`USER_INPUT: ${input}`, 'sys');
    
    const steps = [
      { msg: 'NEXUS NEURAL SCAN INITIALIZED...', delay: 500 },
      { msg: 'ANALYZING INFRASTRUCTURE VULNERABILITIES...', delay: 800 },
      { msg: 'SYNCING WITH GEMINI LIVE ENGINE...', delay: 600 },
      { msg: `ADVISORY: ${input} に関するプロトコルを実行しました。全システム正常です。`, type: 'gem', delay: 400 }
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, step.delay));
      addLog(step.msg, (step.type as any) || 'sys');
    }
    setIsThinking(false);
  }, [addLog]);

  // 音声レベル・リソースの動的シミュレーション
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLive) setAudioLevel(Math.random() * 100);
      setServices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          next[key].cpu = Math.max(5, Math.min(95, next[key].cpu + (Math.random() * 10 - 5)));
        });
        return next;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="nexus-fortress" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="grid-overlay" />

      {/* ヘッダー: システム情報 */}
      <header style={{ 
        height: '60px', borderBottom: '1px solid rgba(0,242,255,0.2)', 
        display: 'flex', alignItems: 'center', padding: '0 25px', 
        background: 'rgba(0,0,0,0.9)', zIndex: 1100 
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--neon-cyan)', letterSpacing: '2px' }}>
            LARU NEXUS COMMAND <span style={{ fontSize: '10px', color: '#666' }}>v6.2.0-PRO</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}>
          <div style={{ color: '#39ff14' }}>[ UPTIME: 1,244H ]</div>
          <div style={{ color: isLive ? 'var(--neon-cyan)' : '#444' }}>[ GEMINI_LIVE: {isLive ? 'CONNECTED' : 'STANDBY'} ]</div>
        </div>
      </header>

      {/* メインレイアウト */}
      <div className="desktop-layout" style={{ flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr 400px', overflow: 'hidden' }}>
        
        {/* 左カラム: 高度なサービスモニタリング */}
        <aside style={{ borderRight: '1px solid rgba(255,255,255,0.1)', padding: '20px', background: 'rgba(0,0,0,0.6)', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '12px', color: 'var(--neon-cyan)', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
            SYSTEM_RESOURCES
          </h2>
          {Object.values(services).map(s => (
            <div key={s.id} style={{ marginBottom: '25px', padding: '15px', background: 'rgba(255,255,255,0.02)', border: '1px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px', color: s.color }}>{s.name}</span>
                <span style={{ fontSize: '10px', color: s.status === 'ERROR' ? 'var(--danger)' : '#888' }}>{s.status}</span>
              </div>
              <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '5px' }}>CPU UTILIZATION: {s.cpu.toFixed(1)}%</div>
              <div className="progress-container">
                <div className="progress-fill" style={{ width: `${s.cpu}%`, backgroundColor: s.color, color: s.color }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                <button onClick={() => addLog(`SCALING ${s.name} RESOURCES...`, 'sys')} style={{ flex: 1, background: 'none', border: '1px solid #333', color: '#666', fontSize: '9px', padding: '5px', cursor: 'pointer' }}>SCALE</button>
                <button onClick={() => addLog(`FLUSHING ${s.name} LOGS...`, 'sys')} style={{ flex: 1, background: 'none', border: '1px solid #333', color: '#666', fontSize: '9px', padding: '5px', cursor: 'pointer' }}>FLUSH</button>
              </div>
            </div>
          ))}
        </aside>

        {/* 中央: Gemini Live スペクトラム・ハブ */}
        <main style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="visualizer-container" style={{ position: 'relative', width: '350px', height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* 動的オーラ波形 */}
            <div style={{ 
              position: 'absolute', inset: 0, borderRadius: '50%', 
              border: '2px solid var(--neon-cyan)', opacity: 0.2,
              transform: `scale(${1 + audioLevel/150})`,
              boxShadow: isLive ? `0 0 ${audioLevel}px var(--neon-cyan)` : 'none',
              transition: 'transform 0.1s ease-out'
            }} />
            <div className="hub-core" style={{ textAlign: 'center', zIndex: 10 }}>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', textShadow: '0 0 20px var(--neon-cyan)' }}>LARU</div>
              <div style={{ fontSize: '12px', color: 'var(--neon-cyan)', letterSpacing: '5px', marginTop: '5px' }}>NEXUS CORE</div>
            </div>
            {/* 回転リング群 */}
            <div className="rotating-ring" style={{ position: 'absolute', width: '280px', height: '280px', border: '1px dashed rgba(0,242,255,0.2)', borderRadius: '50%', animation: 'rotate 20s linear infinite' }} />
          </div>

          <div style={{ marginTop: '50px', display: 'flex', gap: '20px' }}>
            <button 
              onClick={() => {
                setIsLive(!isLive);
                addLog(isLive ? 'GEMINI_LIVE DISCONNECTED' : 'GEMINI_LIVE CONNECTED', 'gem');
              }}
              style={{
                padding: '15px 40px', background: isLive ? 'rgba(255,0,64,0.2)' : 'rgba(0,242,255,0.1)',
                border: `1px solid ${isLive ? 'var(--danger)' : 'var(--neon-cyan)'}`,
                color: isLive ? 'var(--danger)' : 'var(--neon-cyan)',
                fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              {isLive ? 'TERMINATE LIVE' : 'INITIATE GEMINI LIVE'}
            </button>
          </div>
        </main>

        {/* 右カラム: インテリジェント・ターミナル */}
        <section className="terminal-column" style={{ display: 'flex', flexDirection: 'column', background: 'var(--terminal-bg)', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #222', fontSize: '11px', color: '#666', fontWeight: 'bold' }}>
            TERMINAL_INTERFACE_STREAMS
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column-reverse' }}>
            {isThinking && <div className="log-entry type-gem">NEURAL_THINKING...</div>}
            {logs.map(log => (
              <div key={log.id} className={`log-entry type-${log.type}`}>
                <span style={{ color: '#444', marginRight: '8px' }}>[{log.time}]</span>
                <span style={{ color: log.type === 'gem' ? 'var(--neon-cyan)' : 'inherit' }}>{log.msg}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '20px', borderTop: '1px solid #222' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ color: 'var(--neon-cyan)' }}>&gt;</span>
              <input 
                type="text" 
                placeholder="EXECUTE PROTOCOL..." 
                style={{ background: 'none', border: 'none', color: 'var(--neon-green)', outline: 'none', flex: 1, fontFamily: 'inherit', fontSize: '12px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = (e.target as HTMLInputElement).value;
                    if (input) {
                      executeCommand(input);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}