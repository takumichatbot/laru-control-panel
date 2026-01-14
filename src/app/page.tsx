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
  const sendToGemini = async (text: string) => {
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
    <div className="nexus-fortress flex flex-col h-screen overflow-hidden bg-black text-white selection:bg-cyan-500/30">
      <div className="grid-overlay" />

      {/* --- Global Header --- */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-cyan-500/30 bg-black/90 backdrop-blur-md z-[1100]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-cyan-500 shadow-[0_0_10px_#06b6d4] animate-pulse" />
          <h1 className="text-sm md:text-lg font-black tracking-widest text-cyan-400">
            LARU NEXUS <span className="hidden md:inline text-xs text-gray-600 font-normal">v10.2.0-ULTIMATE</span>
          </h1>
        </div>
        <div className="flex gap-4 text-[10px] font-mono">
          <div className="text-green-500 hidden sm:block">[ STATUS: ONLINE ]</div>
          <div className={`${isLive ? 'text-cyan-400' : 'text-gray-600'}`}>
            [ NEURAL_LINK: {isLive ? 'ACTIVE' : 'STANDBY'} ]
          </div>
        </div>
      </header>

      {/* --- Main Content Layout --- */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden z-10">
        
        {/* Mobile Tab Navigation */}
        <nav className="md:hidden flex border-b border-white/10 bg-black/50">
          {(['status', 'nexus', 'terminal'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-[10px] font-bold tracking-widest uppercase transition-all ${
                activeTab === tab ? 'text-cyan-400 bg-cyan-500/10 border-b-2 border-cyan-400' : 'text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* 1. Status Column (Left) */}
        <aside className={`${
          activeTab === 'status' ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-[320px] lg:w-[360px] border-r border-white/10 bg-black/60 overflow-y-auto p-5`}>
          <h2 className="text-[11px] font-bold text-cyan-400 mb-6 tracking-widest border-b border-cyan-500/20 pb-2">
            NODE_MONITORING
          </h2>
          <div className="space-y-6">
            {Object.values(services).map(s => (
              <div key={s.id} className="group p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-xs font-bold" style={{ color: s.color }}>{s.name}</div>
                    <div className="text-[9px] text-gray-500 font-mono mt-1">{s.description}</div>
                  </div>
                  <div className={`text-[9px] px-2 py-0.5 border ${s.status === 'BUSY' ? 'border-yellow-500/50 text-yellow-500' : 'border-gray-500/50 text-gray-500'}`}>
                    {s.status}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-gray-400">
                    <span>CPU_LOAD</span>
                    <span>{s.cpu.toFixed(1)}%</span>
                  </div>
                  <div className="h-1 bg-gray-900 overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500 ease-out shadow-[0_0_8px_currentColor]"
                      style={{ width: `${s.cpu}%`, backgroundColor: s.color, color: s.color }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => sendToGemini(`${s.name}を再起動`)} className="flex-1 text-[8px] py-1 border border-white/20 hover:border-white/50 text-gray-400">RESTART</button>
                  <button onClick={() => sendToGemini(`${s.name}を最適化`)} className="flex-1 text-[8px] py-1 border border-white/20 hover:border-white/50 text-gray-400">OPTIMIZE</button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* 2. Nexus Core (Center) */}
        <main className={`${
          activeTab === 'nexus' ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col items-center justify-center relative p-10 bg-radial-at-c from-cyan-900/10 to-transparent`}>
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            {/* Visualizer Rings */}
            <div 
              className="absolute inset-0 rounded-full border-2 border-cyan-500/20 transition-transform duration-150"
              style={{ transform: `scale(${1 + audioLevel / 150})`, opacity: isLive ? 0.4 : 0.1 }}
            />
            <div className="absolute inset-4 rounded-full border border-dashed border-cyan-500/30 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-10 rounded-full border border-cyan-500/10 animate-[spin_15s_linear_infinite_reverse]" />
            
            <div className="relative z-10 text-center">
              <div className="text-4xl md:text-5xl font-black tracking-[0.3em] text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">
                LARU
              </div>
              <div className="text-[10px] md:text-xs tracking-[0.6em] text-cyan-400 mt-2 font-bold ml-2">
                NEXUS COMMAND
              </div>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center gap-4">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-10 py-4 font-black tracking-[0.2em] text-sm transition-all duration-500 border-2 ${
                isLive 
                ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' 
                : 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
              }`}
            >
              {isLive ? 'TERMINATE_LINK' : 'INITIATE_LINK'}
            </button>
            <div className="text-[9px] text-gray-600 font-mono animate-pulse">
              {isLive ? '>>> RECEIVING AUDIO DATA_STREAM' : '>>> NEURAL ENGINE STANDBY'}
            </div>
          </div>
        </main>

        {/* 3. Terminal Column (Right) */}
        <section className={`${
          activeTab === 'terminal' ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-[350px] lg:w-[420px] border-l border-white/10 bg-black/80`}>
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black">
            <span className="text-[10px] font-bold tracking-widest text-gray-500">TERMINAL_LOG</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 font-mono text-[10px] space-y-3 flex flex-col-reverse scrollbar-hide">
            {isThinking && (
              <div className="text-cyan-400 animate-pulse flex items-center gap-2">
                <span className="w-1.5 h-3 bg-cyan-400" />
                THINKING...
              </div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 leading-relaxed">
                <span className="text-gray-600 shrink-0">[{log.time}]</span>
                <span className={`${
                  log.type === 'gem' ? 'text-white' : 
                  log.type === 'sec' ? 'text-red-500' : 'text-cyan-600'
                }`}>
                  {log.type === 'gem' && <span className="mr-2 text-cyan-400">●</span>}
                  {log.msg}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-black border-t border-white/10">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-cyan-500 font-bold">&gt;</span>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendToGemini('')}
                placeholder="COMMAND..."
                className="w-full bg-white/5 border border-white/10 py-3 pl-8 pr-4 text-xs font-mono text-cyan-100 placeholder:text-gray-700 focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .nexus-fortress {
          --neon-cyan: #06b6d4;
        }
        .grid-overlay {
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
          pointer-events: none;
          z-index: 0;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}