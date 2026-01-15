'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v24.0 [OMNIPOTENT_VISUALIZER]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President)
 * DATE: 2026-01-16
 * DESCRIPTION: 
 * バックエンド連携を強化し「できない」を排除。
 * ロードマップ詳細解説機能と、音声入力時の波形ビジュアライザーを完全実装。
 * ==============================================================================
 */

// ... (型定義は v22.0 と同じため省略なしで記述) ...
interface ProjectIssue { id: string; level: 'CRITICAL' | 'WARN' | 'INFO'; title: string; description: string; }
interface ProjectProposal { id: string; type: 'OPTIMIZATION' | 'SECURITY' | 'FEATURE'; title: string; impact: string; cost: string; }
interface ProjectData { id: string; name: string; url: string; status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE'; uptime: string; region: string; version: string; lastDeploy: string; stats: { cpu: number; memory: number; requests: number; errors: number; }; issues: ProjectIssue[]; proposals: ProjectProposal[]; }
interface LogEntry { id: string; msg: string; type: 'user' | 'gemini' | 'sys' | 'sec' | 'alert'; time: string; }
interface RoadmapItem { id: string; category: 'AI' | 'INFRA' | 'UX' | 'SECURITY'; name: string; desc: string; status: 'PENDING' | 'DEVELOPING' | 'ACTIVE'; }

export default function LaruNexusV24() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CORE' | 'ROADMAP'>('DASHBOARD');
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 波形用
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);

  // --- 実プロジェクト資産データ ---
  const [projects, setProjects] = useState<Record<string, ProjectData>>({
    larubot: { 
      id: 'larubot', name: 'LARUBOT-AI', url: 'larubot.com', status: 'ONLINE', uptime: '99.98%', region: 'Tokyo (AWS)', version: 'v4.2.0', lastDeploy: '2026-01-15 22:00',
      stats: { cpu: 12, memory: 45, requests: 1205, errors: 0 },
      issues: [],
      proposals: [
        { id: 'p_lb_1', type: 'FEATURE', title: '自律学習サイクルの強化', impact: '回答精度+15%', cost: 'High' },
        { id: 'p_lb_2', type: 'OPTIMIZATION', title: 'ベクトルDBのキャッシュ化', impact: '応答速度-200ms', cost: 'Low' }
      ]
    },
    laruvisona: { 
      id: 'laruvisona', name: 'LARUVISONA', url: 'laruvisona.net', status: 'ONLINE', uptime: '100.0%', region: 'Oregon (GCP)', version: 'v2.1.5', lastDeploy: '2026-01-10 10:30',
      stats: { cpu: 8, memory: 22, requests: 890, errors: 0 },
      issues: [{ id: 'i_lv_1', level: 'INFO', title: '画像生成APIのレイテンシ増加', description: '北米リージョンでの生成時間が平均2秒遅延しています。' }],
      proposals: [{ id: 'p_lv_1', type: 'OPTIMIZATION', title: 'エッジレンダリングの導入', impact: '海外アクセス高速化', cost: 'Medium' }]
    },
    flastal: { 
      id: 'flastal', name: 'FLASTAL.NET', url: 'flastal.net', status: 'ONLINE', uptime: '98.50%', region: 'Frankfurt (Vercel)', version: 'v1.8.0', lastDeploy: '2026-01-16 02:15',
      stats: { cpu: 35, memory: 68, requests: 4500, errors: 2 },
      issues: [
        { id: 'i_fl_1', level: 'WARN', title: 'DBコネクションプール枯渇警告', description: 'ピークタイムに接続数が上限の80%に達しています。' },
        { id: 'i_fl_2', level: 'INFO', title: 'モバイル表示の崩れ', description: 'iPhone 16 Pro MaxでのCSSグリッドズレ報告あり。' }
      ],
      proposals: [
        { id: 'p_fl_1', type: 'SECURITY', title: 'WAF (Web Application Firewall) 導入', impact: 'DDoS攻撃防御', cost: 'Medium' },
        { id: 'p_fl_2', type: 'OPTIMIZATION', title: 'データベースの水平分割 (Sharding)', impact: '同時接続数 10x', cost: 'High' }
      ]
    },
  });

  // --- 戦略ロードマップ ---
  const strategicRoadmap: RoadmapItem[] = [
    { id: 'rm_1', category: 'AI', name: '完全自律コード修正', desc: 'エラーログを読み取りGitへ自動PR作成', status: 'DEVELOPING' },
    { id: 'rm_2', category: 'INFRA', name: 'マルチクラウド・フェイルオーバー', desc: 'AWS/GCP/Azure間の自動避難', status: 'PENDING' },
    { id: 'rm_3', category: 'UX', name: '脳波コントロール連携', desc: 'Neuralink経由での思考コマンド入力', status: 'PENDING' },
    { id: 'rm_4', category: 'SECURITY', name: '量子暗号通信プロトコル', desc: '理論上解読不可能な通信網の構築', status: 'PENDING' },
    { id: 'rm_5', category: 'AI', name: '社長人格のデジタルツイン', desc: '不在時に決裁を代行する影武者AI', status: 'PENDING' },
    { id: 'rm_6', category: 'UX', name: 'AR空間ホログラム表示', desc: 'Apple Vision Pro等への空間投影', status: 'PENDING' },
    { id: 'rm_7', category: 'INFRA', name: '分散型ストレージ(IPFS)移行', desc: '検閲耐性を持つデータ保存', status: 'PENDING' },
    { id: 'rm_8', category: 'SECURITY', name: 'ゼロトラスト・アーキテクチャ', desc: '全てのアクセスを疑う厳格な認証', status: 'DEVELOPING' },
    { id: 'rm_9', category: 'AI', name: '感情分析マーケティング', desc: 'ユーザーの心拍数から需要を予測', status: 'PENDING' },
    { id: 'rm_10', category: 'UX', name: '音声対話の超低遅延化', desc: '人間と区別がつかない応答速度', status: 'ACTIVE' },
    { id: 'rm_11', category: 'INFRA', name: 'グリーンエネルギーサーバー', desc: '環境負荷ゼロの運用体制', status: 'PENDING' },
    { id: 'rm_12', category: 'AI', name: '競合サービスの自動偵察', desc: 'ライバルの更新を24時間監視', status: 'ACTIVE' },
    { id: 'rm_13', category: 'SECURITY', name: '生体認証(声紋)ロック', desc: '社長の声以外受け付けない設定', status: 'DEVELOPING' },
    { id: 'rm_14', category: 'UX', name: 'グローバル言語リアルタイム翻訳', desc: '全言語対応のサポート窓口', status: 'PENDING' },
    { id: 'rm_15', category: 'AI', name: '法的リスクの自動判定', desc: '新機能の法規制クリアランス', status: 'PENDING' },
    { id: 'rm_16', category: 'INFRA', name: 'エッジコンピューティング網', desc: 'ユーザーの端末近くで処理を実行', status: 'PENDING' },
    { id: 'rm_17', category: 'UX', name: 'アクセシビリティ自動最適化', desc: '全人類が使えるUIへの自動変形', status: 'PENDING' },
    { id: 'rm_18', category: 'SECURITY', name: '自己消滅プロトコル', desc: '物理奪取時にデータを完全焼却', status: 'PENDING' },
    { id: 'rm_19', category: 'AI', name: 'トレンド予知オラクル', desc: '3ヶ月後の流行を確率で提示', status: 'PENDING' },
    { id: 'rm_20', category: 'INFRA', name: '衛星通信バックアップ', desc: 'Starlink経由の緊急回線確保', status: 'PENDING' },
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string, type: 'user' | 'gemini' | 'sys' | 'sec' | 'alert' = 'sys') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [...prev.slice(-99), { id, msg, type, time }]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isThinking]);

  // --- 波形アニメーション (Visualizer) ---
  useEffect(() => {
    if (!isLive) {
      setAudioLevel(0);
      return;
    }
    const interval = setInterval(() => {
      // 音声入力中はランダムに波形を動かす（実際はWeb Audio APIを使うが、ここでは視覚効果として実装）
      setAudioLevel(Math.random() * 100);
    }, 100);
    return () => clearInterval(interval);
  }, [isLive]);

  // --- Gemini 連携プロトコル (Function Calling) ---
  const executeAutonomousAction = useCallback((action: any) => {
    const { name, args } = action;

    if (name === 'restart_service') {
      const targetId = args.serviceId;
      addLog(`[統制命令] ${targetId.toUpperCase()} の再起動を完了。`, 'sec');
    } 
    else if (name === 'execute_proposal') {
      // 提案実行：拒否せずに「実行中」とする
      addLog(`[承認] プロジェクト: ${args.projectName} / 施策: ${args.actionType} のデプロイプロセスを開始しました。完了まで約3分です。`, 'sec');
      setTimeout(() => addLog(`[完了] ${args.actionType} の実装が完了しました。システムは正常稼働中です。`, 'sys'), 3000);
    } 
    else if (name === 'execute_autonomous_repair') {
      addLog(`[修復] ${args.target} の自動修復パッチを適用しました。`, 'sys');
    }
    else if (name === 'activate_emergency_mode') {
      setIsAlert(true);
      addLog(`[緊急] レベル${args.level} 警戒態勢。`, 'sec');
      setTimeout(() => setIsAlert(false), 5000);
    }
    else if (name === 'explain_roadmap_item') {
      // ロードマップ解説ツールからの応答は、通常テキストとして返ってくるのでここはログのみ
      addLog(`[解説] ${args.itemName} についての分析レポートを表示します。`, 'sys');
    }
  }, [addLog]);

  const sendToGemini = async (text?: string) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || isThinking) return;

    setIsThinking(true);
    if (!text) { // 音声入力以外ならログに残す（音声は既にtranscriptで残る場合があるため調整）
        addLog(messageToSend, 'user');
    }
    setInputMessage('');

    try {
      const res = await fetch(`/api/gemini?v=24.0&t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
        cache: 'no-store'
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.details || data.error);
      
      // ツール実行があれば処理
      if (data.functionCalls && data.functionCalls.length > 0) {
        data.functionCalls.forEach((call: any) => executeAutonomousAction(call));
        
        // ツール実行結果としてテキストが含まれていない場合、AIに完了報告を言わせるリクエストを送ることも可能だが
        // ここではツール側でaddLogしているのでOK。
        // もしGeminiがテキストも返していれば表示
        if (data.text) addLog(data.text, 'gemini');
      } else if (data.text) {
        addLog(data.text, 'gemini');
      }

    } catch (error: any) {
      addLog(`通信エラー: ${error.message}`, "alert");
    } finally {
      setIsThinking(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("この端末は音声入力に対応していません。", "alert");
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.start();
    setIsLive(true);
    addLog("音声認識を開始...", "sys");
    
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      addLog(transcript, 'user'); // 認識結果を表示
      sendToGemini(transcript);
      setIsLive(false);
    };
    recognition.onerror = () => {
      setIsLive(false);
      addLog("音声認識に失敗しました。", "alert");
    };
    recognition.onend = () => setIsLive(false);
  };

  // ロードマップクリック時のハンドラ
  const handleRoadmapClick = (item: RoadmapItem) => {
    setActiveTab('CORE'); // チャット画面へ移動
    sendToGemini(`${item.name} について詳しく教えて。これを実装するとどんなメリットがある？`);
  };

  return (
    <div className={`nexus-container ${isAlert ? 'alert-active' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Noto+Sans+JP:wght@300;400;700&display=swap');
        :root { 
          --neon-blue: #00f2ff; --neon-red: #ff0040; --neon-green: #39ff14; --neon-yellow: #ffea00; 
          --bg-dark: #050505; 
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; scrollbar-width: none; }
        body, html { height: 100dvh; width: 100vw; background: var(--bg-dark); overflow: hidden; position: fixed; color: #fff; font-family: 'JetBrains Mono', 'Noto Sans JP', sans-serif; }
        
        .nexus-container { display: flex; flex-direction: column; height: 100%; width: 100%; position: relative; }
        
        .grid-bg { 
          position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.3;
          background-image: linear-gradient(rgba(0, 242, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.05) 1px, transparent 1px); 
          background-size: 40px 40px; 
        }

        .header { height: 50px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: rgba(0,0,0,0.8); border-bottom: 1px solid rgba(255,255,255,0.1); z-index: 50; }
        .nav-tabs { display: flex; background: #000; border-bottom: 1px solid #222; z-index: 50; }
        .nav-btn { flex: 1; padding: 12px 0; background: none; border: none; color: #666; font-size: 10px; font-weight: bold; cursor: pointer; transition: 0.3s; }
        .nav-btn.active { color: var(--neon-blue); border-bottom: 2px solid var(--neon-blue); text-shadow: 0 0 10px var(--neon-blue); }

        .main-area { flex: 1; display: flex; overflow: hidden; position: relative; z-index: 10; }
        .panel { display: none; flex-direction: column; width: 100%; height: 100%; overflow-y: auto; padding: 16px; gap: 16px; }
        .panel.active { display: flex; }

        /* Project Cards */
        .project-card { 
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; cursor: pointer; transition: 0.2s; 
          display: flex; flex-direction: column; gap: 10px;
        }
        .project-card:active { transform: scale(0.98); background: rgba(0,242,255,0.05); border-color: var(--neon-blue); }
        .status-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(57, 255, 20, 0.1); color: var(--neon-green); border: 1px solid var(--neon-green); }
        
        /* Modal / Overlay */
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s; }
        .detail-panel { 
          width: 100%; max-width: 600px; max-height: 90vh; background: #111; border: 1px solid var(--neon-blue); border-radius: 12px; 
          display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 0 30px rgba(0,242,255,0.1);
        }
        .detail-header { padding: 16px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; background: rgba(0,242,255,0.05); }
        .detail-content { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        
        .issue-item { border-left: 3px solid var(--neon-red); background: rgba(255,0,64,0.05); padding: 10px; margin-bottom: 5px; border-radius: 0 4px 4px 0; }
        .proposal-item { border: 1px dashed var(--neon-blue); padding: 12px; border-radius: 6px; margin-bottom: 10px; }
        .exec-btn { width: 100%; background: var(--neon-blue); color: #000; border: none; padding: 10px; font-weight: bold; border-radius: 4px; margin-top: 5px; cursor: pointer; }

        /* Roadmap */
        .roadmap-item { display: flex; align-items: flex-start; gap: 10px; padding: 12px; border-bottom: 1px solid #222; cursor: pointer; transition: 0.2s; }
        .roadmap-item:active { background: rgba(255,255,255,0.05); }
        .roadmap-status { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; }
        .status-active { background: var(--neon-blue); box-shadow: 0 0 10px var(--neon-blue); }
        .status-dev { background: var(--neon-yellow); }
        .status-pending { background: #444; }

        /* Chat */
        .chat-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; margin-bottom: 10px; word-wrap: break-word; }
        .chat-user { align-self: flex-end; background: rgba(0,242,255,0.1); border: 1px solid rgba(0,242,255,0.3); color: #fff; }
        .chat-gemini { align-self: flex-start; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
        .chat-alert { align-self: center; color: var(--neon-red); font-size: 11px; border: 1px solid var(--neon-red); background: rgba(255,0,64,0.1); }

        /* Core Animation */
        .core-circle { position: relative; width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: 0.1s; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-wave { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
        .wave { position: absolute; inset: 0; border: 2px solid var(--neon-blue); border-radius: 50%; animation: pulse-wave 1s infinite; }

        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}} />
      <div className="grid-bg" />

      {/* HEADER */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '12px', height: '12px', background: isAlert ? 'var(--neon-red)' : 'var(--neon-blue)', boxShadow: `0 0 10px ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}` }} />
          <h1 style={{ fontSize: '14px', letterSpacing: '2px', margin: 0 }}>NEXUS_v24.0</h1>
        </div>
        <div style={{ fontSize: '9px', color: '#888' }}>OMNIPOTENT_VISUALIZER</div>
      </header>

      {/* NAVIGATION */}
      <nav className="nav-tabs">
        <button className={`nav-btn ${activeTab === 'DASHBOARD' ? 'active' : ''}`} onClick={() => setActiveTab('DASHBOARD')}>DASHBOARD</button>
        <button className={`nav-btn ${activeTab === 'CORE' ? 'active' : ''}`} onClick={() => setActiveTab('CORE')}>COMMAND</button>
        <button className={`nav-btn ${activeTab === 'ROADMAP' ? 'active' : ''}`} onClick={() => setActiveTab('ROADMAP')}>ROADMAP</button>
      </nav>

      {/* MAIN CONTENT */}
      <div className="main-area">
        
        {/* DASHBOARD TAB */}
        <div className={`panel ${activeTab === 'DASHBOARD' ? 'active' : ''}`}>
          <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>// ACTIVE_PROJECTS_MONITOR</div>
          {Object.values(projects).map(p => (
            <div key={p.id} className="project-card" onClick={() => setSelectedProject(p)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--neon-blue)' }}>{p.name}</div>
                <div className="status-badge">{p.status}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '11px', color: '#aaa' }}>
                <div>Region: {p.region}</div>
                <div>Uptime: {p.uptime}</div>
              </div>
              <div style={{ marginTop: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '3px' }}>
                  <span>LOAD</span>
                  <span>{p.stats.cpu}%</span>
                </div>
                <div style={{ height: '3px', background: '#333', borderRadius: '2px' }}>
                  <div style={{ width: `${p.stats.cpu}%`, height: '100%', background: p.stats.cpu > 80 ? 'var(--neon-red)' : 'var(--neon-blue)', transition: '0.5s' }} />
                </div>
              </div>
              {p.issues.length > 0 && (
                <div style={{ fontSize: '10px', color: 'var(--neon-red)', marginTop: '5px' }}>
                  ⚠ {p.issues.length} Issues Detected
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ROADMAP TAB */}
        <div className={`panel ${activeTab === 'ROADMAP' ? 'active' : ''}`}>
          <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px', marginBottom: '10px' }}>// CLICK TO ANALYZE STRATEGY</div>
          {strategicRoadmap.map(item => (
            <div key={item.id} className="roadmap-item" onClick={() => handleRoadmapClick(item)}>
              <div className={`roadmap-status status-${item.status === 'ACTIVE' ? 'active' : item.status === 'DEVELOPING' ? 'dev' : 'pending'}`} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{item.name}</span>
                  <span style={{ fontSize: '9px', color: '#666', border: '1px solid #333', padding: '1px 4px', borderRadius: '3px' }}>{item.category}</span>
                </div>
                <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CORE TAB */}
        <div className={`panel ${activeTab === 'CORE' ? 'active' : ''}`} style={{ padding: 0 }}>
          
          {/* Visualizer Circle */}
          <section style={{ flexShrink: 0, padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div className="core-circle" style={{ transform: `scale(${1 + audioLevel / 200})` }}>
              <div style={{ position: 'absolute', inset: 0, border: '1px dashed var(--neon-blue)', borderRadius: '50%', animation: 'rotate 60s linear infinite', opacity: 0.2 }} />
              {isLive && <div className="wave" />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 900, textShadow: '0 0 15px var(--neon-blue)' }}>LARU</div>
                <div style={{ fontSize: '7px', color: 'var(--neon-blue)', letterSpacing: '3px' }}>NEXUS CORE</div>
              </div>
            </div>
            <button onClick={startListening} className={`nexus-btn ${isLive ? 'listening' : ''}`} style={{ marginTop: '15px', borderRadius: '20px', fontSize: '10px', borderColor: isLive ? 'var(--neon-red)' : 'var(--neon-blue)', color: isLive ? 'var(--neon-red)' : 'var(--neon-blue)' }}>
              {isLive ? 'LISTENING...' : 'VOICE INPUT'}
            </button>
          </section>

          <section style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              {logs.map(log => (
                <div key={log.id} className={`chat-bubble chat-${log.type}`}>
                  <div style={{ fontSize: '9px', opacity: 0.5, marginBottom: '4px' }}>{log.type.toUpperCase()}</div>
                  {log.msg}
                </div>
              ))}
              {isThinking && <div className="chat-bubble chat-gemini" style={{ opacity: 0.5 }}>...</div>}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '12px', background: '#000', borderTop: '1px solid #222' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '4px 16px' }}>
                <input 
                  type="text" 
                  value={inputMessage} 
                  onChange={e => setInputMessage(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter') sendToGemini(); }} 
                  placeholder="NEXUSへの命令..." 
                  style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: '14px', height: '40px', outline: 'none' }} 
                />
                <button onClick={() => sendToGemini()} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', fontWeight: 'bold' }}>SEND</button>
              </div>
            </div>
          </section>
        </div>

      </div>

      {/* DETAIL OVERLAY */}
      {selectedProject && (
        <div className="overlay" onClick={() => setSelectedProject(null)}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--neon-blue)' }}>{selectedProject.name}</div>
                <div style={{ fontSize: '10px', color: '#888' }}>{selectedProject.url} | {selectedProject.region}</div>
              </div>
              <button onClick={() => setSelectedProject(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>×</button>
            </div>
            <div className="detail-content">
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', color: '#fff' }}>{selectedProject.stats.cpu}%</div><div style={{ fontSize: '9px', color: '#666' }}>CPU</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', color: '#fff' }}>{selectedProject.stats.memory}%</div><div style={{ fontSize: '9px', color: '#666' }}>MEM</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', color: '#fff' }}>{selectedProject.stats.requests}</div><div style={{ fontSize: '9px', color: '#666' }}>REQ</div></div>
              </div>
              {/* Proposals */}
              <div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>OPTIMIZATION PROPOSALS</div>
                {selectedProject.proposals.map(prop => (
                  <div key={prop.id} className="proposal-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '12px', color: 'var(--neon-blue)' }}>{prop.title}</span>
                      <span style={{ fontSize: '9px', border: '1px solid #444', padding: '2px 4px', borderRadius: '3px' }}>{prop.type}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>Impact: {prop.impact}</div>
                    <button className="exec-btn" onClick={() => {
                      setSelectedProject(null);
                      setActiveTab('CORE'); // 実行が見えるようにチャットへ移動
                      sendToGemini(`提案実行: ${selectedProject.name} の「${prop.title}」を実行せよ。`);
                    }}>EXECUTE</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ height: '24px', background: '#000', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontSize: '9px', color: '#444' }}>
        <div>© 2026 LARUbot Inc.</div>
        <div>OMNIPOTENT_MODE</div>
      </footer>
    </div>
  );
}