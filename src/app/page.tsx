'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// --- Types ---
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

export default function LaruNexusV14() {
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'CORE' | 'LOG'>('CORE');
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);

  const [services, setServices] = useState<Record<string, ServiceData>>({
    larubot: { id: 'larubot', name: 'LARUBOT AI', cpu: 15, mem: 420, status: 'NOMINAL', color: '#00f2ff' },
    laruvisona: { id: 'laruvisona', name: 'LARUVISONA', cpu: 10, mem: 180, status: 'NOMINAL', color: '#39ff14' },
    flastal: { id: 'flastal', name: 'FLASTAL.COM', cpu: 45, mem: 1250, status: 'HEAVY', color: '#ff006e' }
  });

  const addLog = useCallback((msg: string, type: 'sys' | 'gem' | 'sec' = 'sys') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [{ id, msg, type, time }, ...prev.slice(0, 50)]);
  }, []);

  // --- Gemini 実行プロトコル ---
  const sendToGemini = async (text?: string) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || isThinking) return;

    setIsThinking(true);
    addLog(`あなた: ${messageToSend}`, 'sys');
    setInputMessage('');

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend })
      });

      if (!res.ok) throw new Error(`接続エラー: ${res.status}`);

      const data = await res.json();

      if (data.functionCalls) {
        data.functionCalls.forEach((call: any) => {
          if (call.name === "restart_service") {
            const sid = call.args.serviceId;
            setServices(prev => ({ ...prev, [sid]: { ...prev[sid], status: 'NOMINAL', cpu: 0 } }));
            addLog(`実行完了: ${sid.toUpperCase()} の再起動に成功しました。`, 'sec');
          }
          if (call.name === "optimize_all") {
            setServices(prev => {
              const n = { ...prev };
              Object.keys(n).forEach(k => n[k].cpu = 12);
              return n;
            });
            addLog("実行完了: 全システムの最適化が完了しました。", 'sec');
          }
        });
        addLog("Gemini: 命令に基づきシステムを調整しました。", "gem");
      } else if (data.text) {
        addLog(`Gemini: ${data.text}`, 'gem');
      }
    } catch (error: any) {
      addLog(`通信エラー: ${error.message}`, "sec");
      addLog("解決策: Renderの環境変数(GEMINI_API_KEY)が正しいか確認してください。", "sys");
    } finally {
      setIsThinking(false);
    }
  };

  // --- 音声認識プロトコル ---
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("エラー: ブラウザが音声認識に対応していません。", "sec");

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.start();
    setIsLive(true);
    addLog("音声認識中: 指示をどうぞ...", "sys");

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      sendToGemini(transcript);
      setIsLive(false);
    };
    recognition.onerror = () => {
      setIsLive(false);
      addLog("エラー: 音声が聞き取れませんでした。", "sec");
    };
  };

  // リアルタイム・テレメトリ更新
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLive) setAudioLevel(Math.random() * 100);
      setServices(prev => {
        const next = { ...prev };
        let anyCritical = false;
        Object.keys(next).forEach(key => {
          const drift = Math.random() * 6 - 3;
          next[key].cpu = Math.max(2, Math.min(98, next[key].cpu + drift));
          if (next[key].cpu > 90) anyCritical = true;
        });
        setIsAlert(anyCritical);
        return next;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className={`nexus-fortress ${isAlert ? 'alert-mode' : ''}`} style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#000', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .grid-overlay {
          position: fixed; inset: 0;
          background-image: linear-gradient(rgba(0,242,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.05) 1px, transparent 1px);
          background-size: 30px 30px; pointer-events: none; z-index: 0;
        }
        @keyframes alert-pulse { 0% { background: rgba(255,0,0,0); } 50% { background: rgba(255,0,0,0.15); } 100% { background: rgba(255,0,0,0); } }
        .alert-mode::after { content: ""; position: fixed; inset: 0; animation: alert-pulse 1s infinite; z-index: 1000; pointer-events: none; border: 4px solid #ff0040; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .mobile-only { display: none; }
        @media (max-width: 768px) {
          .desktop-flex { display: none !important; }
          .mobile-only { display: flex !important; }
          .section-content { display: none !important; }
          .section-content.active { display: flex !important; flex-direction: column; flex: 1; overflow-y: auto; }
        }
      `}} />
      <div className="grid-overlay" />

      {/* ヘッダー */}
      <header style={{ height: '60px', borderBottom: '1px solid rgba(0,242,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', background: 'rgba(0,0,0,0.95)', zIndex: 1100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: isAlert ? '#ff0040' : '#00f2ff', boxShadow: `0 0 15px ${isAlert ? '#ff0040' : '#00f2ff'}`, transition: '0.3s' }} />
          <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#00f2ff', letterSpacing: '2px' }}>LARU NEXUS COMMAND <span style={{ fontSize: '10px', color: '#444' }}>v14.0</span></h1>
        </div>
        <div style={{ fontSize: '11px', color: isAlert ? '#ff0040' : '#39ff14', fontFamily: 'monospace' }}>
          [ {isAlert ? 'CRITICAL_ALERT' : 'SYSTEM_STABLE'} ]
        </div>
      </header>

      {/* モバイルナビ */}
      <nav className="mobile-only" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#000', zIndex: 1000 }}>
        {(['MONITOR', 'CORE', 'LOG'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '15px 0', fontSize: '11px', fontWeight: 'bold', border: 'none',
            background: activeTab === tab ? 'rgba(0,242,255,0.1)' : 'transparent',
            color: activeTab === tab ? '#00f2ff' : '#666',
            borderBottom: activeTab === tab ? '2px solid #00f2ff' : 'none'
          }}>
            {tab}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1, display: 'flex', position: 'relative', zIndex: 10, overflow: 'hidden' }}>
        
        {/* 左：監視モニター */}
        <aside className={`section-content ${activeTab === 'MONITOR' ? 'active' : ''}`} style={{ width: '340px', borderRight: '1px solid rgba(0,242,255,0.2)', background: 'rgba(0,0,0,0.85)', padding: '25px' }}>
          <h2 style={{ fontSize: '11px', color: '#00f2ff', marginBottom: '20px', letterSpacing: '1px' }}>SYSTEM_MONITOR</h2>
          {Object.values(services).map(s => (
            <div key={s.id} style={{ marginBottom: '25px', padding: '18px', border: `1px solid ${s.cpu > 85 ? '#ff0040' : '#222'}`, background: 'rgba(255,255,255,0.02)', transition: '0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: s.color, fontWeight: 'bold', fontSize: '13px' }}>{s.name}</span>
                <span style={{ fontSize: '10px', color: s.cpu > 85 ? '#ff0040' : '#888' }}>{s.cpu > 85 ? 'ALERT' : 'NORMAL'}</span>
              </div>
              <div style={{ height: '4px', background: '#111', borderRadius: '2px' }}>
                <div style={{ width: `${s.cpu}%`, height: '100%', backgroundColor: s.cpu > 85 ? '#ff0040' : s.color, boxShadow: `0 0 10px ${s.cpu > 85 ? '#ff0040' : s.color}`, transition: 'width 0.6s' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                <button onClick={() => sendToGemini(`${s.name}を最適化して`)} style={{ flex: 1, background: 'none', border: '1px solid #333', color: '#888', fontSize: '9px', padding: '6px', cursor: 'pointer' }}>最適化</button>
                <button onClick={() => sendToGemini(`${s.name}を再起動して`)} style={{ flex: 1, background: 'none', border: '1px solid #333', color: '#888', fontSize: '9px', padding: '6px', cursor: 'pointer' }}>再起動</button>
              </div>
            </div>
          ))}
        </aside>

        {/* 中央：ネクサスハブ */}
        <main className={`section-content ${activeTab === 'CORE' ? 'active' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ position: 'relative', width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
              position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${isAlert ? '#ff0040' : '#00f2ff'}`,
              opacity: isLive ? 0.6 : 0.1, transform: `scale(${1 + audioLevel / 120})`, transition: '0.1s ease-out'
            }} />
            <div style={{ position: 'absolute', width: '220px', height: '220px', border: `1px dashed ${isAlert ? '#ff0040' : 'rgba(0,242,255,0.2)'}`, borderRadius: '50%', animation: 'rotate 20s linear infinite' }} />
            <div style={{ textAlign: 'center', zIndex: 10 }}>
              <div style={{ fontSize: '48px', fontWeight: 900, color: '#fff', textShadow: `0 0 30px ${isAlert ? '#ff0040' : '#00f2ff'}` }}>LARU</div>
              <div style={{ fontSize: '12px', color: isAlert ? '#ff0040' : '#00f2ff', letterSpacing: '6px', marginTop: '8px' }}>NEXUS CORE</div>
            </div>
          </div>
          <button onClick={startListening} style={{
            marginTop: '60px', padding: '18px 50px', background: 'none',
            border: `2px solid ${isLive ? (isAlert ? '#ff0040' : '#ff0040') : (isAlert ? '#ff0040' : '#00f2ff')}`, 
            color: isLive ? '#ff0040' : (isAlert ? '#ff0040' : '#00f2ff'),
            fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', letterSpacing: '2px', transition: 'all 0.3s'
          }}>
            {isLive ? '指示を解析中...' : 'マイクを起動（音声操作）'}
          </button>
        </main>

        {/* 右：ターミナルログ */}
        <section className={`section-content ${activeTab === 'LOG' ? 'active' : ''}`} style={{ width: '400px', borderLeft: '1px solid rgba(0,242,255,0.2)', background: 'rgba(5,5,5,0.98)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #222', fontSize: '11px', color: '#666', fontWeight: 'bold' }}>SYSTEM_LOG_STREAM</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column-reverse', gap: '8px' }}>
            {isThinking && <div style={{ color: '#00f2ff', fontSize: '10px' }}>[ Gemini が思考プロトコルを実行中... ]</div>}
            {logs.map(log => (
              <div key={log.id} style={{ fontSize: '11px', display: 'flex', gap: '12px', lineHeight: '1.5' }}>
                <span style={{ color: '#444', flexShrink: 0 }}>[{log.time}]</span>
                <span style={{ color: log.type === 'gem' ? '#fff' : log.type === 'sec' ? '#ff0040' : '#00b4d8' }}>{log.msg}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '25px', borderTop: '1px solid #222', background: '#000' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ color: '#00f2ff', fontWeight: 'bold' }}>&gt;</span>
              <input 
                type="text" 
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendToGemini();
                  }
                }}
                placeholder="命令を入力..."
                style={{ width: '100%', background: 'none', border: 'none', color: '#39ff14', outline: 'none', fontFamily: 'monospace', fontSize: '13px' }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}