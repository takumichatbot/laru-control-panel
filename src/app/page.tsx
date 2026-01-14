'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v15.2 [STABLE]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President / Komazawa Law Student)
 * DATE: 2026-01-15
 * DESCRIPTION: 
 * SF的サイバーパンクUIと実用的なシステム運用を統合。
 * PC/モバイル完全対応のレスポンシブ・アーキテクチャ。
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
  type: 'sys' | 'gem' | 'sec';
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

  // --- ログ・プロトコル ---
  const addLog = useCallback((msg: string, type: 'sys' | 'gem' | 'sec' = 'sys') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [{ id, msg, type, time }, ...prev.slice(0, 100)]);
  }, []);

  // --- Gemini 実行プロトコル (外部知能連携) ---
  const sendToGemini = async (text?: string) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || isThinking) return;

    setIsThinking(true);
    addLog(`CMD >> ${messageToSend}`, 'sys');
    setInputMessage('');

    try {
      // 内部エンドポイントへのセキュア・リクエスト
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend })
      });

      if (!res.ok) throw new Error(`ERR_CONN_FAILED: ${res.status}`);
      const data = await res.json();

      // 関数呼び出し（Function Calling）の処理
      if (data.functionCalls) {
        data.functionCalls.forEach((call: any) => {
          if (call.name === "restart_service") {
            const sid = call.args.serviceId;
            setServices(prev => ({ ...prev, [sid]: { ...prev[sid], status: 'NOMINAL', cpu: 0 } }));
            addLog(`RESTORE: ${sid.toUpperCase()} サービスを再起動しました。`, 'sec');
          }
        });
        addLog("NEXUS: 外部命令を処理し、プロトコルを更新しました。", "gem");
      } else if (data.text) {
        addLog(`NEXUS: ${data.text}`, 'gem');
      }
    } catch (error: any) {
      addLog(`ERR_AUTH: 通信プロトコルが遮断されました。`, "sec");
      addLog(`INFO: Renderの環境変数(GEMINI_API_KEY)を再検証してください。`, "sys");
    } finally {
      setIsThinking(false);
    }
  };

  // --- 音声認識プロトコル (Vocal Command) ---
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("ERR: 音声認識モジュールが未搭載です。", "sec");

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
      addLog("ERR: 音声情報のデコードに失敗しました。", "sec");
    };
  };

  // --- テレメトリ自動更新ループ ---
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
      {/* CSSレイヤ：デザインの微調整 
          PC表示でもside-panelが表示されるようにスタイルを強化
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        
        :root { 
          --neon-blue: #00f2ff; 
          --neon-red: #ff0040; 
          --neon-green: #39ff14; 
          --bg-dark: #050505; 
        }

        .nexus-container { 
          height: 100vh; 
          background: var(--bg-dark); 
          color: #fff; 
          font-family: 'JetBrains Mono', monospace; 
          display: flex; 
          flex-direction: column; 
          overflow: hidden; 
          position: relative; 
        }

        /* 走査線（Scanlines）エフェクト */
        .nexus-container::before { 
          content: " "; 
          position: absolute; inset: 0; 
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); 
          background-size: 100% 4px, 3px 100%; 
          pointer-events: none; 
          z-index: 100; 
        }

        .grid-bg { 
          position: fixed; inset: 0; 
          background-image: linear-gradient(rgba(0, 242, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.03) 1px, transparent 1px); 
          background-size: 50px 50px; 
          z-index: 0; 
        }

        @keyframes pulse-red { 
          0% { box-shadow: inset 0 0 50px rgba(255,0,64,0); } 
          50% { box-shadow: inset 0 0 100px rgba(255,0,64,0.3); border: 2px solid var(--neon-red); } 
          100% { box-shadow: inset 0 0 50px rgba(255,0,64,0); } 
        }
        .alert-active { animation: pulse-red 1.5s infinite; }

        .nexus-header { 
          height: 64px; 
          border-bottom: 1px solid rgba(0, 242, 255, 0.2); 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          padding: 0 24px; 
          background: rgba(0, 0, 0, 0.8); 
          backdrop-filter: blur(10px); 
          z-index: 200; 
        }

        .nexus-main { 
          flex: 1; 
          display: flex; 
          z-index: 10; 
          overflow: hidden; 
        }

        /* パネル共通設定 */
        .side-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: transform 0.3s ease;
        }

        /* PC表示：タブに応じてコンテンツの表示非表示を切り替え */
        .panel-content {
          display: none;
          flex-direction: column;
          height: 100%;
        }
        .panel-content.active {
          display: flex;
        }

        /* モバイル表示（最大幅1024px） */
        @media (max-width: 1024px) { 
          .side-panel { 
            position: absolute; 
            inset: 0; 
            width: 100%; 
            background: var(--bg-dark); 
            z-index: 300; 
            display: none;
          } 
          .side-panel.active { 
            display: flex; 
          } 
        }

        .card { 
          background: rgba(255, 255, 255, 0.03); 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          padding: 20px; 
          transition: 0.3s; 
        }
        .card:hover { border-color: var(--neon-blue); background: rgba(0, 242, 255, 0.05); }

        .nexus-btn { 
          background: transparent; 
          border: 1px solid var(--neon-blue); 
          color: var(--neon-blue); 
          padding: 12px 24px; 
          font-weight: bold; 
          cursor: pointer; 
          text-transform: uppercase; 
          letter-spacing: 2px; 
          transition: all 0.2s;
        }
        .nexus-btn:hover { background: var(--neon-blue); color: #000; box-shadow: 0 0 20px var(--neon-blue); }
        .nexus-btn.listening { border-color: var(--neon-red); color: var(--neon-red); animation: blink 1s infinite; }

        @keyframes blink { 50% { opacity: 0.5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
      <div className="grid-bg" />

      {/* --- ヘッダー領域 --- */}
      <header className="nexus-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '40px', height: '40px', border: `2px solid ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '60%', height: '60%', background: isAlert ? 'var(--neon-red)' : 'var(--neon-blue)', boxShadow: `0 0 15px ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}` }} />
          </div>
          <div>
            <h1 style={{ fontSize: '16px', letterSpacing: '4px', margin: 0 }}>LARU_NEXUS_OS</h1>
            <span style={{ fontSize: '10px', color: '#666' }}>ESTABLISHED 2025 // STATUS: {isAlert ? 'CRITICAL' : 'NOMINAL'}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: isAlert ? 'var(--neon-red)' : 'var(--neon-green)' }}>&lt; SECURITY_LEVEL_A &gt;</div>
          <div style={{ fontSize: '10px', color: '#444' }}>IP: 127.0.0.1 // PORT: 3000</div>
        </div>
      </header>

      {/* --- ナビゲーション領域 (モバイル用) --- */}
      <nav style={{ display: 'flex', background: '#000', borderBottom: '1px solid #222', zIndex: 400 }} className="lg:hidden">
        {(['MONITOR', 'CORE', 'LOG'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            style={{ 
              flex: 1, padding: '15px', border: 'none', background: 'transparent', 
              color: activeTab === tab ? 'var(--neon-blue)' : '#444', 
              borderBottom: activeTab === tab ? '2px solid var(--neon-blue)' : 'none', 
              fontSize: '11px', fontWeight: 'bold' 
            }}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* --- メインコンテンツ領域 --- */}
      <div className="nexus-main">
        
        {/* LEFT: システムモニター */}
        <aside className={`side-panel panel-content ${activeTab === 'MONITOR' ? 'active' : ''}`} style={{ width: '380px', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '30px', gap: '20px' }}>
          <h3 style={{ fontSize: '12px', color: 'var(--neon-blue)', borderLeft: '3px solid var(--neon-blue)', paddingLeft: '10px', marginBottom: '10px' }}>TELEMETRY_FEED</h3>
          {Object.values(services).map(s => (
            <div key={s.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: s.color, fontSize: '14px', fontWeight: 'bold' }}>{s.name}</span>
                <span style={{ fontSize: '10px', color: s.cpu > 80 ? 'var(--neon-red)' : '#888' }}>CPU: {s.cpu.toFixed(1)}%</span>
              </div>
              <div style={{ height: '2px', background: '#111', overflow: 'hidden' }}>
                <div style={{ width: `${s.cpu}%`, height: '100%', background: s.cpu > 80 ? 'var(--neon-red)' : s.color, transition: '0.5s' }} />
              </div>
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button onClick={() => sendToGemini(`${s.name}の最適化を開始`)} style={{ flex: 1, fontSize: '9px', background: 'transparent', border: '1px solid #333', color: '#666', padding: '5px', cursor: 'pointer' }}>OPTIMIZE</button>
                <button onClick={() => sendToGemini(`${s.name}を再起動`)} style={{ flex: 1, fontSize: '9px', background: 'transparent', border: '1px solid #333', color: '#666', padding: '5px', cursor: 'pointer' }}>REBOOT</button>
              </div>
            </div>
          ))}
        </aside>

        {/* CENTER: ネクサスコア */}
        <main className={`panel-content ${activeTab === 'CORE' ? 'active' : ''}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'relative', width: '350px', height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, opacity: 0.1, transform: `scale(${1.2 + audioLevel / 100})`, transition: '0.1s' }} />
            <div style={{ position: 'absolute', width: '280px', height: '280px', border: `1px dashed ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, borderRadius: '50%', animation: 'spin 30s linear infinite', opacity: 0.2 }} />
            <div style={{ textAlign: 'center', zIndex: 10 }}>
              <div style={{ fontSize: '56px', fontWeight: 900, letterSpacing: '8px', textShadow: `0 0 30px ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}` }}>LARU</div>
              <div style={{ fontSize: '11px', color: isAlert ? 'var(--neon-red)' : 'var(--neon-blue)', letterSpacing: '6px' }}>NEXUS_CORE_V15</div>
            </div>
          </div>
          <button onClick={startListening} className={`nexus-btn ${isLive ? 'listening' : ''}`} style={{ marginTop: '40px' }}>
            {isLive ? 'SYSTEM_LISTENING' : 'VOICE_COMMAND_INPUT'}
          </button>
        </main>

        {/* RIGHT: セキュアログ */}
        <section className={`side-panel panel-content ${activeTab === 'LOG' ? 'active' : ''}`} style={{ width: '420px', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.6)', gap: '0px' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #222', fontSize: '11px', color: '#666', fontWeight: 'bold' }}>ENCRYPTED_LOG_STREAM</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column-reverse', gap: '12px' }}>
            {isThinking && <div style={{ color: 'var(--neon-blue)', fontSize: '10px', animation: 'blink 0.5s infinite' }}>[ ANALYSIS_IN_PROGRESS... ]</div>}
            {logs.map(log => (
              <div key={log.id} style={{ fontSize: '12px', borderLeft: `2px solid ${log.type === 'gem' ? 'var(--neon-blue)' : log.type === 'sec' ? 'var(--neon-red)' : '#444'}`, paddingLeft: '12px' }}>
                <div style={{ color: '#444', fontSize: '9px', marginBottom: '4px' }}>T-ID: {log.id} // {log.time}</div>
                <div style={{ color: log.type === 'gem' ? '#fff' : log.type === 'sec' ? 'var(--neon-red)' : 'var(--neon-blue)' }}>{log.msg}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '30px', background: 'rgba(0,0,0,0.9)', borderTop: '1px solid #222' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <span style={{ color: 'var(--neon-green)' }}>#</span>
              <input 
                type="text" 
                value={inputMessage} 
                onChange={e => setInputMessage(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && sendToGemini()} 
                placeholder="命令を入力..." 
                style={{ width: '100%', background: 'none', border: 'none', color: 'var(--neon-green)', outline: 'none', fontSize: '14px', fontFamily: 'inherit' }} 
              />
            </div>
          </div>
        </section>
      </div>

      {/* --- フッター領域 --- */}
      <footer style={{ height: '32px', background: '#000', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', fontSize: '10px', color: '#444', justifyContent: 'space-between', padding: '0 20px', zIndex: 200 }}>
        <div>© 2026 LARU Nexus - All Systems Encrypted.</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>LATENCY: 12ms</span>
          <span>UPTIME: 99.9%</span>
          <span style={{ color: 'var(--neon-green)' }}>● SECURE_MODE_ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}