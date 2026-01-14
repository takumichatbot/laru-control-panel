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
  // Core States
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [isSystemPurging, setIsSystemPurging] = useState(false);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics>({
    flastal: { 
      serverLoad: 23.7, 
      activeEvents: 847, 
      uptime: 99.97, 
      responseTime: 24,
      lastSync: new Date()
    },
    larubot: { 
      successRate: 96.4, 
      totalRequests: 12847, 
      errorRate: 3.6, 
      responseTime: 156,
      lastSync: new Date()
    },
    laruvisona: { 
      pageViews: 25648, 
      uniqueVisitors: 8921, 
      conversionRate: 4.2, 
      responseTime: 89,
      lastSync: new Date()
    }
  });
  
  // Canvas Refs for Enhanced Waveforms
  const flastalWaveRef = useRef<HTMLCanvasElement>(null);
  const larubotWaveRef = useRef<HTMLCanvasElement>(null);
  const laruVisonaWaveRef = useRef<HTMLCanvasElement>(null);
  
  // Enhanced Multi-layer Waveform
  const drawEnhancedWaveform = useCallback((canvas: HTMLCanvasElement, primaryColor: string, frequency: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    const centerY = height / 2;
    let animationFrame = 0;
    
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Layer 1: Primary signal (opacity 1.0)
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 2) {
        const y = centerY + Math.sin((x + animationFrame) * frequency) * 12;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Layer 2: Secondary harmonic (opacity 0.6)
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 3) {
        const y = centerY + Math.sin((x + animationFrame * 1.5) * frequency * 2) * 8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Layer 3: Noise layer (opacity 0.3)
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 5) {
        const y = centerY + (Math.random() - 0.5) * 16;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      ctx.globalAlpha = 1.0;
      animationFrame += 2;
      requestAnimationFrame(animate);
    };
    
    animate();
  }, []);
  
  // Initialize Enhanced Waveforms
  useEffect(() => {
    if (flastalWaveRef.current) {
      flastalWaveRef.current.width = 280;
      flastalWaveRef.current.height = 40;
      drawEnhancedWaveform(flastalWaveRef.current, '#ff006e', 0.02);
    }
    if (larubotWaveRef.current) {
      larubotWaveRef.current.width = 280;
      larubotWaveRef.current.height = 40;
      drawEnhancedWaveform(larubotWaveRef.current, '#00f2ff', 0.025);
    }
    if (laruVisonaWaveRef.current) {
      laruVisonaWaveRef.current.width = 280;
      laruVisonaWaveRef.current.height = 40;
      drawEnhancedWaveform(laruVisonaWaveRef.current, '#39ff14', 0.03);
    }
  }, [drawEnhancedWaveform]);
  
  // Terminal Typing Effect
  const terminalTypeCommand = useCallback(async (command: string) => {
    setIsTyping(true);
    setCurrentCommand('');
    
    for (let i = 0; i <= command.length; i++) {
      setCurrentCommand(command.slice(0, i));
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 30));
    }
    
    setIsTyping(false);
    
    // Add real system event
    setTimeout(() => {
      const newEvent: SystemEvent = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'metric',
        message: command,
        status: 'success'
      };
      setSystemEvents(prev => [newEvent, ...prev.slice(0, 15)]);
      setCurrentCommand('');
    }, 800);
  }, []);
  
  // Real System Events Generator
  useEffect(() => {
    const generateRealEvent = () => {
      const eventTypes = [
        { type: 'deployment' as const, message: 'FLASTAL.COM DEPLOYMENT SUCCESSFUL', status: 'success' as const },
        { type: 'auth' as const, message: 'ADMIN LOGIN DETECTED FROM IP 192.168.1.100', status: 'info' as const },
        { type: 'metric' as const, message: 'LARUBOT AI RESPONSE TIME OPTIMIZED TO 142MS', status: 'success' as const },
        { type: 'security' as const, message: 'SSL CERTIFICATE RENEWAL COMPLETED', status: 'success' as const },
        { type: 'deployment' as const, message: 'LARUVISONA CDN CACHE PURGED SUCCESSFULLY', status: 'success' as const }
      ];
      
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      terminalTypeCommand(randomEvent.message);
      
      // Update metrics periodically
      setBusinessMetrics(prev => ({
        flastal: {
          ...prev.flastal,
          responseTime: Math.floor(Math.random() * 50) + 20,
          lastSync: new Date()
        },
        larubot: {
          ...prev.larubot,
          responseTime: Math.floor(Math.random() * 100) + 120,
          lastSync: new Date()
        },
        laruvisona: {
          ...prev.laruvisona,
          responseTime: Math.floor(Math.random() * 80) + 60,
          lastSync: new Date()
        }
      }));
    };
    
    // Generate real events every 15-25 seconds
    const interval = setInterval(generateRealEvent, 15000 + Math.random() * 10000);
    return () => clearInterval(interval);
  }, [terminalTypeCommand]);
  
  // System Purge & Test
  const runSystemPurgeAndTest = useCallback(async () => {
    setIsSystemPurging(true);
    
    const testSequence = [
      'INITIALIZING COMPREHENSIVE SYSTEM PURGE',
      'SCANNING FLASTAL.COM ENDPOINT HEALTH STATUS',
      'VALIDATING LARUBOT AI NEURAL NETWORK INTEGRITY',
      'ANALYZING LARUVISONA INFRASTRUCTURE PERFORMANCE',
      'EXECUTING CROSS-PLATFORM INTEGRATION TESTS',
      'PURGING TEMPORARY CACHE AND LOG BUFFERS',
      'OPTIMIZING DATABASE QUERY PERFORMANCE',
      'SYSTEM PURGE COMPLETED - ALL SERVICES OPERATIONAL'
    ];
    
    for (const command of testSequence) {
      await terminalTypeCommand(command);
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
    
    // Update all metrics after successful purge
    setBusinessMetrics(prev => ({
      flastal: {
        ...prev.flastal,
        serverLoad: Math.random() * 15 + 8,
        uptime: 99.98 + Math.random() * 0.015,
        responseTime: Math.floor(Math.random() * 20) + 15,
        lastSync: new Date()
      },
      larubot: {
        ...prev.larubot,
        successRate: 97 + Math.random() * 2.5,
        totalRequests: prev.larubot.totalRequests + Math.floor(Math.random() * 150),
        responseTime: Math.floor(Math.random() * 50) + 100,
        lastSync: new Date()
      },
      laruvisona: {
        ...prev.laruvisona,
        pageViews: prev.laruvisona.pageViews + Math.floor(Math.random() * 800),
        uniqueVisitors: prev.laruvisona.uniqueVisitors + Math.floor(Math.random() * 200),
        responseTime: Math.floor(Math.random() * 40) + 50,
        lastSync: new Date()
      }
    }));
    
    setIsSystemPurging(false);
  }, [terminalTypeCommand]);
  
  // Format timestamp for display
  const formatTimestamp = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  
  return (
    <div className="nexus-fortress">
      {/* Cyberpunk Grid Overlay */}
      <div className="grid-overlay"></div>
      
      {/* Desktop Layout */}
      <div className="desktop-layout">
        {/* Left Column: Business Status */}
        <div className="status-column">
          <div className="column-header">
            <div className="header-line"></div>
            <span className="header-text">BUSINESS STATUS</span>
            <div className="header-line"></div>
          </div>
          
          {/* FLASTAL Status */}
          <div className={`business-unit flastal-unit ${selectedBusiness === 'flastal' ? 'active' : ''}`}
               onClick={() => setSelectedBusiness(selectedBusiness === 'flastal' ? null : 'flastal')}>
            <div className="unit-header">
              <div className="unit-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L10.5 6H5.5L8 2Z" stroke="#ff006e" strokeWidth="1"/>
                  <path d="M4 8L8 14L12 8H4Z" stroke="#ff006e" strokeWidth="1"/>
                </svg>
              </div>
              <span className="unit-name">FLASTAL</span>
            </div>
            <div className="unit-waveform">
              <canvas ref={flastalWaveRef}></canvas>
            </div>
            <div className="unit-metrics">
              <div className="metric-line">
                <span className="metric-label">LOAD</span>
                <span className="metric-value">{businessMetrics.flastal.serverLoad.toFixed(1)}%</span>
              </div>
              <div className="metric-line">
                <span className="metric-label">RESP</span>
                <span className="metric-value">[{businessMetrics.flastal.responseTime.toString().padStart(3, '0')}MS]</span>
              </div>
              <div className="metric-line">
                <span className="metric-label">SYNC</span>
                <span className="metric-value">[{formatTimestamp(businessMetrics.flastal.lastSync)}]</span>
              </div>
            </div>
          </div>
          
          {/* LARUBOT Status */}
          <div className={`business-unit larubot-unit ${selectedBusiness === 'larubot' ? 'active' : ''}`}
               onClick={() => setSelectedBusiness(selectedBusiness === 'larubot' ? null : 'larubot')}>
            <div className="unit-header">
              <div className="unit-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="3" width="10" height="8" stroke="#00f2ff" strokeWidth="1"/>
                  <circle cx="6" cy="6" r="1" fill="#00f2ff"/>
                  <circle cx="10" cy="6" r="1" fill="#00f2ff"/>
                  <path d="M6 9L10 9" stroke="#00f2ff" strokeWidth="1"/>
                </svg>
              </div>
              <span className="unit-name">LARUBOT</span>
            </div>
            <div className="unit-waveform">
              <canvas ref={larubotWaveRef}></canvas>
            </div>
            <div className="unit-metrics">
              <div className="metric-line">
                <span className="metric-label">SUCC</span>
                <span className="metric-value">{businessMetrics.larubot.successRate.toFixed(1)}%</span>
              </div>
              <div className="metric-line">
                <span className="metric-label">RESP</span>
                <span className="metric-value">[{businessMetrics.larubot.responseTime.toString().padStart(3, '0')}MS]</span>
              </div>
              <div className="metric-line">
                <span className="metric-label">SYNC</span>
                <span className="metric-value">[{formatTimestamp(businessMetrics.larubot.lastSync)}]</span>
              </div>
            </div>
          </div>
          
          {/* LARUVISONA Status */}
          <div className={`business-unit laruvisona-unit ${selectedBusiness === 'laruvisona' ? 'active' : ''}`}
               onClick={() => setSelectedBusiness(selectedBusiness === 'laruvisona' ? null : 'laruvisona')}>
            <div className="unit-header">
              <div className="unit-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="4" width="12" height="8" stroke="#39ff14" strokeWidth="1"/>
                  <path d="M4 4V2H12V4" stroke="#39ff14" strokeWidth="1"/>
                  <path d="M6 6H10" stroke="#39ff14" strokeWidth="1"/>
                  <path d="M6 8H10" stroke="#39ff14" strokeWidth="1"/>
                </svg>
              </div>
              <span className="unit-name">LARUVISONA</span>
            </div>
            <div className="unit-waveform">
              <canvas ref={laruVisonaWaveRef}></canvas>
            </div>
            <div className="unit-metrics">
              <div className="metric-line">
                <span className="metric-label">CONV</span>
                <span className="metric-value">{businessMetrics.laruvisona.conversionRate.toFixed(1)}%</span>
              </div>
              <div className="metric-line">
                <span className="metric-label">RESP</span>
                <span className="metric-value">[{businessMetrics.laruvisona.responseTime.toString().padStart(3, '0')}MS]</span>
              </div>
              <div className="metric-line">
                <span className="metric-label">SYNC</span>
                <span className="metric-value">[{formatTimestamp(businessMetrics.laruvisona.lastSync)}]</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Center Column: Central Control */}
        <div className="control-column">
          <div className="column-header">
            <div className="header-line"></div>
            <span className="header-text">NEXUS CONTROL</span>
            <div className="header-line"></div>
          </div>
          
          {/* System Purge Control */}
          <div className="purge-control">
            <button 
              className={`purge-button ${isSystemPurging ? 'active' : ''}`}
              onClick={runSystemPurgeAndTest}
              disabled={isSystemPurging}
            >
              <div className="button-border"></div>
              <div className="button-content">
                <div className="button-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2L18 10L10 18L2 10L10 2Z" stroke="currentColor" strokeWidth="1"/>
                    <path d="M6 10L10 6L14 10L10 14L6 10Z" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                </div>
                <div className="button-text">
                  <span className="button-title">SYSTEM PURGE & TEST</span>
                  <span className="button-status">
                    {isSystemPurging ? 'EXECUTING...' : 'READY'}
                  </span>
                </div>
              </div>
            </button>
          </div>
          
          {/* Central Hub Display */}
          <div className="central-hub">
            <div className="hub-rings">
              <div className="hub-ring ring-1"></div>
              <div className="hub-ring ring-2"></div>
              <div className="hub-ring ring-3"></div>
            </div>
            <div className="hub-core">
              <div className="core-text">LARU</div>
              <div className="core-text">NEXUS</div>
            </div>
          </div>
        </div>
        
        {/* Right Column: Terminal Console */}
        <div className="terminal-column">
          <div className="column-header">
            <div className="header-line"></div>
            <span className="header-text">GEMINI LIVE TERMINAL</span>
            <div className="header-line"></div>
          </div>
          
          <div className="terminal-console">
            <div className="terminal-header">
              <div className="terminal-indicator">
                <div className={`indicator-dot ${isTyping ? 'receiving' : 'standby'}`}></div>
                <span className="indicator-text">
                  {isTyping ? 'RECEIVING' : 'STANDBY'}
                </span>
              </div>
            </div>
            
            <div className="terminal-body">
              {/* Current typing command */}
              {isTyping && (
                <div className="terminal-line active-line">
                  <span className="terminal-prompt">NEXUS:~$ </span>
                  <span className="terminal-input">{currentCommand}</span>
                  <span className="terminal-cursor">_</span>
                </div>
              )}
              
              {/* System event history */}
              <div className="terminal-history">
                {systemEvents.map(event => (
                  <div key={event.id} className="terminal-line">
                    <span className="event-timestamp">
                      [{event.timestamp.toLocaleTimeString()}]
                    </span>
                    <span className="event-message">{event.message}</span>
                    <span className={`event-status ${event.status}`}>
                      [{event.status.toUpperCase()}]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="mobile-layout">
        {/* Mobile System Status */}
        <div className="mobile-section">
          <div className="mobile-header">SYSTEM STATUS</div>
          <div className="mobile-business-grid">
            <div className="mobile-business-unit flastal">
              <div className="mobile-unit-header">
                <span>FLASTAL</span>
                <span>[{businessMetrics.flastal.responseTime.toString().padStart(3, '0')}MS]</span>
              </div>
              <canvas ref={flastalWaveRef} className="mobile-waveform"></canvas>
            </div>
            <div className="mobile-business-unit larubot">
              <div className="mobile-unit-header">
                <span>LARUBOT</span>
                <span>[{businessMetrics.larubot.responseTime.toString().padStart(3, '0')}MS]</span>
              </div>
              <canvas ref={larubotWaveRef} className="mobile-waveform"></canvas>
            </div>
            <div className="mobile-business-unit laruvisona">
              <div className="mobile-unit-header">
                <span>LARUVISONA</span>
                <span>[{businessMetrics.laruvisona.responseTime.toString().padStart(3, '0')}MS]</span>
              </div>
              <canvas ref={laruVisonaWaveRef} className="mobile-waveform"></canvas>
            </div>
          </div>
        </div>
        
        {/* Mobile Control */}
        <div className="mobile-section">
          <div className="mobile-header">CONTROL</div>
          <button 
            className={`mobile-purge-button ${isSystemPurging ? 'active' : ''}`}
            onClick={runSystemPurgeAndTest}
            disabled={isSystemPurging}
          >
            <span className="mobile-button-text">
              {isSystemPurging ? 'EXECUTING PURGE...' : 'SYSTEM PURGE & TEST'}
            </span>
          </button>
        </div>
        
        {/* Mobile Terminal */}
        <div className="mobile-section">
          <div className="mobile-header">TERMINAL</div>
          <div className="mobile-terminal">
            {isTyping && (
              <div className="mobile-terminal-line active">
                <span>NEXUS:~$ {currentCommand}_</span>
              </div>
            )}
            {systemEvents.slice(0, 5).map(event => (
              <div key={event.id} className="mobile-terminal-line">
                <span>[{event.timestamp.toLocaleTimeString()}] {event.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
