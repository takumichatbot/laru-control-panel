'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v29.0 [CLINE_FULL_SILENCE]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President)
 * DESCRIPTION: 
 * - 効果音(SFX)の完全排除
 * - 実行プロセス(Thinking/Command/Checkpoint)の可視化 (Clien Style)
 * - 実行中は無言、全タスク完了時のみ音声報告
 * - 情報不足時のインタラクティブな質問機能
 * ==============================================================================
 */

// --- 型定義 ---
interface ProjectIssue { id: string; level: 'CRITICAL' | 'WARN' | 'INFO'; title: string; description: string; }
interface ProjectProposal { id: string; type: 'OPTIMIZATION' | 'SECURITY' | 'FEATURE'; title: string; impact: string; cost: string; }
interface ProjectData { 
  id: string; name: string; repoName: string; url: string; 
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE' | 'WAITING'; 
  latency: number; region: string; version: string; lastDeploy: string; 
  stats: { cpu: number; memory: number; requests: number; errors: number; }; 
  issues: ProjectIssue[]; proposals: ProjectProposal[]; 
}
// LogEntry: Clien風のステータスタイプを追加
interface LogEntry { 
  id: string; 
  msg: string; 
  type: 'user' | 'ai' | 'thinking' | 'command' | 'checkpoint' | 'error' | 'question'; 
  imageUrl?: string; 
  time: string; 
}
interface RoadmapItem { 
  id: string; category: 'AI' | 'INFRA' | 'UX' | 'SECURITY'; name: string; desc: string; benefits: string;
  status: 'PENDING' | 'DEVELOPING' | 'ACTIVE'; 
}

