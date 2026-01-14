'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface BusinessMetrics {
  flastal: { serverLoad: number; activeEvents: number; uptime: number; responseTime: number; lastSync: Date };
  larubot: { successRate: number; totalRequests: number; errorRate: number; responseTime: number; lastSync: Date };
  laruvisona: { pageViews: number; uniqueVisitors: number; conversionRate: number; responseTime: number; lastSync: Date };
}

interface SystemEvent {
  id: string;
  timestamp: Date;
  type: 'deployment' | 'auth' | 'error' | 'metric' | 'security';
  message: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export default function LARUNexusControl() {
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [isSystemPurging, setIsSystemPurging] = useState(false);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics>({
    flastal: { serverLoad: 23.7, activeEvents: 847, uptime: 99.97, responseTime: 24, lastSync: new Date() },
    larubot: { successRate: 96.4, totalRequests: 12847, errorRate: 3.6, responseTime: 156, lastSync: new Date() },
    laruvisona: { pageViews: 25648, uniqueVisitors: 8921, conversionRate: 4.2, responseTime: 89, lastSync: new Date() }
  });
  
  const flastalWaveRef = useRef<HTMLCanvasElement>(null);
  const larubotWaveRef = useRef<HTMLCanvasElement>(null);
  const laruVisonaWaveRef = useRef<HTMLCanvasElement>(null);
  const mFlastalWaveRef = useRef<HTMLCanvasElement>(null);
  const mLarubotWaveRef = useRef<HTMLCanvasElement>(null);
  const mLaruVisonaWaveRef = useRef<HTMLCanvasElement>(null);
  
  const drawEnhancedWaveform = useCallback((canvas: HTMLCanvasElement, primaryColor: string, frequency: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let animationFrame = 0;
    
    const animate = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const centerY = height / 2;
      
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1;

      // Primary
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      for (let x = 0; x < width; x += 2) {
        const y = centerY + Math.sin((x + animationFrame) * frequency) * 10;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Harmonic
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      for (let x = 0; x < width; x += 3) {
        const y = centerY + Math.sin((x + animationFrame * 1.5) * frequency * 2) * 6;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      animationFrame += 2;
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);
  
  useEffect(() => {
    const refs = [
      { ref: flastalWaveRef, color: '#ff006e', freq: 0.02 },
      { ref: larubotWaveRef, color: '#00f2ff', freq: 0.025 },
      { ref: laruVisonaWaveRef, color: '#39ff14', freq: 0.03 },
      { ref: mFlastalWaveRef, color: '#ff006e', freq: 0.02 },
      { ref: mLarubotWaveRef, color: '#00f2ff', freq: 0.025 },
      { ref: mLaruVisonaWaveRef, color: '#39ff14', freq: 0.03 }
    ];

    refs.forEach(({ ref, color, freq }) => {
      if (ref.current) {
        ref.current.width = ref.current.offsetWidth * 2;
        ref.current.height = 80;
        drawEnhancedWaveform(ref.current, color, freq);
      }
    });
  }, [drawEnhancedWaveform]);
  
  const terminalTypeCommand = useCallback(async (command: string) => {
    setIsTyping(true);
    setCurrentCommand('');
    for (let i = 0; i <= command.length; i++) {
      setCurrentCommand(command.slice(0, i));
      await new Promise(r => setTimeout(r, 30));
    }
    setIsTyping(false);
    const newEvent: SystemEvent = {
      id: Math.random().toString(36),
      timestamp: new Date(),
      type: 'metric',
      message: command,
      status: 'success'
    };
    setSystemEvents(prev => [newEvent, ...prev.slice(0, 20)]);
  }, []);
  
  const runSystemPurgeAndTest = useCallback(async () => {
    if (isSystemPurging) return;
    setIsSystemPurging(true);
    const commands = [
      'INITIATING SYSTEM PURGE',
      'SCANNING ARCHITECTURE...',
      'LARUBOT AI NEURAL CHECK',
      'FLASTAL ENDPOINT VALIDATION',
      'PURGE COMPLETED'
    ];
    for (const cmd of commands) {
      await terminalTypeCommand(cmd);
      await new Promise(r => setTimeout(r, 800));
    }
    setIsSystemPurging(false);
  }, [isSystemPurging, terminalTypeCommand]);

  const formatTS = (d: Date) => d.toLocaleTimeString('ja-JP', { hour12: false });
  
  return (
    <div className="nexus-fortress">
      <div className="grid-overlay"></div>
      
      {/* Desktop */}
      <div className="desktop-layout">
        <div className="status-column">
          <div className="column-header">
            <div className="header-line"></div>
            <span className="header-text">SYSTEM MONITOR</span>
            <div className="header-line"></div>
          </div>
          
          {[
            { id: 'flastal', label: 'FLASTAL', ref: flastalWaveRef, metrics: businessMetrics.flastal },
            { id: 'larubot', label: 'LARUBOT', ref: larubotWaveRef, metrics: businessMetrics.larubot },
            { id: 'laruvisona', label: 'LARUVISONA', ref: laruVisonaWaveRef, metrics: businessMetrics.laruvisona }
          ].map(unit => (
            <div key={unit.id} 
              className={`business-unit ${unit.id}-unit ${selectedBusiness === unit.id ? 'active' : ''}`}
              onClick={() => setSelectedBusiness(unit.id)}>
              <div className="unit-header">
                <span className="unit-name">{unit.label}</span>
              </div>
              <div className="unit-waveform">
                <canvas ref={unit.ref}></canvas>
              </div>
              <div className="unit-metrics">
                <div className="metric-line">
                  <span className="metric-label">RESPONSE</span>
                  <span className="metric-value">{unit.metrics.responseTime}MS</span>
                </div>
                <div className="metric-line">
                  <span className="metric-label">LAST_SYNC</span>
                  <span className="metric-value">{formatTS(unit.metrics.lastSync)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="control-column">
          <div className="column-header">
            <div className="header-line"></div>
            <span className="header-text">NEXUS CORE</span>
            <div className="header-line"></div>
          </div>
          <div className="purge-control">
            <button className={`purge-button ${isSystemPurging ? 'active' : ''}`} onClick={runSystemPurgeAndTest}>
              <div className="button-text">
                <span className="button-title">SYSTEM PURGE & TEST</span>
                <span className="button-status">{isSystemPurging ? 'EXECUTING...' : 'READY'}</span>
              </div>
            </button>
          </div>
          <div className="central-hub">
            <div className="hub-rings">
              <div className="hub-ring ring-1"></div>
              <div className="hub-ring ring-2"></div>
              <div className="hub-ring ring-3"></div>
              <div className="hub-core"><div className="core-text">LARU</div></div>
            </div>
          </div>
        </div>
        
        <div className="terminal-column">
          <div className="column-header">
            <div className="header-line"></div>
            <span className="header-text">TERMINAL</span>
            <div className="header-line"></div>
          </div>
          <div className="terminal-console">
            <div className="terminal-body">
              {isTyping && (
                <div className="terminal-line">
                  <span className="terminal-prompt">NEXUS:~$</span>
                  <span className="terminal-input">{currentCommand}_</span>
                </div>
              )}
              {systemEvents.map(e => (
                <div key={e.id} className="terminal-line">
                  <span className="event-timestamp">[{formatTS(e.timestamp)}]</span>
                  <span className="event-message">{e.message}</span>
                  <span className={`event-status ${e.status}`}>[{e.status.toUpperCase()}]</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile */}
      <div className="mobile-layout">
        <div className="mobile-section">
          <div className="mobile-header">SYSTEM STATUS</div>
          <div className="mobile-business-grid">
            <div className="mobile-business-unit flastal">
              <div className="mobile-unit-header"><span>FLASTAL</span><span>{businessMetrics.flastal.responseTime}MS</span></div>
              <canvas ref={mFlastalWaveRef} className="mobile-waveform"></canvas>
            </div>
            <div className="mobile-business-unit larubot">
              <div className="mobile-unit-header"><span>LARUBOT</span><span>{businessMetrics.larubot.responseTime}MS</span></div>
              <canvas ref={mLarubotWaveRef} className="mobile-waveform"></canvas>
            </div>
            <div className="mobile-business-unit laruvisona">
              <div className="mobile-unit-header"><span>LARUVISONA</span><span>{businessMetrics.laruvisona.responseTime}MS</span></div>
              <canvas ref={mLaruVisonaWaveRef} className="mobile-waveform"></canvas>
            </div>
          </div>
        </div>
        
        <div className="mobile-section">
          <div className="mobile-header">CORE CONTROL</div>
          <button className={`mobile-purge-button ${isSystemPurging ? 'active' : ''}`} onClick={runSystemPurgeAndTest}>
            {isSystemPurging ? 'EXECUTING...' : 'SYSTEM PURGE & TEST'}
          </button>
        </div>
        
        <div className="mobile-section">
          <div className="mobile-header">TERMINAL</div>
          <div className="mobile-terminal">
            {isTyping && <div style={{color: '#39ff14'}}>NEXUS:~$ {currentCommand}_</div>}
            {systemEvents.slice(0, 10).map(e => (
              <div key={e.id}>[{formatTS(e.timestamp)}] {e.message}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}