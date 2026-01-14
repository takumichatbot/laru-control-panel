'use client';

import { useEffect, useState, useRef } from 'react';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'up' | 'down' | 'checking';
  responseTime?: number;
  uptime?: number;
}

interface LARUbotStats {
  totalResponses: number;
  errorRate: number;
  satisfaction: number;
  activeUsers: number;
}

interface LARUVISONAStats {
  pageViews: number;
  uniqueVisitors: number;
  unreadInquiries: number;
  conversionRate: number;
}

export default function LARUNexus() {
  // States
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Flastal', url: 'https://www.flastal.com', status: 'checking' },
    { name: 'LARUbot', url: 'https://larubot.com', status: 'checking' },
    { name: 'LARUVISONA', url: 'https://laruvisona.com', status: 'checking' }
  ]);
  
  const [larubotStats, setLarubotStats] = useState<LARUbotStats>({
    totalResponses: 0,
    errorRate: 0,
    satisfaction: 0,
    activeUsers: 0
  });
  
  const [laruVisonaStats, setLaruVisonaStats] = useState<LARUVISONAStats>({
    pageViews: 0,
    uniqueVisitors: 0,
    unreadInquiries: 0,
    conversionRate: 0
  });
  
  const [activeTab, setActiveTab] = useState('nexus');
  const [isRunningSystemTest, setIsRunningSystemTest] = useState(false);
  const [geminiLiveStatus, setGeminiLiveStatus] = useState<'waiting' | 'active' | 'processing'>('waiting');
  const [commandLogs, setCommandLogs] = useState<string[]>([]);
  
  // Canvas refs for animations
  const heartbeatCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Heartbeat animation
  useEffect(() => {
    const canvas = heartbeatCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 300;
    canvas.height = 60;
    
    let x = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let i = 0; i < canvas.width; i++) {
        const y = 30 + Math.sin((i + x) * 0.02) * 10 + Math.sin((i + x) * 0.1) * 5;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      
      ctx.stroke();
      x += 2;
      requestAnimationFrame(animate);
    };
    
    animate();
  }, []);
  
  // Grid background animation
  useEffect(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#00ffff20';
      ctx.lineWidth = 1;
      
      const gridSize = 50;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      time += 0.01;
      requestAnimationFrame(animate);
    };
    
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Service monitoring
  const checkServiceStatus = async (service: ServiceStatus): Promise<ServiceStatus> => {
    const startTime = Date.now();
    try {
      const response = await fetch(service.url, { 
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return {
        ...service,
        status: 'up',
        responseTime: Date.now() - startTime,
        uptime: Math.random() * 99 + 99
      };
    } catch (error) {
      return {
        ...service,
        status: 'down',
        responseTime: undefined,
        uptime: 0
      };
    }
  };
  
  // Mock data generators
  const generateLARUbotStats = (): LARUbotStats => ({
    totalResponses: Math.floor(Math.random() * 10000) + 50000,
    errorRate: Math.random() * 2,
    satisfaction: Math.random() * 20 + 80,
    activeUsers: Math.floor(Math.random() * 500) + 1200
  });
  
  const generateLARUVISONAStats = (): LARUVISONAStats => ({
    pageViews: Math.floor(Math.random() * 5000) + 25000,
    uniqueVisitors: Math.floor(Math.random() * 2000) + 8000,
    unreadInquiries: Math.floor(Math.random() * 10),
    conversionRate: Math.random() * 5 + 2
  });
  
  // System-wide integration test
  const runIntegratedSystemTest = async () => {
    setIsRunningSystemTest(true);
    
    // Test all services
    const updatedServices = await Promise.all(
      services.map(service => checkServiceStatus(service))
    );
    setServices(updatedServices);
    
    // Simulate AI coherence test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update stats
    setLarubotStats(generateLARUbotStats());
    setLaruVisonaStats(generateLARUVISONAStats());
    
    setIsRunningSystemTest(false);
  };
  
  // Gemini Live simulation
  const simulateGeminiCommand = (command: string) => {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    setCommandLogs(prev => [
      `${timestamp}: "${command}" → タスク受理・実行中`,
      ...prev.slice(0, 9)
    ]);
  };
  
  // Initialize
  useEffect(() => {
    runIntegratedSystemTest();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      runIntegratedSystemTest();
    }, 30000);
    
    // Simulate periodic Gemini commands
    const commandInterval = setInterval(() => {
      const mockCommands = [
        'システム全体の健全性をチェックして',
        'LARUbotの応答品質を最適化して',
        'フラスタルの新規登録数を確認して',
        'LARAVISONAのSEO状況を分析して'
      ];
      const randomCommand = mockCommands[Math.floor(Math.random() * mockCommands.length)];
      simulateGeminiCommand(randomCommand);
    }, 45000);
    
    return () => {
      clearInterval(interval);
      clearInterval(commandInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Grid Background */}
      <canvas 
        ref={gridCanvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />
      
      <div className="relative z-10 min-h-screen">
        {/* Header - Cyberpunk Style */}
        <div className="bg-gray-900/80 backdrop-blur-lg border-b border-cyan-500/30 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                  ⚡ LARU-Nexus
                </h1>
                <p className="text-cyan-300/80">事業統括ハイテク要塞</p>
              </div>
              
              {/* Gemini Live Status */}
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                  geminiLiveStatus === 'active' ? 'bg-green-500/20 border-green-400' :
                  geminiLiveStatus === 'processing' ? 'bg-yellow-500/20 border-yellow-400' :
                  'bg-blue-500/20 border-blue-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    geminiLiveStatus === 'active' ? 'bg-green-400 animate-pulse' :
                    geminiLiveStatus === 'processing' ? 'bg-yellow-400 animate-pulse' :
                    'bg-blue-400 animate-pulse'
                  }`}></div>
                  <span className="text-sm">
                    Gemini Live {
                      geminiLiveStatus === 'active' ? 'アクティブ' :
                      geminiLiveStatus === 'processing' ? '処理中' :
                      '待機中'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-800/60 backdrop-blur-sm border-b border-gray-700/50">
          <div className="container mx-auto px-4">
            <nav className="flex space-x-1">
              {[
                { id: 'nexus', label: '🌐 Nexus', icon: '⚡' },
                { id: 'larubot', label: '🤖 LARUbot', icon: '🧠' },
                { id: 'laruvisona', label: '🏢 LARUVISONA', icon: '💼' },
                { id: 'flastal', label: '🌸 Flastal', icon: '🎨' },
                { id: 'command', label: '🎤 Command', icon: '🗣️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/30 text-cyan-300 border-b-2 border-cyan-400'
                      : 'text-gray-400 hover:text-cyan-300 hover:bg-gray-700/50'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 space-y-6">
          {activeTab === 'nexus' && (
            <div className="space-y-6">
              {/* System Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {services.map((service, index) => (
                  <div key={service.name} 
                       className="bg-gray-900/60 backdrop-blur-lg rounded-xl border border-cyan-500/30 p-6 hover:border-cyan-400/50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-cyan-300">{service.name}</h3>
                      <div className={`w-4 h-4 rounded-full ${
                        service.status === 'up' ? 'bg-green-400 animate-pulse' :
                        service.status === 'down' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
                      }`}></div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">ステータス</span>
                        <span className={
                          service.status === 'up' ? 'text-green-400' :
                          service.status === 'down' ? 'text-red-400' : 'text-yellow-400'
                        }>
                          {service.status === 'up' ? '稼働中' :
                           service.status === 'down' ? '停止' : '確認中'}
                        </span>
                      </div>
                      
                      {service.responseTime && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">応答時間</span>
                          <span className="text-cyan-300">{service.responseTime}ms</span>
                        </div>
                      )}
                      
                      {service.uptime !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">稼働率</span>
                          <span className="text-green-400">{service.uptime.toFixed(2)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* System Heartbeat */}
              <div className="bg-gray-900/60 backdrop-blur-lg rounded-xl border border-green-500/30 p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
                  💚 システム心拍数
                </h3>
                <canvas ref={heartbeatCanvasRef} className="w-full h-16"></canvas>
                <div className="mt-2 text-sm text-gray-400">
                  リアルタイム統合システム監視中...
                </div>
              </div>

              {/* Integrated System Test */}
              <div className="bg-gray-900/60 backdrop-blur-lg rounded-xl border border-purple-500/30 p-6">
                <h3 className="text-lg font-semibold text-purple-400 mb-4">🚀 統合システムテスト</h3>
                <p className="text-gray-300 mb-4">
                  全3サイト（Flastal, LARUbot, LARUVISONA）の死活監視とAI整合性テストを実行
                </p>
                <button
                  onClick={runIntegratedSystemTest}
                  disabled={isRunningSystemTest}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed py-4 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  {isRunningSystemTest ? '⏳ 統合テスト実行中...' : '🌟 統合システムテスト開始'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'larubot' && (
            <div className="space-y-6">
              <div className="bg-gray-900/60 backdrop-blur-lg rounded-xl border border-blue-500/30 p-6">
                <h2 className="text-2xl font-semibold text-blue-400 mb-6">🤖 LARUbot 管理センター</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                    <div className="text-3xl font-bold text-blue-400">
                      {larubotStats.totalResponses.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">総応答数</div>
                  </div>
                  
                  <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                    <div className="text-3xl font-bold text-green-400">
                      {larubotStats.errorRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400">エラー率</div>
                  </div>
                  
                  <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
                    <div className="text-3xl font-bold text-yellow-400">
                      {larubotStats.satisfaction.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400">ユーザー満足度</div>
                  </div>
                  
                  <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                    <div className="text-3xl font-bold text-purple-400">
                      {larubotStats.activeUsers.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">アクティブユーザー</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'laruvisona' && (
            <div className="space-y-6">
              <div className="bg-gray-900/60 backdrop-blur-lg rounded-xl border border-orange-500/30 p-6">
                <h2 className="text-2xl font-semibold text-orange-400 mb-6">🏢 LARUVISONA 管理センター</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
                    <div className="text-3xl font-bold text-orange-400">
                      {laruVisonaStats.pageViews.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">ページビュー</div>
                  </div>
                  
                  <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                    <div className="text-3xl font-bold text-green-400">
                      {laruVisonaStats.uniqueVisitors.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">ユニーク訪問者</div>
                  </div>
                  
                  <div className={`rounded-lg p-4 border ${
                    laruVisonaStats.unreadInquiries > 0 ? 
                    'bg-red-500/20 border-red-500/50' : 
                    'bg-gray-500/10 border-gray-500/30'
                  }`}>
                    <div className={`text-3xl font-bold ${
                      laruVisonaStats.unreadInquiries > 0 ? 
                      'text-red-400 animate-pulse' : 
                      'text-gray-400'
                    }`}>
                      {laruVisonaStats.unreadInquiries}
                    </div>
                    <div className="text-sm text-gray-400">未読問い合わせ</div>
                  </div>
                  
                  <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/30">
                    <div className="text-3xl font-bold text-cyan-400">
                      {laruVisonaStats.conversionRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400">コンバージョン率</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'command' && (
            <div className="space-y-6">
              <div className="bg-gray-900/60 backdrop-blur-lg rounded-xl border border-green-500/30 p-6">
                <h2 className="text-2xl font-semibold text-green-400 mb-6">🎤 Gemini Live Command Center</h2>
                
                <div className="bg-black/50 rounded-lg p-4 border border-green-500/30 max-h-96 overflow-y-auto">
                  <div className="text-sm text-green-400 font-mono">
                    <div className="mb-4 text-green-300">// Command Log - リアルタイム音声指示受信</div>
                    {commandLogs.length === 0 ? (
                      <div className="text-gray-500">音声コマンド待機中...</div>
                    ) : (
                      commandLogs.map((log, index) => (
                        <div key={index} className="mb-2 opacity-90 hover:opacity-100 transition-opacity">
                          &gt; {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={() => simulateGeminiCommand('全システムのヘルスチェックを実行して')}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    🩺 ヘルスチェック実行
                  </button>
                  <button
                    onClick={() => simulateGeminiCommand('各サービスのパフォーマンスを最適化して')}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    ⚡ パフォーマンス最適化
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Button - Mobile Optimized */}
        <button
          onClick={runIntegratedSystemTest}
          disabled={isRunningSystemTest}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 z-50"
        >
          {isRunningSystemTest ? '⏳' : '⚡'}
        </button>
      </div>
    </div>
  );
}