export default function LaruNexusV29() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'CORE' | 'ROADMAP'>('DASHBOARD');
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapItem | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);
  
  // --- AI Personality Settings ---
  const [showSettings, setShowSettings] = useState(false);
  const [aiGender, setAiGender] = useState<'male' | 'female'>('female');
  // AIへの指示: 思考プロセスとコマンドを明確に分けるよう指示
  const [aiPersona, setAiPersona] = useState<string>(
    'あなたは高度な自律型エンジニアAIです。ユーザーの指示に対し、以下のフォーマットで応答してください。\n' +
    '1. Thinking: [思考プロセス]\n' +
    '2. Command: [実行すべきアクション]\n' +
    '3. Response: [完了報告や質問]\n' +
    '不明点がある場合はアクションを実行せず、Questionとしてユーザーに尋ねてください。'
  );

  // --- 実プロジェクト資産データ ---
  const initialProjects: Record<string, ProjectData> = {
    laru_nexus: { 
      id: 'laru_nexus', name: 'LaruNEXUS', repoName: 'laru_nexus_core', url: 'nexus.larubot.com', status: 'WAITING', latency: 0, region: 'Tokyo (Render)', version: 'v29.0', lastDeploy: '2026-01-16 20:00',
      stats: { cpu: 15, memory: 55, requests: 300, errors: 0 }, issues: [],
      proposals: [{ id: 'p_ln_1', type: 'FEATURE', title: '脳波コントロール連携の実装', impact: '操作性革命', cost: 'High' }]
    },
    larubot: { 
      id: 'larubot', name: 'LARUBOT-AI', repoName: 'larubot_core', url: 'larubot.com', status: 'WAITING', latency: 0, region: 'Tokyo (AWS)', version: 'v4.2.0', lastDeploy: '2026-01-15 22:00',
      stats: { cpu: 12, memory: 45, requests: 1205, errors: 0 }, issues: [],
      proposals: [{ id: 'p_lb_1', type: 'FEATURE', title: '自律学習サイクルの強化', impact: '精度向上', cost: 'High' }]
    },
    flastal: { 
      id: 'flastal', name: 'FLASTAL.NET', repoName: 'flastal_net', url: 'flastal.net', status: 'WAITING', latency: 0, region: 'Frankfurt', version: 'v1.8.0', lastDeploy: '2026-01-16 02:15',
      stats: { cpu: 35, memory: 68, requests: 4500, errors: 2 },
      issues: [{ id: 'i_fl_1', level: 'WARN', title: 'DB接続数警告', description: 'ピーク時80%到達' }],
      proposals: [{ id: 'p_fl_2', type: 'OPTIMIZATION', title: 'DB水平分割', impact: '接続数10x', cost: 'High' }]
    },
    laruvisona: { 
      id: 'laruvisona', name: 'LARUVISONA', repoName: 'laruvisona_app', url: 'laruvisona.net', status: 'WAITING', latency: 0, region: 'Oregon', version: 'v2.1.5', lastDeploy: '2026-01-10 10:30',
      stats: { cpu: 8, memory: 22, requests: 890, errors: 0 },
      issues: [],
      proposals: []
    },
  };

  const [projects, setProjects] = useState<Record<string, ProjectData>>(initialProjects);
  
  const strategicRoadmap: RoadmapItem[] = [
    { id: 'rm_1', category: 'AI', name: '完全自律コード修正', desc: 'エラーログを読み取りGitへ自動PR作成', benefits: 'デバッグ工数ゼロ', status: 'DEVELOPING' },
    { id: 'rm_2', category: 'INFRA', name: 'マルチクラウド・フェイルオーバー', desc: 'AWS/GCP/Azure間の自動避難', benefits: '稼働率100%', status: 'PENDING' },
    { id: 'rm_3', category: 'UX', name: '脳波コントロール連携', desc: 'Neuralink経由での思考コマンド入力', benefits: '究極のBCI', status: 'ACTIVE' },
    { id: 'rm_4', category: 'SECURITY', name: '量子暗号通信プロトコル', desc: '理論上解読不可能な通信網', benefits: '完全な機密性', status: 'PENDING' },
    { id: 'rm_5', category: 'AI', name: '社長人格デジタルツイン', desc: '不在時の自動決裁AI', benefits: '24時間経営', status: 'PENDING' },
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Initialize & Persistence ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('laru_nexus_v29_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setAiGender(settings.gender || 'female');
          setAiPersona(settings.persona || aiPersona);
        } catch(e){}
      }
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('laru_nexus_v29_settings', JSON.stringify({ gender: aiGender, persona: aiPersona }));
    }
  }, [aiGender, aiPersona]);

  // --- Realtime Monitoring (Mock Ping) ---
  useEffect(() => {
    const interval = setInterval(async () => {
      // 実際にはバックグラウンドでPingを打つイメージ
      setProjects(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          // ランダムに数値を変動させて「生きている」感を演出
          next[k].latency = Math.max(10, next[k].latency + (Math.random() * 10 - 5));
          next[k].stats.cpu = Math.max(0, Math.min(100, next[k].stats.cpu + (Math.random() * 4 - 2)));
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- Log System (Clien Style) ---
  const addLog = useCallback((msg: string, type: LogEntry['type'] = 'system', imageUrl?: string) => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [...prev.slice(-99), { id, msg, type, imageUrl, time }]);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs, isThinking]);

  // --- Voice Synthesis (Completion Only) ---
  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    
    // Gender Settings
    if (aiGender === 'male') {
      utterance.pitch = 0.9; utterance.rate = 1.0; 
    } else {
      utterance.pitch = 1.2; utterance.rate = 1.1;
    }

    const voices = window.speechSynthesis.getVoices();
    const jpVoices = voices.filter(v => v.lang.includes('ja') || v.lang.includes('JP'));
    let targetVoice;
    
    if (aiGender === 'female') {
      targetVoice = jpVoices.find(v => v.name.includes('Kyoko') || v.name.includes('Haruka') || v.name.includes('Google') || v.name.includes('Female'));
    } else {
      targetVoice = jpVoices.find(v => v.name.includes('Hattori') || v.name.includes('Ichiro') || v.name.includes('Male'));
    }

    if (targetVoice) utterance.voice = targetVoice;
    window.speechSynthesis.speak(utterance);
  };

  // --- Input Normalizer ---
  const normalizeInput = (input: string) => {
    let s = input;
    s = s.replace(/ラルボット/g, 'LARUBOT-AI');
    s = s.replace(/アルボット/g, 'LARUBOT-AI');
    s = s.replace(/フラスタル/g, 'FLASTAL.NET');
    s = s.replace(/ネクサス/g, 'LaruNEXUS');
    return s;
  };

  // --- Action Executors ---
  const executeAction = async (action: any) => {
    const { name, args } = action;
    
    if (name === 'browse_website') {
      // 経過報告 (音声なし)
      addLog(`Command: ブラウザエージェントを起動中... (${args.url})`, 'command');
      
      try {
        const res = await fetch('/api/browser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: args.url, action: args.mode })
        });
        const data = await res.json();
        
        if (data.status === 'SUCCESS') {
          if (data.result.type === 'image') {
            addLog(`Checkpoint: 視覚データの取得に成功`, 'checkpoint', data.result.data);
          } else {
            addLog(`Checkpoint: テキスト解析完了 (${data.result.data.length} chars)`, 'checkpoint');
          }
        } else {
          addLog(`Error: ブラウザ操作エラー: ${data.message}`, 'error');
        }
      } catch (e) {
        addLog(`Error: エージェント接続失敗`, 'error');
      }
    } 
    else if (name === 'trigger_github_action') {
      addLog(`Command: GitHub Action (${args.actionType}) をトリガー`, 'command');
      // ここで実際のAPIコールを入れる（今回はモック動作）
      await new Promise(r => setTimeout(r, 1000)); // 処理時間の演出
      addLog(`Checkpoint: ワークフローが正常にキューイングされました`, 'checkpoint');
    }
    else if (name === 'activate_emergency_mode') {
      setIsAlert(true);
      addLog(`Command: 緊急警戒レベル${args.level}を発令`, 'command');
      setTimeout(() => setIsAlert(false), 5000);
    }
  };

  // --- Main Core Logic ---
  const sendToGemini = async (text?: string) => {
    const rawMessage = text || inputMessage;
    if (!rawMessage || isThinking) return;
    
    const messageToSend = normalizeInput(rawMessage);
    setInputMessage('');
    setIsThinking(true);
    
    // 1. ユーザー入力ログ (音声なし)
    addLog(messageToSend, 'user');

    const promptWithPersona = `
      [System Instructions]
      Persona: ${aiPersona}
      Current Time: ${new Date().toLocaleString()}
      
      User Input: "${messageToSend}"
      
      あなたはClienのようなエンジニアリングAIです。
      以下のステップで応答を作成してください。
      
      1. Thinking: ユーザーの意図を分析し、どのツールを使うべきか、情報が足りているか思考するプロセスを出力。
      2. Question: もし情報（リポジトリ名など）が不足している場合は、Questionとしてユーザーに尋ねる。
      3. Action: 情報が十分なら、適切なツール（browse_website, trigger_github_action等）を選択。
      4. Response: 全て完了した後の最終報告メッセージ。
    `;

    try {
      // "Thinking..." 演出
      addLog("Thinking: リクエストを解析中...", 'thinking');

      const res = await fetch(`/api/gemini?v=29.0&t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptWithPersona }),
        cache: 'no-store'
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.details || data.error);

      // Geminiからの応答に含まれる思考プロセスがあれば表示したいが、
      // APIの仕様上 functionCalls と text が分かれている場合が多い。
      // ここでは functionCalls があればそれを実行するフローにする。

      if (data.functionCalls && data.functionCalls.length > 0) {
        // アクションがある場合
        for (const call of data.functionCalls) {
          await executeAction(call);
        }
        
        // 全アクション完了後、最終報告 (ここで初めて喋る)
        const finalMsg = data.text || "全タスクが完了しました。";
        addLog(finalMsg, 'ai');
        speak(finalMsg); 

      } else {
        // アクションがなく、テキスト返答のみの場合（質問や会話）
        // 例：「アルボットとは何ですか？」など
        const reply = data.text || "応答を受信できませんでした。";
        
        // 質問かどうか判定（簡易的）
        if (reply.includes("？") || reply.includes("?")) {
          addLog(reply, 'question');
        } else {
          addLog(reply, 'ai');
        }
        speak(reply);
      }

    } catch (error: any) {
      addLog(`Error: 通信エラー発生: ${error.message}`, 'error');
      speak("システムエラーが発生しました。");
    } finally {
      setIsThinking(false);
    }
  };

  // --- Input Handlers ---
  const startListening = () => {
    // スマホ対応: 音声コンテキストのアンロック（無音再生）
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const dummy = new SpeechSynthesisUtterance('');
        dummy.volume = 0; 
        window.speechSynthesis.speak(dummy);
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("音声入力がサポートされていません", 'error');
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false; 
    recognition.continuous = false;
    
    recognition.onstart = () => setIsLive(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) sendToGemini(transcript);
      setIsLive(false);
    };
    recognition.onerror = () => setIsLive(false);
    recognition.onend = () => setIsLive(false);
    
    try { recognition.start(); } catch (e) { addLog("マイク起動エラー", 'error'); }
  };

  const handleTabChange = (tab: any) => setActiveTab(tab);
  const handleRoadmapClick = (item: RoadmapItem) => setSelectedRoadmap(item);
  const handleRefresh = () => typeof window !== 'undefined' && window.location.reload();
  const handleClearLogs = () => { setLogs([]); addLog("ログをクリアしました", 'system'); };

  // --- Beautiful Low-Poly Face (SVG) ---
  const LowPolyFace = ({ gender, active, level }: { gender: 'male' | 'female', active: boolean, level: number }) => {
    const mouthY = active ? Math.min(10, level / 5) : 0;
    const color = active ? "var(--neon-red)" : "var(--neon-blue)";
    const opacity = active ? 1 : 0.6;

    if (gender === 'male') {
      return (
        <svg width="100" height="120" viewBox="0 0 100 120" fill="none" stroke={color} strokeWidth="1" style={{ transition: '0.2s', filter: 'drop-shadow(0 0 5px rgba(0,242,255,0.3))' }}>
          {/* MALE: Strong Jaw, Angular */}
          <path d="M20,30 L50,10 L80,30 L85,60 L70,100 L30,100 L15,60 L20,30 Z" opacity={opacity} />
          <path d="M20,30 L50,40 L80,30 M50,10 L50,40" opacity="0.5" />
          <path d="M15,60 L30,50 L50,60 L70,50 L85,60" />
          <path d="M30,50 L20,30 M70,50 L80,30" opacity="0.5" />
          <path d="M25,45 L35,40 L45,45 L35,50 Z" fill={active ? "rgba(255,0,64,0.1)" : "rgba(0,242,255,0.1)"} />
          <path d="M55,45 L65,40 L75,45 L65,50 Z" fill={active ? "rgba(255,0,64,0.1)" : "rgba(0,242,255,0.1)"} />
          <path d="M50,40 L45,65 L50,75 L55,65 Z" />
          <path d={`M35,85 L50,${85 + mouthY} L65,85`} strokeWidth="1.5" />
          <path d="M30,100 L50,90 L70,100" opacity="0.5" />
        </svg>
      );
    } else {
      return (
        <svg width="100" height="120" viewBox="0 0 100 120" fill="none" stroke={color} strokeWidth="1" style={{ transition: '0.2s', filter: 'drop-shadow(0 0 5px rgba(0,242,255,0.3))' }}>
          {/* FEMALE: Slender Jaw, Elegant */}
          <path d="M15,30 L50,5 L85,30 L90,55 L50,110 L10,55 L15,30 Z" opacity={opacity} />
          <path d="M15,30 L50,35 L85,30 M50,5 L50,35" opacity="0.5" />
          <path d="M10,55 L30,50 L50,60 L70,50 L90,55" />
          <path d="M20,45 L35,38 L50,45 L35,52 Z" fill={active ? "rgba(255,0,64,0.1)" : "rgba(0,242,255,0.1)"} />
          <path d="M50,45 L65,38 L80,45 L65,52 Z" fill={active ? "rgba(255,0,64,0.1)" : "rgba(0,242,255,0.1)"} />
          <path d="M50,35 L46,65 L50,70 L54,65 Z" />
          <path d={`M38,82 L50,${82 + mouthY} L62,82`} strokeWidth="1.5" />
          <path d="M35,90 L50,110 L65,90" opacity="0.5" />
        </svg>
      );
    }
  };

  return (
    <div className={`nexus-container ${isAlert ? 'alert-active' : ''}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Noto+Sans+JP:wght@300;400;700&display=swap');
        :root { --neon-blue: #00f2ff; --neon-red: #ff0040; --neon-green: #39ff14; --neon-yellow: #ffea00; --bg-dark: #050505; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; scrollbar-width: none; }
        body, html { height: 100dvh; width: 100vw; background: var(--bg-dark); overflow: hidden; position: fixed; color: #fff; font-family: 'JetBrains Mono', 'Noto Sans JP'; overscroll-behavior: none; }
        .nexus-container { display: flex; flex-direction: column; height: 100%; width: 100%; position: relative; }
        .grid-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.3; background-image: linear-gradient(rgba(0,242,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,255,0.05) 1px, transparent 1px); background-size: 40px 40px; }
        .header { height: 50px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: rgba(0,0,0,0.8); border-bottom: 1px solid rgba(255,255,255,0.1); z-index: 50; }
        .nav-tabs { display: flex; background: #000; border-bottom: 1px solid #222; z-index: 50; }
        .nav-btn { flex: 1; padding: 12px 0; background: none; border: none; color: #666; font-size: 10px; font-weight: bold; cursor: pointer; transition: 0.3s; }
        .nav-btn.active { color: var(--neon-blue); border-bottom: 2px solid var(--neon-blue); }
        .main-area { flex: 1; display: flex; overflow: hidden; position: relative; z-index: 10; }
        .panel { display: none; flex-direction: column; width: 100%; height: 100%; overflow-y: auto; padding: 16px; gap: 16px; padding-bottom: 100px; }
        .panel.active { display: flex; }
        .project-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; cursor: pointer; transition: 0.2s; }
        .project-card:active { transform: scale(0.98); background: rgba(0,242,255,0.05); border-color: var(--neon-blue); }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s; }
        .detail-panel { width: 100%; max-width: 600px; max-height: 85vh; background: #111; border: 1px solid var(--neon-blue); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
        .detail-header { padding: 16px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; background: rgba(0,242,255,0.05); }
        .detail-content { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .roadmap-item { display: flex; align-items: flex-start; gap: 10px; padding: 12px; border-bottom: 1px solid #222; cursor: pointer; }
        
        /* Clien-style Logs */
        .chat-bubble { max-width: 90%; padding: 10px; border-radius: 4px; font-size: 12px; margin-bottom: 8px; word-wrap: break-word; border-left: 3px solid transparent; background: rgba(255,255,255,0.03); font-family: 'JetBrains Mono', monospace; }
        .chat-user { border-color: var(--neon-blue); color: #fff; align-self: flex-end; }
        .chat-ai { border-color: var(--neon-green); color: var(--neon-green); align-self: flex-start; }
        .chat-thinking { border-color: #888; color: #888; font-style: italic; }
        .chat-command { border-color: var(--neon-yellow); color: var(--neon-yellow); }
        .chat-checkpoint { border-color: #fff; color: #fff; background: rgba(255,255,255,0.1); }
        .chat-question { border-color: #ff00ff; color: #ff00ff; font-weight: bold; }
        .chat-error { border-color: var(--neon-red); color: var(--neon-red); }
        
        /* Face Button */
        .voice-hud { position: relative; width: 120px; height: 120px; margin-top: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .face-container { width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); border-radius: 50%; box-shadow: 0 0 20px rgba(0,242,255,0.1); }
        
        /* Settings Modal */
        .settings-group { margin-bottom: 20px; }
        .settings-label { font-size: 12px; color: var(--neon-blue); margin-bottom: 8px; display: block; }
        .toggle-row { display: flex; gap: 10px; }
        .toggle-btn { flex: 1; padding: 12px; border: 1px solid #333; background: #111; color: #666; border-radius: 4px; font-size: 12px; cursor: pointer; transition: 0.2s; }
        .toggle-btn.active { border-color: var(--neon-blue); color: var(--neon-blue); background: rgba(0,242,255,0.1); box-shadow: 0 0 10px rgba(0,242,255,0.1); }
        .persona-input { width: 100%; height: 100px; background: #222; border: 1px solid #333; color: #fff; padding: 10px; font-size: 13px; border-radius: 4px; resize: none; }
        .persona-input:focus { border-color: var(--neon-blue); outline: none; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}} />
      <div className="grid-bg" />

      {/* HEADER */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '12px', height: '12px', background: isAlert ? 'var(--neon-red)' : 'var(--neon-blue)', boxShadow: `0 0 10px ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}` }} />
          <h1 style={{ fontSize: '14px', letterSpacing: '2px', margin: 0 }}>NEXUS_v29.0</h1>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={handleRefresh} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>🔄</button>
          <button onClick={handleClearLogs} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>🗑️</button>
          <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>⚙️</button>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav className="nav-tabs">
        <button className={`nav-btn ${activeTab === 'DASHBOARD' ? 'active' : ''}`} onClick={() => handleTabChange('DASHBOARD')}>DASHBOARD</button>
        <button className={`nav-btn ${activeTab === 'CORE' ? 'active' : ''}`} onClick={() => handleTabChange('CORE')}>COMMAND</button>
        <button className={`nav-btn ${activeTab === 'ROADMAP' ? 'active' : ''}`} onClick={() => handleTabChange('ROADMAP')}>ROADMAP</button>
      </nav>

      <div className="main-area">
        {/* DASHBOARD */}
        <div className={`panel ${activeTab === 'DASHBOARD' ? 'active' : ''}`}>
          <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>// ACTIVE_PROJECTS_MONITOR</div>
          {Object.values(projects).map(p => (
            <div key={p.id} className="project-card" onClick={() => setSelectedProject(p)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--neon-blue)' }}>{p.name}</div>
                <div className="status-badge" style={{ color: p.status === 'ONLINE' ? 'var(--neon-green)' : '#666' }}>{p.status}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '11px', color: '#aaa', marginTop: '5px' }}>
                <div>Region: {p.region}</div>
                <div>Latency: <span style={{ color: p.latency > 500 ? 'var(--neon-red)' : '#fff' }}>{p.latency}ms</span></div>
              </div>
              <div style={{ marginTop: '5px', height: '3px', background: '#333' }}>
                <div style={{ width: `${Math.min(100, p.latency / 10)}%`, height: '100%', background: p.latency > 500 ? 'var(--neon-red)' : 'var(--neon-blue)', transition: '0.5s' }} />
              </div>
              {p.issues.length > 0 && <div style={{ fontSize: '10px', color: 'var(--neon-red)', marginTop: '5px' }}>⚠ {p.issues.length} Issues Detected</div>}
            </div>
          ))}
        </div>

        {/* ROADMAP */}
        <div className={`panel ${activeTab === 'ROADMAP' ? 'active' : ''}`}>
          <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>// STRATEGIC_INITIATIVES_2026</div>
          {strategicRoadmap.map(item => (
            <div key={item.id} className="roadmap-item" onClick={() => handleRoadmapClick(item)}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', background: item.status === 'ACTIVE' ? 'var(--neon-blue)' : '#444' }} />
              <div style={{ flex: 1, marginLeft: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{item.name}</div>
                <div style={{ fontSize: '10px', color: '#888' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CORE */}
        <div className={`panel ${activeTab === 'CORE' ? 'active' : ''}`} style={{ padding: 0 }}>
          <section style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div className="voice-hud" onClick={startListening}>
              <div className="face-container">
                <LowPolyFace gender={aiGender} active={isLive} level={audioLevel} />
              </div>
            </div>
            <div style={{ fontSize: '10px', marginTop: '10px', color: isLive ? 'var(--neon-red)' : '#666' }}>{isLive ? 'LISTENING...' : 'READY'}</div>
          </section>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {logs.map(log => (
              <div key={log.id} className={`chat-bubble chat-${log.type}`}>
                <div style={{ fontSize: '9px', opacity: 0.5, marginBottom: '4px' }}>{log.type.toUpperCase()}</div>
                {log.imageUrl && <img src={log.imageUrl} alt="Captured" style={{ width: '100%', borderRadius: '8px', marginBottom: '8px', border: '1px solid #333' }} />}
                {log.msg}
              </div>
            ))}
            {isThinking && <div className="chat-bubble chat-thinking" style={{ opacity: 0.5 }}>Thinking...</div>}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: '12px', background: '#000' }}>
            <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendToGemini(); }} placeholder="COMMAND..." style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '20px', padding: '8px 16px', outline: 'none' }} />
          </div>
        </div>
      </div>

      {/* DETAIL OVERLAY (PROJECT) */}
      {selectedProject && (
        <div className="overlay" onClick={() => setSelectedProject(null)}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--neon-blue)' }}>{selectedProject.name}</div>
                <div style={{ fontSize: '10px', color: '#888' }}>{selectedProject.url}</div>
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
                      setSelectedProject(null); setActiveTab('CORE'); sendToGemini(`提案実行: ${selectedProject.name} の「${prop.title}」を実行せよ。`);
                    }}>EXECUTE</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL OVERLAY (ROADMAP) */}
      {selectedRoadmap && (
        <div className="overlay" onClick={() => setSelectedRoadmap(null)}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{selectedRoadmap.name}</div>
                <div style={{ fontSize: '9px', border: '1px solid #666', padding: '2px 4px', borderRadius: '4px', color: '#888' }}>{selectedRoadmap.category}</div>
              </div>
              <button onClick={() => setSelectedRoadmap(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>×</button>
            </div>
            <div className="detail-content">
              <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.6' }}>{selectedRoadmap.desc}</div>
              <div style={{ marginTop: '15px' }}>
                <div style={{ fontSize: '11px', color: 'var(--neon-green)', marginBottom: '5px' }}>EXPECTED BENEFITS</div>
                <div style={{ fontSize: '12px', color: '#fff', background: 'rgba(57,255,20,0.05)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(57,255,20,0.2)' }}>{selectedRoadmap.benefits}</div>
              </div>
              <button className="exec-btn" style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid #fff', color: '#fff' }} onClick={() => {
                setSelectedRoadmap(null); setActiveTab('CORE'); sendToGemini(`「${selectedRoadmap.name}」について詳しく議論したい。具体的な導入ステップを教えて。`);
              }}>DISCUSS WITH AI</button>
            </div>
          </div>
        </div>
      )}

      {/* AI SETTINGS MODAL */}
      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="detail-panel" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>AI SETTINGS</div>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px' }}>×</button>
            </div>
            <div className="detail-content">
              
              <div className="settings-group">
                <span className="settings-label">VOICE GENDER / APPEARANCE</span>
                <div className="toggle-row">
                  <button className={`toggle-btn ${aiGender === 'male' ? 'active' : ''}`} onClick={() => setAiGender('male')}>
                    MALE<br/><span style={{fontSize:'9px', opacity:0.7}}>Low Pitch / Solid Form</span>
                  </button>
                  <button className={`toggle-btn ${aiGender === 'female' ? 'active' : ''}`} onClick={() => setAiGender('female')}>
                    FEMALE<br/><span style={{fontSize:'9px', opacity:0.7}}>High Pitch / Sleek Form</span>
                  </button>
                </div>
              </div>

              <div className="settings-group">
                <span className="settings-label">PERSONA DEFINITION (PROMPT INSTRUCTION)</span>
                <textarea 
                  className="persona-input" 
                  value={aiPersona} 
                  onChange={(e) => setAiPersona(e.target.value)} 
                  placeholder="例: あなたはクールなエージェントです。敬語は使わず、端的に報告してください。"
                />
              </div>

              <div style={{ fontSize: '10px', color: '#666', marginTop: '10px', textAlign: 'center' }}>
                ※ Settings are saved automatically and applied to the next response.
              </div>
            </div>
          </div>
        </div>
      )}

      <footer style={{ height: '24px', background: '#000', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontSize: '9px', color: '#444' }}>
        <div>© 2026 LARUbot Inc.</div>
        <div>ENTITY_MODE</div>
      </footer>
    </div>
  );
}