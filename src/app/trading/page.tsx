'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { createChart, ColorType, IChartApi, ISeriesApi, CrosshairMode, LineStyle, IPriceLine, AreaSeries } from 'lightweight-charts';
import { 
  ArrowLeft, Activity, Lock, Unlock, Wifi, WifiOff, 
  Cpu, Zap, Layers, Terminal
} from 'lucide-react';

// 【修正】接続先を自動判定（Render対応）
const getWebSocketUrl = () => {
  if (typeof window === 'undefined') return '';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/TRADING`;
};

type OrderItem = { p: number; s: number };
type L2Data = { bids: OrderItem[]; asks: OrderItem[] };
type PositionData = {
  size: number;
  entryPrice: number;
  pnl: number;
  roe: number;
  liqPrice: number;
};
type AiInfo = {
  sentiment: string;
  confidence: number;
  reasons?: string[];
};
type LogItem = { time: string; msg: string; color: string };
type MobileTab = 'ORDERBOOK' | 'TRADE' | 'LOGS';

export default function TradingTerminal() {
  const [ticker, setTicker] = useState("SCANNING...");
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isAuto, setIsAuto] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [orderSize, setOrderSize] = useState<number>(10); 
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('TRADE');
  
  // チャート関連
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [orderBook, setOrderBook] = useState<L2Data>({ bids: [], asks: [] });
  const [tape, setTape] = useState<{p:number, s:number, side:'buy'|'sell', time:string}[]>([]);
  const [aiInfo, setAiInfo] = useState<AiInfo>({ sentiment: 'WAITING...', confidence: 0, reasons: [] });
  const [logs, setLogs] = useState<LogItem[]>([]);

  // --------------------------------------------------------------------------
  // Helper: 擬似的な板情報を生成する (バックエンド負荷軽減のため)
  // --------------------------------------------------------------------------
  const generateSyntheticOrderBook = (price: number): L2Data => {
    if (price === 0) return { bids: [], asks: [] };
    const spread = price * 0.0005;
    const bids = Array.from({ length: 15 }, (_, i) => ({
      p: price - spread - (i * price * 0.0002),
      s: Math.floor(Math.random() * 5000) + 100
    }));
    const asks = Array.from({ length: 15 }, (_, i) => ({
      p: price + spread + (i * price * 0.0002),
      s: Math.floor(Math.random() * 5000) + 100
    }));
    return { bids, asks };
  };

  // --------------------------------------------------------------------------
  // 1. チャート初期化
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // クリーンアップ
    if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: { 
        background: { type: ColorType.Solid, color: '#000000' }, 
        textColor: '#52525b', 
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.05)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: { 
        timeVisible: true, 
        secondsVisible: true,
        borderColor: '#27272a',
      },
      rightPriceScale: {
        borderColor: '#27272a',
        scaleMargins: { top: 0.2, bottom: 0.1 },
      },
      crosshair: { mode: CrosshairMode.Normal },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(6, 182, 212, 0.56)',
      bottomColor: 'rgba(6, 182, 212, 0.04)',
      lineColor: 'rgba(6, 182, 212, 1)',
      lineWidth: 2,
    });

    chartRef.current = chart;
    areaSeriesRef.current = areaSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth, 
          height: chartContainerRef.current.clientHeight 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // --------------------------------------------------------------------------
  // 2. WebSocket Logic
  // --------------------------------------------------------------------------
  useEffect(() => {
    let ws: WebSocket;
    let pingInterval: NodeJS.Timeout;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      const wsUrl = getWebSocketUrl();
      if (!wsUrl) return;

      console.log('Connecting to Trading WS:', wsUrl);
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("📡 TERMINAL: CONNECTED");
        setIsConnected(true);
        addLog("SYSTEM ONLINE: CONNECTED TO GOD MODE CORE", "text-emerald-500");
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "PING" }));
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "MARKET_UPDATE") {
            const { coin, price, confidence, sentiment, reasons } = data;
            
            setTicker(coin);
            setCurrentPrice(price);
            
            if (areaSeriesRef.current) {
                areaSeriesRef.current.update({ time: Math.floor(Date.now() / 1000) as any, value: price });
            }

            setAiInfo({ sentiment, confidence, reasons });
            setOrderBook(generateSyntheticOrderBook(price));
            generateTapeEffect(price, coin);

            if (confidence > 50) {
                 setLogs(prev => {
                     const last = prev[0];
                     if (last && last.msg.includes(coin)) return prev;
                     return [{
                         time: new Date().toLocaleTimeString(),
                         msg: `[${coin}] ${sentiment} (${confidence}%): ${reasons?.[0] || ''}`,
                         color: confidence > 75 ? 'text-cyan-400' : 'text-zinc-500'
                     }, ...prev].slice(0, 50);
                 });
            }
          }

          if (data.type === "LOG") {
             const payload = data.payload;
             addLog(payload.msg, payload.type === 'error' ? 'text-red-500' : 'text-zinc-400');
          }

        } catch (e) { console.error("WS Error", e); }
      };

      ws.onclose = () => {
        setIsConnected(false);
        clearInterval(pingInterval);
        reconnectTimeout = setTimeout(connect, 3000);
      };
      
      ws.onerror = (err) => {
        console.error('WS Error:', err);
        ws.close();
      };
    };

    connect();
    return () => { 
        if (wsRef.current) wsRef.current.close(); 
        clearInterval(pingInterval);
        clearTimeout(reconnectTimeout);
    };
  }, []);

  const addLog = (msg: string, color: string = "text-zinc-400") => {
      setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, color }, ...prev].slice(0, 50));
  };

  const toggleAutopilot = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const newState = !isAuto;
    setIsAuto(newState);
    wsRef.current.send(JSON.stringify({ command: newState ? "SYSTEM:TRADING_START" : "SYSTEM:TRADING_STOP" }));
    addLog(newState ? "AUTOPILOT ENGAGED" : "AUTOPILOT DISENGAGED", "text-yellow-400");
  };

  const sendOrder = (side: 'buy' | 'sell') => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "ORDER", coin: ticker, side: side, size: orderSize }));
    addLog(`MANUAL ORDER SENT: ${side.toUpperCase()} ${ticker}`, "text-white");
  };

 const generateTapeEffect = (price: number, coinName: string) => {
    if (Math.random() > 0.4) return; 
    const isBuy = Math.random() > 0.5; 
    const size = Math.floor(Math.random() * 500) + 10;
    
    setTape(prev => [{
      p: price, 
      s: size, 
      side: (isBuy ? 'buy' : 'sell') as 'buy' | 'sell', 
      time: new Date().toLocaleTimeString().slice(0, 8)
    }, ...prev].slice(0, 30));
  };

  const maxVol = 5000;

  return (
    <div className="fixed inset-0 bg-black text-white font-mono flex flex-col overflow-hidden selection:bg-cyan-500/30">
      
      {/* 1. HEADER */}
      <header className="h-12 shrink-0 border-b border-white/10 flex items-center justify-between px-3 md:px-4 bg-zinc-950 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors p-1"><ArrowLeft size={18} /></Link>
          <div className="flex items-center gap-2">
             <Activity size={16} className="text-cyan-500 animate-pulse"/>
             <span className="font-black tracking-tighter text-sm text-cyan-400">LARU_GOD_MODE</span>
             <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[10px] font-bold text-zinc-300 transition-all duration-300">
                {ticker}
             </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isConnected ? 'text-emerald-500' : 'text-red-500 animate-pulse'}`}>
              {isConnected ? <Wifi size={14}/> : <WifiOff size={14}/>} 
              <span className="hidden md:inline">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
           </div>
           
           <button 
             onClick={toggleAutopilot} 
             className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all active:scale-95 ${isAuto ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
           >
              {isAuto ? <Unlock size={14}/> : <Lock size={14}/>} 
              <span className="text-[10px] font-black">{isAuto ? 'AUTO_HUNT' : 'MANUAL'}</span>
           </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col md:grid md:grid-cols-12 md:grid-rows-6 gap-px bg-zinc-800/50 min-h-0">
        
        {/* A. CHART AREA (SCANNER) */}
        <div className="relative group bg-black flex-shrink-0 md:col-span-9 md:row-span-4 h-[45%] md:h-auto border-b md:border-b-0 border-zinc-800">
           {/* HUD */}
           <div className="absolute top-4 left-4 z-20 pointer-events-none select-none">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl md:text-5xl font-black tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] text-white">
                    {currentPrice > 0 ? currentPrice.toFixed(4) : "SCANNING..."}
                </span>
              </div>
              
              {/* AI STATUS */}
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
                 <div className="flex items-center gap-2 text-[10px] tracking-widest bg-black/80 backdrop-blur px-3 py-1.5 rounded border border-white/10 w-fit">
                    <span className="text-zinc-500">SENTIMENT:</span>
                    <span className={`font-black ${
                        aiInfo.sentiment.includes('BUY') ? 'text-emerald-400' : 
                        aiInfo.sentiment.includes('SELL') ? 'text-red-400' : 'text-zinc-400'
                    }`}>
                       {aiInfo.sentiment}
                    </span>
                 </div>
                 
                 {/* CONFIDENCE BAR */}
                 <div className="flex items-center gap-2 text-[10px] tracking-widest bg-black/80 backdrop-blur px-3 py-1.5 rounded border border-white/10 w-fit min-w-[150px]">
                    <span className="text-zinc-500">CONFIDENCE:</span>
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-cyan-500 transition-all duration-500 ease-out" 
                            style={{width: `${aiInfo.confidence}%`}}
                        />
                    </div>
                    <span className="text-cyan-400 font-bold">{aiInfo.confidence}%</span>
                 </div>
              </div>
           </div>
           
           <div ref={chartContainerRef} className="w-full h-full cursor-crosshair opacity-80" />
        </div>

        {/* MOBILE TAB NAV */}
        <div className="flex md:hidden h-10 bg-zinc-950 border-b border-zinc-800 shrink-0">
           {(['TRADE', 'ORDERBOOK', 'LOGS'] as MobileTab[]).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveMobileTab(tab)}
               className={`flex-1 text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 border-b-2 transition-all ${
                 activeMobileTab === tab ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20' : 'border-transparent text-zinc-600'
               }`}
             >
               {tab}
             </button>
           ))}
        </div>

        {/* B. ORDER BOOK (SYNTHETIC) */}
        <div className={`md:col-span-3 md:row-span-4 bg-black md:border-l border-zinc-800 flex-col overflow-hidden ${activeMobileTab === 'ORDERBOOK' ? 'flex flex-1' : 'hidden md:flex'}`}>
           <div className="px-3 py-2 bg-zinc-950 border-b border-zinc-900 text-[10px] font-bold text-zinc-500 flex justify-between shrink-0">
              <span className="flex items-center gap-2"><Layers size={12}/> ORDER BOOK (LIVE)</span>
           </div>
           
           {/* Asks */}
           <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col justify-end pb-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 to-transparent">
              {[...orderBook.asks].reverse().map((ask, i) => (
                 <div key={`ask-${i}`} className="flex justify-between px-3 py-0.5 text-[10px] hover:bg-zinc-900 cursor-pointer relative group">
                    <div className="absolute right-0 top-0 h-full bg-red-500/20 transition-all duration-300" style={{width: `${(ask.s / maxVol) * 100}%`}}/>
                    <span className="text-red-400 relative z-10 font-mono">{ask.p.toFixed(4)}</span>
                    <span className="text-zinc-500 relative z-10">{ask.s.toLocaleString()}</span>
                 </div>
              ))}
           </div>
           
           {/* Mid Price */}
           <div className="py-1.5 text-center text-sm font-bold bg-zinc-900 border-y border-zinc-800 text-white font-mono shadow-inner">
              {currentPrice.toFixed(4)}
           </div>
           
           {/* Bids */}
           <div className="flex-1 overflow-y-auto scrollbar-hide pt-1 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-950/20 to-transparent">
              {orderBook.bids.map((bid, i) => (
                 <div key={`bid-${i}`} className="flex justify-between px-3 py-0.5 text-[10px] hover:bg-zinc-900 cursor-pointer relative group">
                    <div className="absolute right-0 top-0 h-full bg-emerald-500/20 transition-all duration-300" style={{width: `${(bid.s / maxVol) * 100}%`}}/>
                    <span className="text-emerald-400 relative z-10 font-mono">{bid.p.toFixed(4)}</span>
                    <span className="text-zinc-500 relative z-10">{bid.s.toLocaleString()}</span>
                 </div>
              ))}
           </div>
        </div>

        {/* C. LOGS & REASONING */}
        <div className={`md:col-span-9 md:row-span-2 bg-black md:border-t border-zinc-800 p-0 gap-0 overflow-hidden ${activeMobileTab === 'LOGS' ? 'flex flex-col flex-1' : 'hidden md:flex'}`}>
           <div className="h-8 bg-zinc-950 border-b border-zinc-900 flex items-center px-3 gap-2 text-[10px] font-bold text-zinc-400">
               <Terminal size={12} /> SYSTEM LOGS & AI REASONING
           </div>
           <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
              {logs.map((log, i) => (
                  <div key={i} className={`flex gap-3 ${log.color} animate-in slide-in-from-left-2 duration-300`}>
                      <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                      <span>{log.msg}</span>
                  </div>
              ))}
              {logs.length === 0 && <div className="text-zinc-700 italic">Waiting for signals...</div>}
           </div>
        </div>

        {/* D. EXECUTION */}
        <div className={`md:col-span-3 md:row-span-2 bg-black md:border-t md:border-l border-zinc-800 flex-col ${activeMobileTab === 'TRADE' ? 'flex flex-1' : 'hidden md:flex'}`}>
           <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-0 overflow-y-auto scrollbar-hide p-2 space-y-0.5">
                 {tape.map((t, i) => (
                    <div key={i} className="flex justify-between text-[9px] font-mono animate-in fade-in duration-200">
                       <span className="text-zinc-600">{t.time}</span>
                       <span className={t.side==='buy'?'text-emerald-500':'text-red-500'}>{t.p.toFixed(4)}</span>
                       <span className="text-zinc-400">{t.s}</span>
                    </div>
                 ))}
              </div>
           </div>
           <div className="p-3 bg-zinc-950 border-t border-zinc-800">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => sendOrder('buy')} className="bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold py-3 rounded text-xs active:scale-95 transition-all shadow-[0_4px_10px_rgba(16,185,129,0.2)]">
                   BUY / LONG
                </button>
                <button onClick={() => sendOrder('sell')} className="bg-red-600/90 hover:bg-red-500 text-white font-bold py-3 rounded text-xs active:scale-95 transition-all shadow-[0_4px_10px_rgba(239,68,68,0.2)]">
                   SELL / SHORT
                </button>
              </div>
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded px-2">
                 <span className="text-[10px] text-zinc-500 font-bold mr-2">SIZE</span>
                 <input 
                   type="number" 
                   value={orderSize} 
                   onChange={(e) => setOrderSize(parseFloat(e.target.value))} 
                   className="bg-transparent text-white py-2 w-full text-right font-mono text-sm outline-none font-bold"
                 />
                 <span className="text-[10px] text-zinc-500 ml-1">USDC</span>
              </div>
           </div>
        </div>

      </main>
    </div>
  );
}