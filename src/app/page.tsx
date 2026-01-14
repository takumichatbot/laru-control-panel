'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface BusinessHub {
  id: 'flastal' | 'larubot' | 'laruvisona';
  name: string;
  icon: string;
  color: string;
  status: 'online' | 'offline' | 'warning';
  metrics: {
    primary: number;
    secondary: number;
    tertiary: string;
  };
}

interface VoiceCommand {
  id: string;
  timestamp: Date;
  command: string;
  status: 'processing' | 'completed' | 'error';
  response?: string;
}

export default function LARUNexus() {
  // Core States
  const [activeHub, setActiveHub] = useState<string | null>(null);
  const [businessHubs, setBusinessHubs] = useState<BusinessHub[]>([
    {
      id: 'flastal',
      name: 'Flastal',
      icon: '🌸',
      color: '#ff006e',
      status: 'online',
      metrics: { primary: 98.7, secondary: 1247, tertiary: 'Active Events' }
    },
    {
      id: 'larubot',
      name: 'LARUbot',
      icon: '🤖',
      color: '#00f2ff',
      status: 'online', 
      metrics: { primary: 94.2, secondary: 8341, tertiary: 'AI Responses' }
    },
    {
      id: 'laruvisona',
      name: 'LARUVISONA',
      icon: '🏢',
      color: '#39ff14',
      status: 'online',
      metrics: { primary: 15847, secondary: 3291, tertiary: 'Page Views' }
    }
  ]);
  
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypedText, setCurrentTypedText] = useState('');
  
  // Canvas Refs for Animations
  const heartbeatCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  
  // Heartbeat Animation for AI Success Rate
  useEffect(() => {
    const canvas = heartbeatCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 400;
    canvas.height = 100;
    
    let x = 0;
    let heartRate = businessHubs.find(h => h.id === 'larubot')?.metrics.primary || 94;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Gradient for the line
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#39ff14');
      gradient.addColorStop(0.5, '#00f2ff');
      gradient.addColorStop(1, '#39ff14');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#39ff14';
      ctx.beginPath();
      
      for (let i = 0; i < canvas.width; i += 2) {
        const baseY = canvas.height / 2;
        const heartbeat = Math.sin((i + x) * 0.05) * 20;
        const pulse = heartRate > 90 ? Math.sin((i + x) * 0.2) * 15 : 0;
        const noise = (Math.random() - 0.5) * 2;
        
        const y = baseY + heartbeat + pulse + noise;
        
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      
      ctx.stroke();
      x += 3;
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [businessHubs]);
  
  // Grid Background Animation
  useEffect(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    let animationId: number;
    let time = 0;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gridSize = 50;
      const offsetX = (time * 0.5) % gridSize;
      const offsetY = (time * 0.3) % gridSize;
      
      // Flowing grid lines
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.1)';
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = -gridSize + offsetX; x < canvas.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = -gridSize + offsetY; y < canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Occasional scanning effect
      if (Math.random() < 0.005) {
        const scanY = Math.random() * canvas.height;
        const gradient = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, 'rgba(57, 255, 20, 0.8)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, scanY - 2, canvas.width, 4);
      }
      
      time += 1;
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  // Typing Animation for Voice Commands
  const typeText = useCallback(async (text: string) => {
    setIsTyping(true);
    setCurrentTypedText('');
    
    for (let i = 0; i <= text.length; i++) {
      setCurrentTypedText(text.slice(0, i));
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    setIsTyping(false);
  }, []);
  
  // Simulate Voice Commands
  const simulateVoiceCommand = useCallback(() => {
    const commands = [
      'システム統合ステータスを確認して',
      'LARUbotの応答品質を最適化して',
      'フラスタルの新規イベント数を表示して',
      'LARAVISONAのトラフィック分析を実行',
      'Gemini Live待機モードを開始'
    ];
    
    const randomCommand = commands[Math.floor(Math.random() * commands.length)];
    const newCommand: VoiceCommand = {
      id: Date.now().toString(),
      timestamp: new Date(),
      command: randomCommand,
      status: 'processing'
    };
    
    setVoiceCommands(prev => [newCommand, ...prev.slice(0, 9)]);
    typeText(randomCommand);
    
    // Complete after delay
    setTimeout(() => {
      setVoiceCommands(prev => 
        prev.map(cmd => 
          cmd.id === newCommand.id 
            ? { ...cmd, status: 'completed', response: '[OK] TASK_COMPLETED' }
            : cmd
        )
      );
    }, 3000);
  }, [typeText]);
  
  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setBusinessHubs(prev => prev.map(hub => ({
        ...hub,
        metrics: {
          ...hub.metrics,
          primary: hub.metrics.primary + (Math.random() - 0.5) * 2,
          secondary: hub.metrics.secondary + Math.floor(Math.random() * 10)
        }
      })));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Auto-generate voice commands
  useEffect(() => {
    const interval = setInterval(simulateVoiceCommand, 15000);
    return () => clearInterval(interval);
  }, [simulateVoiceCommand]);

  return (
    <div className="nexus-container">
      {/* Animated Grid Background */}
      <canvas 
        ref={gridCanvasRef}
        className="nexus-grid-bg"
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}
      />
      
      {/* Scan Line Effect */}
      <div 
        ref={scanLineRef}
        className="nexus-scanline"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #39ff14, transparent)',
          animation: 'scan 4s linear infinite',
          zIndex: 1
        }}
      />
      
      <div className="nexus-content">
        {/* Header */}
        <header className="nexus-header">
          <div className="nexus-title">
            <span className="nexus-logo">⚡</span>
            <h1>LARU-Nexus</h1>
            <span className="nexus-subtitle">事業統括ハイテク要塞</span>
          </div>
          <div className="nexus-status">
            <div className="nexus-indicator nexus-indicator--online"></div>
            <span>SYSTEM OPERATIONAL</span>
          </div>
        </header>

        {/* Hologram Hub - Circular Menu */}
        <section className="nexus-hologram-hub">
          <div className="nexus-hub-container">
            {businessHubs.map((hub, index) => {
              const angle = (index * 120) - 90; // 120 degrees apart, starting from top
              const radian = (angle * Math.PI) / 180;
              const x = Math.cos(radian) * 120;
              const y = Math.sin(radian) * 120;
              
              return (
                <button
                  key={hub.id}
                  className={`nexus-hub-node ${activeHub === hub.id ? 'nexus-hub-node--active' : ''}`}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    borderColor: hub.color,
                    color: activeHub === hub.id ? '#000000' : hub.color,
                    backgroundColor: activeHub === hub.id ? hub.color : 'transparent'
                  }}
                  onClick={() => setActiveHub(activeHub === hub.id ? null : hub.id)}
                >
                  <div className="nexus-hub-icon">{hub.icon}</div>
                  <div className="nexus-hub-name">{hub.name}</div>
                  <div className="nexus-hub-metric">{hub.metrics.primary.toFixed(1)}%</div>
                </button>
              );
            })}
            
            {/* Central Core */}
            <div className="nexus-hub-core">
              <div className="nexus-hub-core-inner">
                <span>NEXUS</span>
                <span>CORE</span>
              </div>
            </div>
          </div>
        </section>

        {/* Active Hub Details */}
        {activeHub && (
          <section className="nexus-hub-details">
            {(() => {
              const hub = businessHubs.find(h => h.id === activeHub);
              if (!hub) return null;
              
              if (activeHub === 'larubot') {
                return (
                  <div className="nexus-detail-card">
                    <h3>🤖 LARUbot AI監視センター</h3>
                    <div className="nexus-heartbeat-container">
                      <canvas 
                        ref={heartbeatCanvasRef}
                        className="nexus-heartbeat-canvas"
                      />
                      <div className="nexus-heartbeat-label">
                        AI応答成功率: {hub.metrics.primary.toFixed(1)}%
                      </div>
                    </div>
                    <div className="nexus-ai-metrics">
                      <div className="nexus-metric">
                        <span className="nexus-metric-value">{hub.metrics.secondary.toLocaleString()}</span>
                        <span className="nexus-metric-label">総処理数</span>
                      </div>
                      <div className="nexus-metric">
                        <span className="nexus-metric-value">97.3%</span>
                        <span className="nexus-metric-label">ユーザー満足度</span>
                      </div>
                    </div>
                  </div>
                );
              }
              
              if (activeHub === 'laruvisona') {
                return (
                  <div className="nexus-detail-card">
                    <h3>🏢 LARUVISONA トラフィック統制</h3>
                    <div className="nexus-3d-chart">
                      {[...Array(7)].map((_, i) => (
                        <div 
                          key={i}
                          className="nexus-3d-bar"
                          style={{
                            height: `${20 + Math.random() * 60}%`,
                            animationDelay: `${i * 0.2}s`
                          }}
                        >
                          <div className="nexus-3d-bar-top"></div>
                          <div className="nexus-3d-bar-front"></div>
                          <div className="nexus-3d-bar-right"></div>
                        </div>
                      ))}
                    </div>
                    <div className="nexus-traffic-metrics">
                      <div className="nexus-metric">
                        <span className="nexus-metric-value">{hub.metrics.primary.toLocaleString()}</span>
                        <span className="nexus-metric-label">今日のPV</span>
                      </div>
                      <div className="nexus-metric">
                        <span className="nexus-metric-value">{hub.metrics.secondary.toLocaleString()}</span>
                        <span className="nexus-metric-label">ユニーク訪問</span>
                      </div>
                    </div>
                  </div>
                );
              }
              
              if (activeHub === 'flastal') {
                return (
                  <div className="nexus-detail-card">
                    <h3>🌸 Flastal イベント制御</h3>
                    <div className="nexus-flastal-grid">
                      {[...Array(12)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`nexus-flastal-cell ${Math.random() > 0.7 ? 'nexus-flastal-cell--active' : ''}`}
                        />
                      ))}
                    </div>
                    <div className="nexus-flastal-metrics">
                      <div className="nexus-metric">
                        <span className="nexus-metric-value">{hub.metrics.primary.toFixed(1)}%</span>
                        <span className="nexus-metric-label">稼働率</span>
                      </div>
                      <div className="nexus-metric">
                        <span className="nexus-metric-value">{hub.metrics.secondary}</span>
                        <span className="nexus-metric-label">アクティブイベント</span>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return null;
            })()}
          </section>
        )}

        {/* Gemini Live Command Terminal */}
        <section className="nexus-terminal">
          <div className="nexus-terminal-header">
            <div className="nexus-terminal-title">
              <span className="nexus-terminal-icon">🎤</span>
              Gemini Live司令塔
            </div>
            <div className="nexus-terminal-status">
              <div className="nexus-indicator nexus-indicator--active"></div>
              LISTENING
            </div>
          </div>
          
          <div className="nexus-terminal-body">
            {/* Current typing */}
            {isTyping && (
              <div className="nexus-terminal-line">
                <span className="nexus-terminal-prompt">NEXUS:/ $ </span>
                <span className="nexus-terminal-input">{currentTypedText}</span>
                <span className="nexus-terminal-cursor">_</span>
              </div>
            )}
            
            {/* Command history */}
            <div className="nexus-terminal-history">
              {voiceCommands.map(cmd => (
                <div key={cmd.id} className="nexus-terminal-command">
                  <div className="nexus-terminal-line">
                    <span className="nexus-terminal-timestamp">
                      {cmd.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="nexus-terminal-input">{cmd.command}</span>
                  </div>
                  {cmd.response && (
                    <div className="nexus-terminal-response">
                      <span className="nexus-terminal-status">[OK]</span> TASK_COMPLETED
                      <div className="nexus-terminal-pulse"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Thumb-Optimized Controls */}
        <section className="nexus-thumb-controls">
          <button 
            className="nexus-thumb-btn nexus-thumb-btn--primary"
            onClick={simulateVoiceCommand}
          >
            <span className="nexus-thumb-btn-icon">⚡</span>
            <span className="nexus-thumb-btn-label">統合テスト</span>
          </button>
          
          <button className="nexus-thumb-btn nexus-thumb-btn--secondary">
            <span className="nexus-thumb-btn-icon">📊</span>
            <span className="nexus-thumb-btn-label">メトリクス</span>
          </button>
          
          <button className="nexus-thumb-btn nexus-thumb-btn--emergency">
            <span className="nexus-thumb-btn-icon">🚨</span>
            <span className="nexus-thumb-btn-label">緊急停止</span>
          </button>
        </section>
      </div>
    </div>
  );
}
