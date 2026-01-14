'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface BusinessMetrics {
  flastal: { 
    serverLoad: number; 
    activeEvents: number; 
    uptime: number; 
    responseTime: number; 
    lastSync: Date;
    status: 'normal' | 'warning' | 'error';
    dailyUsers: number;
    errorCount: number;
  };
  larubot: { 
    successRate: number; 
    totalRequests: number; 
    errorRate: number; 
    responseTime: number; 
    lastSync: Date;
    status: 'normal' | 'warning' | 'error';
    activeChats: number;
    queueSize: number;
  };
  laruvisona: { 
    pageViews: number; 
    uniqueVisitors: number; 
    conversionRate: number; 
    responseTime: number; 
    lastSync: Date;
    status: 'normal' | 'warning' | 'error';
    bounceRate: number;
    avgSessionTime: number;
  };
}

interface SystemEvent {
  id: string;
  timestamp: Date;
  type: 'deployment' | 'auth' | 'error' | 'metric' | 'security' | 'maintenance' | 'alert';
  message: string;
  status: 'success' | 'warning' | 'error' | 'info';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: Date;
  acknowledged: boolean;
}

export default function LARUControlPanel() {
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'logs' | 'settings' | 'status' | 'control'>('overview');
  const [isSystemPurging, setIsSystemPurging] = useState(false);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics>({
    flastal: { 
      serverLoad: 23.7, 
      activeEvents: 847, 
      uptime: 99.97, 
      responseTime: 24, 
      lastSync: new Date(),
      status: 'normal',
      dailyUsers: 2341,
      errorCount: 3
    },
    larubot: { 
      successRate: 96.4, 
      totalRequests: 12847, 
      errorRate: 3.6, 
      responseTime: 156, 
      lastSync: new Date(),
      status: 'normal',
      activeChats: 45,
      queueSize: 8
    },
    laruvisona: { 
      pageViews: 25648, 
      uniqueVisitors: 8921, 
      conversionRate: 4.2, 
      responseTime: 89, 
      lastSync: new Date(),
      status: 'normal',
      bounceRate: 42.3,
      avgSessionTime: 185
    }
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

      // Primary waveform
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      for (let x = 0; x < width; x += 2) {
        const y = centerY + Math.sin((x + animationFrame) * frequency) * 12;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Harmonic overlay
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      for (let x = 0; x < width; x += 3) {
        const y = centerY + Math.sin((x + animationFrame * 1.5) * frequency * 2) * 8;
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
      status: 'success',
      priority: 'medium'
    };
    setSystemEvents(prev => [newEvent, ...prev.slice(0, 20)]);
  }, []);
  
  const runSystemPurgeAndTest = useCallback(async () => {
    if (isSystemPurging) return;
    setIsSystemPurging(true);
    const commands = [
      'システム全体パージを開始します',
      'FLASTALサーバーアーキテクチャをスキャン中...',
      'LARUBOT AIニューラルネットワーク整合性チェック',
      'LARUVISONAエンドポイント検証完了',
      'キャッシュクリア・ログローテーション実行',
      'データベース最適化実行中',
      'システムパージ完了 - 全サービス正常稼働中'
    ];
    for (const cmd of commands) {
      await terminalTypeCommand(cmd);
      await new Promise(r => setTimeout(r, 1000));
    }
    setIsSystemPurging(false);
  }, [isSystemPurging, terminalTypeCommand]);

  const handleEmergencyShutdown = useCallback(async () => {
    if (window.confirm('緊急シャットダウンを実行しますか？\nこの操作により全サービスが一時的に停止します。')) {
      await terminalTypeCommand('緊急シャットダウンシーケンス開始');
      await new Promise(r => setTimeout(r, 2000));
      await terminalTypeCommand('全サービスを安全にシャットダウン完了');
    }
  }, [terminalTypeCommand]);

  const handleMaintenanceToggle = useCallback(async () => {
    setIsMaintenanceMode(!isMaintenanceMode);
    const msg = isMaintenanceMode ? 'メンテナンスモード解除' : 'メンテナンスモードに移行';
    await terminalTypeCommand(msg);
  }, [isMaintenanceMode, terminalTypeCommand]);

  const formatTS = (d: Date) => d.toLocaleString('ja-JP', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });

  // Auto-refresh metrics
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setBusinessMetrics(prev => ({
        flastal: {
          ...prev.flastal,
          responseTime: Math.floor(Math.random() * 50) + 20,
          lastSync: new Date(),
          dailyUsers: prev.flastal.dailyUsers + Math.floor(Math.random() * 10),
          errorCount: Math.max(0, prev.flastal.errorCount + Math.floor(Math.random() * 3) - 1)
        },
        larubot: {
          ...prev.larubot,
          responseTime: Math.floor(Math.random() * 100) + 120,
          lastSync: new Date(),
          activeChats: Math.max(0, prev.larubot.activeChats + Math.floor(Math.random() * 6) - 3),
          queueSize: Math.max(0, prev.larubot.queueSize + Math.floor(Math.random() * 4) - 2)
        },
        laruvisona: {
          ...prev.laruvisona,
          responseTime: Math.floor(Math.random() * 80) + 60,
          lastSync: new Date(),
          pageViews: prev.laruvisona.pageViews + Math.floor(Math.random() * 50),
          uniqueVisitors: prev.laruvisona.uniqueVisitors + Math.floor(Math.random() * 20)
        }
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);
  
  // Generate periodic system events
  useEffect(() => {
    const eventMessages = [
      'システムヘルスチェック完了',
      '自動バックアップ実行中',
      'セキュリティスキャン完了',
      'パフォーマンス最適化実行',
      'データベース同期完了',
      'SSL証明書更新確認',
      'CDNキャッシュ最適化完了'
    ];
    
    const interval = setInterval(() => {
      if (autoRefresh) {
        const randomMsg = eventMessages[Math.floor(Math.random() * eventMessages.length)];
        const newEvent: SystemEvent = {
          id: Math.random().toString(36),
          timestamp: new Date(),
          type: 'metric',
          message: randomMsg,
          status: 'success',
          priority: 'low'
        };
        setSystemEvents(prev => [newEvent, ...prev.slice(0, 25)]);
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'normal': return '#39ff14';
      case 'warning': return '#ffaa00';  
      case 'error': return '#ff4444';
      default: return '#ffffff';
    }
  };

  const businessUnits = [
    { 
      id: 'flastal', 
      label: 'FLASTAL', 
      japanese: 'フラスタル',
      description: '花卉・園芸マーケットプレイス',
      ref: flastalWaveRef, 
      mobileRef: mFlastalWaveRef,
      metrics: businessMetrics.flastal,
      color: '#ff006e'
    },
    { 
      id: 'larubot', 
      label: 'LARUBOT', 
      japanese: 'ラルボット',
      description: 'AI自動応答システム',
      ref: larubotWaveRef, 
      mobileRef: mLarubotWaveRef,
      metrics: businessMetrics.larubot,
      color: '#00f2ff'
    },
    { 
      id: 'laruvisona', 
      label: 'LARUVISONA', 
      japanese: 'ラルビソナ',
      description: 'コーポレートサイト',
      ref: laruVisonaWaveRef, 
      mobileRef: mLaruVisonaWaveRef,
      metrics: businessMetrics.laruvisona,
      color: '#39ff14'
    }
  ];
  
  return (
    <div className="nexus-fortress">
      <div className="grid-overlay"></div>
      
      {/* Header */}
      <div className="system-header">
        <div className="header-brand">
          <h1>LARU統合管制システム</h1>
          <span className="header-subtitle">Integrated Control Panel</span>
        </div>
        <div className="header-controls">
          <button 
            className={`header-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title="自動更新の切り替え"
          >
            自動更新 {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button 
            className="header-btn maintenance"
            onClick={handleMaintenanceToggle}
            title="メンテナンスモードの切り替え"
          >
            {isMaintenanceMode ? 'メンテナンス中' : '通常運用中'}
          </button>
          <button 
            className="header-btn emergency"
            onClick={handleEmergencyShutdown}
            title="緊急シャットダウン"
          >
            緊急停止
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="desktop-layout">
        <div className="status-column">
          <div className="column-header">
            <div className="header-line"></div>
            <span className="header-text">システム監視</span>
            <div className="header-line"></div>
          </div>
          
          {businessUnits.map(unit => (
            <div key={unit.id} 
              className={`business-unit ${unit.id}-unit ${selectedBusiness === unit.id ? 'active' : ''}`}
              onClick={() => setSelectedBusiness(selectedBusiness === unit.id ? null : unit.id)}
              style={{ borderLeftColor: unit.color }}>
              
              <div className="unit-header">
                <div className="unit-title">
                  <span className="unit-name">{unit.label}</span>
                  <span className="unit-japanese">{unit.japanese}</span>
                </div>
                <div 
                  className="unit-status-dot" 
                  style={{ backgroundColor: getStatusColor(unit.metrics.status) }}
                  title={`ステータス: ${unit.metrics.status}`}
                ></div>
              </div>
              
              <div className="unit-description">{unit.description}</div>
              
              <div className="unit-waveform">
                <canvas ref={unit.ref}></canvas>
              </div>
              
              <div className="unit-metrics">
                <div className="metric-line">
                  <span className="metric-label">応答時間</span>
                  <span className="metric-value">{unit.metrics.responseTime}ms</span>
                </div>
                <div className="metric-line">
                  <span className="metric-label">最終同期</span>
                  <span className="metric-value">{formatTS(unit.metrics.lastSync).split(' ')[1]}</span>
                </div>
                {unit.id === 'flastal' && (
                  <>
                    <div className="metric-line">
                      <span className="metric-label">日次利用者</span>
                      <span className="metric-value">{unit.metrics.dailyUsers.toLocaleString()}人</span>
                    </div>
                    <div className="metric-line">
                      <span className="metric-label">エラー件数</span>
                      <span className="metric-value">{unit.metrics.errorCount}件</span>
                    </div>
                  </>
                )}
                {unit.id === 'larubot' && (
                  <>
                    <div className="metric-line">
                      <span className="metric-label">アクティブチャット</span>
                      <span className="metric-value">{unit.metrics.activeChats}件</span>
                    </div>
                    <div className="metric-line">
                      <span className="metric-label">キュー待機</span>
                      <span className="metric-value">{unit.metrics.queueSize}件</span>
                    </div>
                  </>
                )}
                {unit.id === 'laruvisona' && (
                  <>
                    <div className="metric-line">
                      <span className="metric-label">直帰率</span>
                      <span className="metric-value">{unit.metrics.bounceRate.toFixed(1)}%</span>
                    </div>
                    <div className="metric-line">
                      <span className="metric-label">平均セッション時間</span>
                      <span className="metric-value">{Math.floor(unit.metrics.avgSessionTime / 60)}分{unit.metrics.avgSessionTime % 60}秒</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="control-column">
          <div className="column-header">
            <div className="header-line"></div>
            <span className="header-text">制御パネル</span>
            <div className="header-line"></div>
          </div>
          
          <div className="control-tabs">
            {[
              { id: 'overview', label: '概要', icon: '◉' },
              { id: 'alerts', label: 'アラート', icon: '⚠' },
              { id: 'logs', label: 'ログ', icon: '📊' },
              { id: 'settings', label: '設定', icon: '⚙' }
            ].map(tab => (
              <button 
                key={tab.id}
                className={`tab-btn ${selectedTab === tab.id ? 'active' : ''}`}
                onClick={() => setSelectedTab(tab.id as any)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {selectedTab === 'overview' && (
            <div className="tab-content">
              <div className="purge-control">
                <button 
                  className={`purge-button ${isSystemPurging ? 'active' : ''}`} 
                  onClick={runSystemPurgeAndTest}
                  disabled={isSystemPurging}
                >
                  <div className="button-text">
                    <span className="button-title">システム全体パージ&テスト</span>
                    <span className="button-status">
                      {isSystemPurging ? '実行中...' : '実行可能'}
                    </span>
                  </div>
                </button>
              </div>
              
              <div className="central-hub">
                <div className="hub-rings">
                  <div className="hub-ring ring-1"></div>
                  <div className="hub-ring ring-2"></div>
                  <div className="hub-ring ring-3"></div>
                  <div className="hub-core">
                    <div className="core-text">LARU</div>
                    <div className="core-text">統合制御</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'alerts' && (
            <div className="tab-content alerts-content">
              <h3>システムアラート</h3>
              <div className="alert-summary">
                <div className="alert-count critical">重要: 0件</div>
                <div className="alert-count warning">警告: 0件</div>
                <div className="alert-count info">情報: 0件</div>
              </div>
              <div className="alert-message">
                現在、システムアラートはありません。<br/>
                全サービスが正常に稼働中です。
              </div>
            </div>
          )}

          {selectedTab === 'settings' && (
            <div className="tab-content settings-content">
              <h3>システム設定</h3>
              <div className="setting-group">
                <label className="setting-item">
                  <input 
                    type="checkbox" 
                    checked={autoRefresh} 
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                  自動更新を有効にする
                </label>
                <label className="setting-item">
                  <input 
                    type="checkbox" 
                    checked={isMaintenanceMode} 
                    onChange={(e) => setIsMaintenanceMode(e.target.checked)}
                  />
                  メンテナンスモード
                </label>
              </div>
            </div>
          )}
        </div>
        
        <div className="terminal-column">
          <div className="column-header">
            <div className="header-line"></div>
            <span className="header-text">システムログ</span>
            <div className="header-line"></div>
          </div>
          <div className="terminal-console">
            <div className="terminal-body">
              {isTyping && (
                <div className="terminal-line active">
                  <span className="terminal-prompt">NEXUS:~$</span>
                  <span className="terminal-input">{currentCommand}_</span>
                </div>
              )}
              {systemEvents.map(e => (
                <div key={e.id} className="terminal-line">
                  <span className="event-timestamp">[{formatTS(e.timestamp).split(' ')[1]}]</span>
                  <span className="event-message">{e.message}</span>
                  <span className={`event-status ${e.status}`}>
                    [{e.status === 'success' ? '成功' : e.status === 'warning' ? '警告' : e.status === 'error' ? 'エラー' : '情報'}]
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="mobile-layout">
        <div className="mobile-nav">
          {[
            { id: 'status', label: 'ステータス', icon: '📊' },
            { id: 'control', label: '制御', icon: '⚙' },
            { id: 'logs', label: 'ログ', icon: '📋' }
          ].map(nav => (
            <button 
              key={nav.id}
              className={`mobile-nav-btn ${selectedTab === nav.id ? 'active' : ''}`}
              onClick={() => setSelectedTab(nav.id as any)}
            >
              <span className="nav-icon">{nav.icon}</span>
              <span className="nav-label">{nav.label}</span>
            </button>
          ))}
        </div>

        {selectedTab === 'status' && (
          <div className="mobile-section">
            <div className="mobile-header">システム状況</div>
            <div className="mobile-business-grid">
              {businessUnits.map(unit => (
                <div key={unit.id} className={`mobile-business-unit ${unit.id}`}>
                  <div className="mobile-unit-header">
                    <div>
                      <span className="mobile-unit-name">{unit.japanese}</span>
                      <span className="mobile-unit-desc">{unit.description}</span>
                    </div>
                    <span className="mobile-response-time">{unit.metrics.responseTime}ms</span>
                  </div>
                  <canvas ref={unit.mobileRef} className="mobile-waveform"></canvas>
                  <div className="mobile-unit-metrics">
                    {unit.id === 'flastal' && (
                      <div className="mobile-metric-row">
                        <span>利用者: {unit.metrics.dailyUsers.toLocaleString()}人</span>
                        <span>エラー: {unit.metrics.errorCount}件</span>
                      </div>
                    )}
                    {unit.id === 'larubot' && (
                      <div className="mobile-metric-row">
                        <span>チャット: {unit.metrics.activeChats}件</span>
                        <span>待機: {unit.metrics.queueSize}件</span>
                      </div>
                    )}
                    {unit.id === 'laruvisona' && (
                      <div className="mobile-metric-row">
                        <span>直帰率: {unit.metrics.bounceRate.toFixed(1)}%</span>
                        <span>セッション: {Math.floor(unit.metrics.avgSessionTime / 60)}分</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'control' && (
          <div className="mobile-section">
            <div className="mobile-header">システム制御</div>
            <div className="mobile-controls">
              <button 
                className={`mobile-control-btn primary ${isSystemPurging ? 'active' : ''}`}
                onClick={runSystemPurgeAndTest}
                disabled={isSystemPurging}
              >
                {isSystemPurging ? 'パージ実行中...' : 'システム全体パージ&テスト'}
              </button>
              <button 
                className="mobile-control-btn"
                onClick={handleMaintenanceToggle}
              >
                {isMaintenanceMode ? 'メンテナンス解除' : 'メンテナンス開始'}
              </button>
              <button 
                className="mobile-control-btn emergency"
                onClick={handleEmergencyShutdown}
              >
                緊急停止
              </button>
            </div>
          </div>
        )}

        {selectedTab === 'logs' && (
          <div className="mobile-section">
            <div className="mobile-header">システムログ</div>
            <div className="mobile-terminal">
              {isTyping && (
                <div className="mobile-terminal-line active">
                  <span>実行中: {currentCommand}_</span>
                </div>
              )}
              {systemEvents.slice(0, 15).map(e => (
                <div key={e.id} className="mobile-terminal-line">
                  <div className="mobile-log-time">[{formatTS(e.timestamp).split(' ')[1]}]</div>
                  <div className="mobile-log-message">{e.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
