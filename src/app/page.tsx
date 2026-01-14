'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// --- 型定義 ---
interface ServiceData {
  id: string;
  name: string;
  cpu: number;
  mem: number;
  status: '正常稼働' | '高負荷' | 'エラー';
  color: string;
  description: string;
}

interface LogEntry {
  id: string;
  msg: string;
  type: 'sys' | 'gem' | 'sec';
  time: string;
}

export default function LaruNexusUltimateJP() {
  // UI状態
  const [activeTab, setActiveTab] = useState<'監視' | 'コア' | 'ログ'>('コア');
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  // サービス状態
  const [services, setServices] = useState<Record<string, ServiceData>>({
    larubot: { id: 'larubot', name: 'ラルボット AI', cpu: 12, mem: 420, status: '正常稼働', color: '#00f2ff', description: '対話型AIエンジン' },
    laruvisona: { id: 'laruvisona', name: 'ラルビソナ', cpu: 8, mem: 180, status: '正常稼働', color: '#39ff14', description: '基幹ウェブインターフェース' },
    flastal: { id: 'flastal', name: 'フラスタル', cpu: 32, mem: 1250, status: '高負荷', color: '#ff006e', description: 'マーケットプレイス・ノード' }
  });

  // ログ追加
  const addLog = useCallback((msg: string, type: 'sys' | 'gem' | 'sec' = 'sys') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [{ id, msg, type, time }, ...prev.slice(0, 50)]);
  }, []);

  // --- システム操作関数 (Geminiが呼び出す) ---
  const executeLocalTool = useCallback((name: string, args: any) => {
    if (name === "restart_service") {
      const { serviceId } = args;
      if (services[serviceId]) {
        setServices(prev => ({
          ...prev,
          [serviceId]: { ...prev[serviceId], status: '正常稼働', cpu: 0 }
        }));
        addLog(`実行: ${services[serviceId].name} の再起動プロトコル完了。`, 'sec');
        return "成功";
      }
    }
    if (name === "optimize_all") {
      setServices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          next[k].cpu = Math.max(5, Math.floor(next[k].cpu * 0.3));
        });
        return next;
      });
      addLog("実行: 全システムのリソース最適化が完了しました。", 'sec');
      return "成功";
    }
    return "不明なコマンド";
  }, [services, addLog]);

  // --- Gemini API 連携 ---
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

      const data = await res.json();

      if (data.functionCalls && data.functionCalls.length > 0) {
        for (const call of data.functionCalls) {
          executeLocalTool(call.name, call.args);
        }
        addLog("Gemini: システムを修復しました。", "gem");
      } else if (data.text) {
        addLog(`Gemini: ${data.text}`, 'gem');
      }
    } catch (error) {
      addLog("警告: 通信エラーが発生しました。", "sec");
    } finally {
      setIsThinking(false);
    }
  };

  // --- 音声認識 (Speech-to-Text) ---
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addLog("エラー: お使いのブラウザは音声認識に対応していません。", "sec");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.start();
    setIsLive(true);
    addLog("マイク起動: お話しください...", "sys");

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

  // リアルタイム演出
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
    <div className="nexus-fortress" style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#000', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .grid-overlay {
          position: fixed; inset: 0;
          background-image: linear-gradient(rgba(6,182,212,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.05) 1px, transparent 1px);
          background-size: 30px 30px; pointer-events: none; z-index: 0;
        }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes alert-pulse { 0%, 100% { border-color: rgba(255,0,64,0.3); } 50% { border-color: rgba(255,0,64,0.8); background: rgba(255,0,64,0.05); } }
        .alert-active { animation: alert-pulse 1s infinite; }
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
      <header style={{ height: '60px', borderBottom: '1px solid rgba(0,242,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'rgba(0,0,0,0.9)', zIndex: 1100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#00f2ff', boxShadow: '0 0 10px #00f2ff' }} />
          <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#00f2ff', letterSpacing: '2px' }}>LARU 統合管制要塞 <span style={{ fontSize: '10px', color: '#444' }}>v11.0</span></h1>
        </div>
        <div style={{ fontSize: '10px', color: '#39ff14' }}>[ システム状態: 正常 ]</div>
      </header>

      {/* スマホ用タブナビ */}
      <nav className="mobile-only" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#000', zIndex: 1000 }}>
        {(['監視', 'コア', 'ログ'] as const).map(tab => (
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
        
        {/* 左: 監視パネル */}
        <aside className={`section-content ${activeTab === '監視' ? 'active' : ''}`} style={{
          width: '320px', borderRight: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.6)', padding: '20px'
        }}>
          <h2 style={{ fontSize: '11px', color: '#00f2ff', marginBottom: '20px', borderBottom: '1px solid #222' }}>リアルタイム監視</h2>
          {Object.values(services).map(s => (
            <div key={s.id} className={s.status === '高負荷' ? 'alert-active' : ''} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #222', background: 'rgba(255,255,255,0.02)', transition: '0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: s.color, fontWeight: 'bold', fontSize: '12px' }}>{s.name}</span>
                <span style={{ fontSize: '10px', color: s.status === '高負荷' ? '#ff0040' : '#888' }}>{s.status}</span>
              </div>
              <div style={{ height: '4px', background: '#111', marginBottom: '10px' }}>
                <div style={{ width: `${s.cpu}%`, height: '100%', backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}`, transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontSize: '9px', color: '#666' }}>{s.description}</div>
            </div>
          ))}
        </aside>

        {/* 中央: ネクサスコア */}
        <main className={`section-content ${activeTab === 'コア' ? 'active' : ''}`} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ position: 'relative', width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
              position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #00f2ff',
              opacity: isLive ? 0.6 : 0.1, transform: `scale(${1 + audioLevel / 100})`, transition: '0.1s'
            }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '42px', fontWeight: 900, color: '#fff', textShadow: '0 0 20px #00f2ff' }}>LARU</div>
              <div style={{ fontSize: '10px', color: '#00f2ff', letterSpacing: '5px' }}>NEXUS CORE</div>
            </div>
          </div>

          <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', gap: '15px', width: '80%', maxWidth: '300px' }}>
            <button onClick={startListening} style={{
              padding: '18px', background: isLive ? 'rgba(255,0,64,0.2)' : 'rgba(0,242,255,0.1)',
              border: `2px solid ${isLive ? '#ff0040' : '#00f2ff'}`, color: isLive ? '#ff0040' : '#00f2ff',
              fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px'
            }}>
              {isLive ? '聞き取り中...' : '音声コマンドを起動'}
            </button>
            <div style={{ fontSize: '10px', color: '#444', textAlign: 'center' }}>
              例: 「ラルボットを再起動して」「システムを最適化」
            </div>
          </div>
        </main>

        {/* 右: ターミナルログ */}
        <section className={`section-content ${activeTab === 'ログ' ? 'active' : ''}`} style={{
          width: '380px', borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(5,5,5,0.95)', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #222', fontSize: '10px', color: '#666' }}>実行ログ・ストリーム</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column-reverse', gap: '10px' }}>
            {isThinking && <div style={{ color: '#00f2ff', fontSize: '10px' }}>Geminiが思考中...</div>}
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
              placeholder="コマンドを入力..."
              style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid #333', color: '#39ff14', padding: '5px', fontSize: '13px', outline: 'none' }}
            />
          </div>
        </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 769px) {
          .section-content { display: flex !important; }
          .mobile-only { display: none !important; }
        }
      `}} />
    </div>
  );
}