'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface BusinessMetrics {
  flastal: { serverLoad: number; activeEvents: number; uptime: number };
  larubot: { successRate: number; totalRequests: number; errorRate: number };
  laruvisona: { pageViews: number; uniqueVisitors: number; conversionRate: number };
}

interface CommandLog {
  id: string;
  timestamp: Date;
  command: string;
  status: 'receiving' | 'processing' | 'executed' | 'error';
}

export default function LARUNexus() {
  // Core States
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [isSystemPurging, setIsSystemPurging] = useState(false);
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics>({
    flastal: { serverLoad: 23.7, activeEvents: 847, uptime: 99.97 },
    larubot: { successRate: 96.4, totalRequests: 12847, errorRate: 3.6 },
    laruvisona: { pageViews: 25648, uniqueVisitors: 8921, conversionRate: 4.2 }
  });
  
  // Canvas Refs for Waveforms
  const flastalWaveRef = useRef<HTMLCanvasElement>(null);
  const larubotWaveRef = useRef<HTMLCanvasElement>(null);
  const laruVisonaWaveRef = useRef<HTMLCanvasElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  
  // Waveform Animation
  const drawWaveform = useCallback((canvas: HTMLCanvasElement, color: string, frequency: number, amplitude: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    const centerY = height / 2;
    let x = 0;
    
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let i = 0; i < width; i += 2) {
        const y = centerY + Math.sin((i + x) * frequency) * amplitude + Math.random() * 5 - 2.5;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      
      ctx.stroke();
      
      // Additional noise for realism
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < width; i += 4) {
        const y = centerY + Math.random() * 20 - 10;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      
      x += 3;
      requestAnimationFrame(animate);
    };
    
    animate();
  }, []);
  
  // Initialize Waveforms
  useEffect(() => {
    if (flastalWaveRef.current) {
      flastalWaveRef.current.width = 300;
      flastalWaveRef.current.height = 60;
      drawWaveform(flastalWaveRef.current, '#ff006e', 0.02, 15);
    }
    if (larubotWaveRef.current) {
      larubotWaveRef.current.width = 300;
      larubotWaveRef.current.height = 60;
      drawWaveform(larubotWaveRef.current, '#00f2ff', 0.03, 20);
    }
    if (laruVisonaWaveRef.current) {
      laruVisonaWaveRef.current.width = 300;
      laruVisonaWaveRef.current.height = 60;
      drawWaveform(laruVisonaWaveRef.current, '#39ff14', 0.025, 18);
    }
  }, [drawWaveform]);
  
  // Typing Effect for Commands
  const typeCommand = useCallback(async (command: string) => {
    setIsTyping(true);
    setCurrentCommand('');
    
    for (let i = 0; i <= command.length; i++) {
      setCurrentCommand(command.slice(0, i));
      await new Promise(resolve => setTimeout(resolve, 80));
    }
    
    setIsTyping(false);
    
    // Add to logs after typing
    setTimeout(() => {
      const newLog: CommandLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        command: command,
        status: 'executed'
      };
      setCommandLogs(prev => [newLog, ...prev.slice(0, 9)]);
      setCurrentCommand('');
    }, 1000);
  }, []);
  
  // System Purge & Test
  const runSystemPurgeAndTest = useCallback(async () => {
    setIsSystemPurging(true);
    
    const testSequence = [
      'INITIALIZING SYSTEM PURGE & TEST SEQUENCE',
      'SCANNING FLASTAL.COM ENDPOINTS...',
      'TESTING LARUBOT AI RESPONSE MODULES...',
      'VERIFYING LARUVISONA INFRASTRUCTURE...',
      'RUNNING CROSS-SYSTEM INTEGRATION TESTS...',
      'OPTIMIZING PERFORMANCE PARAMETERS...',
      'PURGING TEMPORARY CACHE & LOGS...',
      'ALL SYSTEMS OPERATIONAL - TEST COMPLETE'
    ];
    
    for (const command of testSequence) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await typeCommand(command);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // Update metrics after test
    setBusinessMetrics(prev => ({
      flastal: {
        ...prev.flastal,
        serverLoad: Math.random() * 15 + 10,
        uptime: 99.98 + Math.random() * 0.01
      },
      larubot: {
        ...prev.larubot,
        successRate: 95 + Math.random() * 4,
        totalRequests: prev.larubot.totalRequests + Math.floor(Math.random() * 100)
      },
      laruvisona: {
        ...prev.laruvisona,
        pageViews: prev.laruvisona.pageViews + Math.floor(Math.random() * 500),
        uniqueVisitors: prev.laruvisona.uniqueVisitors + Math.floor(Math.random() * 100)
      }
    }));
    
    setIsSystemPurging(false);
  }, [typeCommand]);
  
  // Auto-generate periodic commands
  useEffect(() => {
    const interval = setInterval(() => {
      const commands = [
        'MONITORING SYSTEM HEALTH STATUS',
        'ANALYZING TRAFFIC PATTERNS',
        'OPTIMIZING AI RESPONSE ALGORITHMS',
        'SCANNING FOR SECURITY THREATS',
        'UPDATING PERFORMANCE METRICS'
      ];
      const randomCommand = commands[Math.floor(Math.random() * commands.length)];
      typeCommand(randomCommand);
    }, 12000);
    
    return () => clearInterval(interval);
  }, [typeCommand]);
  
  return (
    <div className="laru-nexus">
      {/* Cyberpunk Grid Background */}
      <div className="cyberpunk-grid"></div>
      
      {/* Scan Lines */}
      <div className="scan-line scan-line-1"></div>
      <div className="scan-line scan-line-2"></div>
      
      {/* Main Content */}
      <div className="nexus-container">
        {/* System Purge & Test Button */}
        <div className="system-purge-section">
          <button 
            className={`system-purge-btn ${isSystemPurging ? 'purging' : ''}`}
            onClick={runSystemPurgeAndTest}
            disabled={isSystemPurging}
          >
            <div className="purge-btn-inner">
              <div className="purge-icon">⚡</div>
              <div className="purge-text">
                <span className="purge-title">SYSTEM PURGE & TEST</span>
                <span className="purge-subtitle">
                  {isSystemPurging ? 'EXECUTING...' : '全自動統合テスト'}
                </span>
              </div>
              {isSystemPurging && <div className="purge-spinner"></div>}
            </div>
          </button>
        </div>
        
        {/* 3D Hologram Menu */}
        <div className="hologram-section">
          <div className="hologram-container">
            
            {/* Flastal */}
            <div 
              className={`business-node flastal-node ${selectedBusiness === 'flastal' ? 'active' : ''}`}
              onClick={() => setSelectedBusiness(selectedBusiness === 'flastal' ? null : 'flastal')}
            >
              <div className="node-logo">🌸</div>
              <div className="node-name">FLASTAL</div>
              <div className="node-status">
                <canvas ref={flastalWaveRef} className="node-waveform"></canvas>
              </div>
            </div>
            
            {/* LARUbot */}
            <div 
              className={`business-node larubot-node ${selectedBusiness === 'larubot' ? 'active' : ''}`}
              onClick={() => setSelectedBusiness(selectedBusiness === 'larubot' ? null : 'larubot')}
            >
              <div className="node-logo">🤖</div>
              <div className="node-name">LARUbot</div>
              <div className="node-status">
                <canvas ref={larubotWaveRef} className="node-waveform"></canvas>
              </div>
            </div>
            
            {/* LARUVISONA */}
            <div 
              className={`business-node laruvisona-node ${selectedBusiness === 'laruvisona' ? 'active' : ''}`}
              onClick={() => setSelectedBusiness(selectedBusiness === 'laruvisona' ? null : 'laruvisona')}
            >
              <div className="node-logo">🏢</div>
              <div className="node-name">LARUVISONA</div>
              <div className="node-status">
                <canvas ref={laruVisonaWaveRef} className="node-waveform"></canvas>
              </div>
            </div>
            
            {/* Central Hub */}
            <div className="central-hub">
              <div className="hub-core">
                <span>LARU</span>
                <span>NEXUS</span>
              </div>
            </div>
          </div>
          
          {/* Metrics Display */}
          {selectedBusiness && (
            <div className="metrics-panel">
              {selectedBusiness === 'flastal' && (
                <div className="metric-card flastal-metrics">
                  <h3>🌸 FLASTAL METRICS</h3>
                  <div className="metric-grid">
                    <div className="metric-item">
                      <span className="metric-value">{businessMetrics.flastal.serverLoad.toFixed(1)}%</span>
                      <span className="metric-label">サーバー負荷</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-value">{businessMetrics.flastal.activeEvents}</span>
                      <span className="metric-label">アクティブイベント</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-value">{businessMetrics.flastal.uptime.toFixed(2)}%</span>
                      <span className="metric-label">稼働率</span>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedBusiness === 'larubot' && (
                <div className="metric-card larubot-metrics">
                  <h3>🤖 LARUBOT AI METRICS</h3>
                  <div className="metric-grid">
                    <div className="metric-item">
                      <span className="metric-value">{businessMetrics.larubot.successRate.toFixed(1)}%</span>
                      <span className="metric-label">AI応答成功率</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-value">{businessMetrics.larubot.totalRequests.toLocaleString()}</span>
                      <span className="metric-label">総リクエスト数</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-value">{businessMetrics.larubot.errorRate.toFixed(1)}%</span>
                      <span className="metric-label">エラー率</span>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedBusiness === 'laruvisona' && (
                <div className="metric-card laruvisona-metrics">
                  <h3>🏢 LARUVISONA METRICS</h3>
                  <div className="metric-grid">
                    <div className="metric-item">
                      <span className="metric-value">{businessMetrics.laruvisona.pageViews.toLocaleString()}</span>
                      <span className="metric-label">ページビュー</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-value">{businessMetrics.laruvisona.uniqueVisitors.toLocaleString()}</span>
                      <span className="metric-label">ユニーク訪問者</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-value">{businessMetrics.laruvisona.conversionRate.toFixed(1)}%</span>
                      <span className="metric-label">コンバージョン率</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Live Command Console */}
      <div className="command-console">
        <div className="console-header">
          <div className="console-title">
            <span className="console-icon">🎤</span>
            GEMINI LIVE COMMAND CENTER
          </div>
          <div className="console-status">
            <div className={`status-indicator ${isTyping ? 'receiving' : 'standby'}`}></div>
            <span className="status-text">
              {isTyping ? '[RECVING VOICE COMMAND...]' : '[STATUS: STANDBY]'}
            </span>
          </div>
        </div>
        
        <div className="console-body">
          {/* Current typing command */}
          {isTyping && (
            <div className="console-line current-line">
              <span className="console-prompt">NEXUS:~$ </span>
              <span className="console-input">{currentCommand}</span>
              <span className="console-cursor">_</span>
            </div>
          )}
          
          {/* Command history */}
          <div className="command-history">
            {commandLogs.map(log => (
              <div key={log.id} className="console-line">
                <span className="command-timestamp">
                  [{log.timestamp.toLocaleTimeString()}]
                </span>
                <span className="command-text">{log.command}</span>
                <span className={`command-status ${log.status}`}>
                  {log.status === 'executed' ? '[STATUS: EXECUTED]' : 
                   log.status === 'processing' ? '[PROCESSING...]' : 
                   log.status === 'error' ? '[ERROR]' : '[RECEIVING...]'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
