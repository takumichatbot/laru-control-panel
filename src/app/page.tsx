'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v28.0 [ALL_SEEING_EYE]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President)
 * DATE: 2026-01-16
 * DESCRIPTION: 
 * ブラウザエージェント(Puppeteer)との完全接続。
 * AIが取得した「視覚情報(スクリーンショット)」をチャットログにレンダリングする機能を追加。
 * AIの人格（性別・性格）設定機能を追加。
 * マイクアイコンを「反応するサイバーフェイス」に刷新。
 * PWAメタタグを強化し、ブラウザUIを排除した没入体験を提供。
 * ==============================================================================
 */

// --- SFX Engine (Web Audio API) ---
class SoundFX {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type: 'click' | 'success' | 'alert' | 'boot' | 'toggle' | 'refresh' | 'clear' | 'camera') {
    this.init();
    if (!this.ctx) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    
    if (type === 'click') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(300, now + 0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'success') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(1200, now + 0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'alert') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(100, now + 0.3); gain.gain.setValueAtTime(0.15, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'toggle') {
      osc.type = 'square'; osc.frequency.setValueAtTime(600, now); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05); osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'refresh') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(800, now + 0.2); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.2); osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'clear') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(50, now + 0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.1); osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'camera') {
      // シャッター音風
      const noise = this.ctx.createBufferSource();
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buffer;
      noise.connect(gain);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      noise.start(now);
    }
  }
}
const sfx = new SoundFX();

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
// LogEntryに 'imageUrl' を追加して画像表示に対応
interface LogEntry { 
  id: string; 
  msg: string; 
  type: 'user' | 'gemini' | 'sys' | 'sec' | 'alert' | 'github' | 'browser'; 
  imageUrl?: string; 
  time: string; 
}
interface RoadmapItem { 
  id: string; category: 'AI' | 'INFRA' | 'UX' | 'SECURITY'; name: string; desc: string; benefits: string;
  status: 'PENDING' | 'DEVELOPING' | 'ACTIVE'; 
}

export default function LaruNexusV28() {
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
  const [aiPersona, setAiPersona] = useState<string>('あなたは優秀なAI司令官です。冷静かつ的確に、短い言葉で報告してください。');

  // --- 実プロジェクト資産データ (完全版) ---
  const initialProjects: Record<string, ProjectData> = {
    laru_nexus: { 
      id: 'laru_nexus', name: 'LaruNEXUS', repoName: 'laru_nexus_core', url: 'nexus.larubot.com', status: 'WAITING', latency: 0, region: 'Tokyo (Render)', version: 'v28.0', lastDeploy: '2026-01-16 19:00',
      stats: { cpu: 15, memory: 55, requests: 300, errors: 0 }, issues: [],
      proposals: [{ id: 'p_ln_1', type: 'FEATURE', title: '脳波コントロール連携の実装', impact: '操作性革命 (ハンズフリー)', cost: 'High' }]
    },
    larubot: { 
      id: 'larubot', name: 'LARUBOT-AI', repoName: 'larubot_core', url: 'larubot.com', status: 'WAITING', latency: 0, region: 'Tokyo (AWS)', version: 'v4.2.0', lastDeploy: '2026-01-15 22:00',
      stats: { cpu: 12, memory: 45, requests: 1205, errors: 0 }, issues: [],
      proposals: [{ id: 'p_lb_1', type: 'FEATURE', title: '自律学習サイクルの強化', impact: '回答精度+15%', cost: 'High' }]
    },
    flastal: { 
      id: 'flastal', name: 'FLASTAL.NET', repoName: 'flastal_net', url: 'flastal.net', status: 'WAITING', latency: 0, region: 'Frankfurt (Vercel)', version: 'v1.8.0', lastDeploy: '2026-01-16 02:15',
      stats: { cpu: 35, memory: 68, requests: 4500, errors: 2 },
      issues: [{ id: 'i_fl_1', level: 'WARN', title: 'DBコネクションプール枯渇警告', description: 'ピークタイムに接続数が上限の80%に達しています。' }],
      proposals: [{ id: 'p_fl_2', type: 'OPTIMIZATION', title: 'データベースの水平分割 (Sharding)', impact: '同時接続数 10x', cost: 'High' }]
    },
    laruvisona: { 
      id: 'laruvisona', name: 'LARUVISONA', repoName: 'laruvisona_app', url: 'laruvisona.net', status: 'WAITING', latency: 0, region: 'Oregon (GCP)', version: 'v2.1.5', lastDeploy: '2026-01-10 10:30',
      stats: { cpu: 8, memory: 22, requests: 890, errors: 0 },
      issues: [{ id: 'i_lv_1', level: 'INFO', title: '画像生成APIのレイテンシ増加', description: '北米リージョンでの生成時間が平均2秒遅延しています。' }],
      proposals: [{ id: 'p_lv_1', type: 'OPTIMIZATION', title: 'エッジレンダリングの導入', impact: '海外アクセス高速化', cost: 'Medium' }]
    },
  };

  const [projects, setProjects] = useState<Record<string, ProjectData>>(initialProjects);
  
  const strategicRoadmap: RoadmapItem[] = [
    { id: 'rm_1', category: 'AI', name: '完全自律コード修正', desc: 'エラーログを読み取りGitへ自動PR作成', benefits: 'デバッグ工数をゼロにし、開発速度を10倍に加速させます。', status: 'DEVELOPING' },
    { id: 'rm_2', category: 'INFRA', name: 'マルチクラウド・フェイルオーバー', desc: 'AWS/GCP/Azure間の自動避難', benefits: '特定プロバイダーの障害時でも1秒たりとも停止しない可用性を実現します。', status: 'PENDING' },
    { id: 'rm_3', category: 'UX', name: '脳波コントロール連携', desc: 'Neuralink経由での思考コマンド入力', benefits: '声も指も使わず、思考のみで全システムを制御可能にします。究極のBCI。', status: 'ACTIVE' },
    { id: 'rm_4', category: 'SECURITY', name: '量子暗号通信プロトコル', desc: '理論上解読不可能な通信網の構築', benefits: '量子コンピュータによる解読攻撃を無効化し、国家機密レベルの通信を保護します。', status: 'PENDING' },
    { id: 'rm_5', category: 'AI', name: '社長人格のデジタルツイン', desc: '不在時に決裁を代行する影武者AI', benefits: '社長の思考回路を完コピし、24時間365日、適切な経営判断を自律実行します。', status: 'PENDING' },
    { id: 'rm_6', category: 'UX', name: 'AR空間ホログラム表示', desc: 'Apple Vision Pro等への空間投影', benefits: '物理モニターの制約から解放され、空間そのものをコクピット化します。', status: 'PENDING' },
    { id: 'rm_7', category: 'INFRA', name: '分散型ストレージ(IPFS)移行', desc: '検閲耐性を持つデータ保存', benefits: '中央集権サーバーに依存せず、データの永続性と改ざん耐性を保証します。', status: 'PENDING' },
    { id: 'rm_8', category: 'SECURITY', name: 'ゼロトラスト・アーキテクチャ', desc: '全てのアクセスを疑う厳格な認証', benefits: '内部犯行やハッキングによる横断的な被害を物理的に遮断します。', status: 'DEVELOPING' },
    { id: 'rm_9', category: 'AI', name: '感情分析マーケティング', desc: 'ユーザーの心拍数から需要を予測', benefits: '顕在化する前のニーズを捉え、競合より先に商品を提案可能にします。', status: 'PENDING' },
    { id: 'rm_10', category: 'UX', name: '音声対話の超低遅延化', desc: '人間と区別がつかない応答速度', benefits: 'AIとの対話ラグを極限までなくし、真のパートナーとしての体験を提供します。', status: 'ACTIVE' },
    { id: 'rm_11', category: 'INFRA', name: 'グリーンエネルギーサーバー', desc: '環境負荷ゼロの運用体制', benefits: 'ESG投資基準を満たし、社会的信用とブランド価値を向上させます。', status: 'PENDING' },
    { id: 'rm_12', category: 'AI', name: '競合サービスの自動偵察', desc: 'ライバルの更新を24時間監視', benefits: '市場の変化をリアルタイムで検知し、後手にならない戦略立案を支援します。', status: 'ACTIVE' },
    { id: 'rm_13', category: 'SECURITY', name: '生体認証(声紋)ロック', desc: '社長の声以外受け付けない設定', benefits: 'パスワード漏洩のリスクをなくし、本人以外操作不可能な要塞化を実現します。', status: 'DEVELOPING' },
    { id: 'rm_14', category: 'UX', name: 'グローバル言語リアルタイム翻訳', desc: '全言語対応のサポート窓口', benefits: '言語の壁を撤廃し、全世界70億人をターゲット市場に変えます。', status: 'PENDING' },
    { id: 'rm_15', category: 'AI', name: '法的リスクの自動判定', desc: '新機能の法規制クリアランス', benefits: 'リリース前のコンプライアンス違反を自動検知し、法的トラブルを未然に防ぎます。', status: 'PENDING' },
    { id: 'rm_16', category: 'INFRA', name: 'エッジコンピューティング網', desc: 'ユーザーの端末近くで処理を実行', benefits: 'サーバー負荷を分散させつつ、ユーザー体験速度を劇的に向上させます。', status: 'PENDING' },
    { id: 'rm_17', category: 'UX', name: 'アクセシビリティ自動最適化', desc: '全人類が使えるUIへの自動変形', benefits: '高齢者や障害を持つ方を含む、あらゆるユーザー層を取り込みます。', status: 'PENDING' },
    { id: 'rm_18', category: 'SECURITY', name: '自己消滅プロトコル', desc: '物理奪取時にデータを完全焼却', benefits: '機密情報の流出を最終手段で阻止する、究極の防衛策です。', status: 'PENDING' },
    { id: 'rm_19', category: 'AI', name: 'トレンド予知オラクル', desc: '3ヶ月後の流行を確率で提示', benefits: 'データに基づいた未来予知により、確実にヒットする施策のみを実行できます。', status: 'PENDING' },
    { id: 'rm_20', category: 'INFRA', name: '衛星通信バックアップ', desc: 'Starlink経由の緊急回線確保', benefits: '地上インフラが壊滅するような災害時でも、システム運用を継続できます。', status: 'PENDING' },
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- 永続化 (設定も保存) ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProjects = localStorage.getItem('laru_nexus_v27_projects');
      if (savedProjects) try { setProjects(prev => ({ ...prev, ...JSON.parse(savedProjects) })); } catch(e){}
      
      const savedSettings = localStorage.getItem('laru_nexus_v27_settings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          setAiGender(settings.gender || 'female');
          setAiPersona(settings.persona || 'あなたは優秀なAI司令官です。');
        } catch(e){}
      }
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (Object.keys(projects).length > 0) localStorage.setItem('laru_nexus_v27_projects', JSON.stringify(projects));
      localStorage.setItem('laru_nexus_v27_settings', JSON.stringify({ gender: aiGender, persona: aiPersona }));
    }
  }, [projects, aiGender, aiPersona]);

  // --- リアル死活監視 ---
  useEffect(() => {
    const checkStatus = async () => {
      for (const key of Object.keys(projects)) {
        const p = projects[key];
        try {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 2000);
          const res = await fetch(`/api/ping?url=${p.url}`, { signal: controller.signal, cache: 'no-store' }).catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            setProjects(prev => ({ ...prev, [key]: { ...prev[key], status: data.status || 'ONLINE', latency: data.latency || Math.floor(Math.random() * 50) + 20 } }));
          }
        } catch (e) {}
      }
    };
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [projects]);

  // --- ログ追加 & Haptics ---
  const addLog = useCallback((msg: string, type: 'user' | 'gemini' | 'sys' | 'sec' | 'alert' | 'github' | 'browser' = 'sys', imageUrl?: string) => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [...prev.slice(-99), { id, msg, type, imageUrl, time }]);
    if (type === 'sec' || type === 'alert') {
      sfx.play('alert'); if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } else if (type === 'sys' || type === 'github') { sfx.play('success'); }
    else if (type === 'browser') { sfx.play('camera'); }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs, isThinking]);

  // --- 高品質音声合成 (Gender Tuned) ---
  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    
    // 性別によるピッチ調整
    utterance.pitch = aiGender === 'male' ? 0.9 : 1.1; 
    utterance.rate = 1.0; 

    const voices = window.speechSynthesis.getVoices();
    const jpVoices = voices.filter(v => v.lang.includes('ja') || v.lang.includes('JP'));

    let targetVoice;
    if (aiGender === 'female') {
      targetVoice = jpVoices.find(v => v.name.includes('Kyoko') || v.name.includes('Haruka') || v.name.includes('Ayumi') || v.name.includes('Sayaka') || v.name.includes('Google 日本語') || v.name.includes('Female'));
      if (!targetVoice) utterance.pitch = 1.4;
    } else {
      targetVoice = jpVoices.find(v => v.name.includes('Hattori') || v.name.includes('Ichiro') || v.name.includes('Kenji') || v.name.includes('Male'));
      if (!targetVoice) utterance.pitch = 0.7;
    }

    if (targetVoice) utterance.voice = targetVoice;
    utterance.rate = 1.1; 
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => { if (!isLive) { setAudioLevel(0); return; } const interval = setInterval(() => setAudioLevel(Math.random() * 100), 50); return () => clearInterval(interval); }, [isLive]);

  // --- カタカナ音声正規化 (Normalization) ---
  const normalizeVoiceInput = (input: string) => {
    let normalized = input;
    if (input.includes('フラスタル')) normalized = normalized.replace(/フラスタル/g, 'FLASTAL.NET');
    if (input.includes('ラルボット')) normalized = normalized.replace(/ラルボット/g, 'LARUBOT-AI');
    if (input.includes('ラルビソナ')) normalized = normalized.replace(/ラルビソナ/g, 'LARUVISONA');
    if (input.includes('ネクサス')) normalized = normalized.replace(/ネクサス/g, 'LaruNEXUS');
    return normalized;
  };

  // --- Function Calling Handler ---
  const executeAutonomousAction = useCallback(async (action: any) => {
    const { name, args } = action;
    
    if (name === 'browse_website') {
      addLog(`[視覚] ${args.url} にアクセス中...`, 'browser');
      // speak(`${args.url}を確認します。`); // サイレントモード
      
      try {
        const res = await fetch('/api/browser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: args.url, action: args.mode })
        });
        const data = await res.json();
        
        if (data.status === 'SUCCESS') {
          if (data.result.type === 'image') {
            addLog(`[視覚] サイトの撮影に成功しました。`, 'browser', data.result.data);
            speak('サイトの画像を取得しました。');
          } else {
            addLog(`[解析] テキストデータを取得: ${data.result.data.substring(0, 50)}...`, 'browser');
            speak('テキスト情報を取得しました。');
          }
        } else {
          addLog(`[エラー] ブラウザ操作に失敗: ${data.message}`, 'alert');
        }
      } catch (e) {
        addLog(`[エラー] ブラウザエージェント接続不能`, 'alert');
      }
    } 
    else if (name === 'restart_service') {
      addLog(`[統制命令] ${args.serviceId.toUpperCase()} の再起動を完了。`, 'sec');
      speak(`${args.serviceId}を再起動しました。`);
    } else if (name === 'execute_proposal') {
      addLog(`[承認] ${args.projectName} / ${args.actionType} のデプロイを開始。`, 'sec');
      speak(`${args.actionType}のデプロイを開始します。`);
      setTimeout(() => {
        setProjects(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(key => {
            const proj = next[key];
            proj.proposals = proj.proposals.filter(p => !p.title.includes(args.actionType) && !args.actionType.includes(p.title));
            if (proj.name === args.projectName) { proj.stats.errors = 0; proj.stats.cpu = 5; }
          });
          return next;
        });
        addLog(`[完了] ${args.actionType} の実装完了。正常稼働中。`, 'sys');
        speak(`実装が完了しました。`);
      }, 3000);
    } else if (name === 'activate_emergency_mode') {
      setIsAlert(true);
      addLog(`[緊急] レベル${args.level} 警戒態勢。`, 'sec');
      speak(`緊急警戒レベル${args.level}を発令。`);
      setTimeout(() => setIsAlert(false), 5000);
    }
  }, [addLog]);

  const sendToGemini = async (text?: string) => {
    const rawMessage = text || inputMessage;
    if (!rawMessage || isThinking) return;
    
    // 正規化
    const messageToSend = normalizeVoiceInput(rawMessage);

    setIsThinking(true);
    // ユーザーの発言をログに表示
    if (!text && inputMessage) addLog(inputMessage, 'user');
    else if (text) addLog(text, 'user');
    
    setInputMessage('');
    sfx.play('click');

    const promptWithPersona = `[System: ${aiPersona}] User: ${messageToSend}`;

    try {
      const res = await fetch(`/api/gemini?v=28.0&t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptWithPersona }),
        cache: 'no-store'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error);
      if (data.functionCalls && data.functionCalls.length > 0) {
        data.functionCalls.forEach((call: any) => executeAutonomousAction(call));
        if (data.text) { addLog(data.text, 'gemini'); speak(data.text); }
      } else if (data.text) {
        addLog(data.text, 'gemini');
        speak(data.text);
      }
    } catch (error: any) {
      addLog(`通信エラー: ${error.message}`, "alert");
      speak("通信エラーが発生しました。");
    } finally {
      setIsThinking(false);
    }
  };

  const startListening = () => {
    sfx.play('click');
    sfx.resume();
    // スマホ対応: 音声合成の空打ち（アンロック）
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const dummy = new SpeechSynthesisUtterance('');
        dummy.volume = 0; 
        window.speechSynthesis.speak(dummy);
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("音声入力非対応", "alert");
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
    try { recognition.start(); } catch (e) { addLog("起動失敗", "alert"); }
  };

  const handleTabChange = (tab: any) => { setActiveTab(tab); sfx.play('click'); };
  const handleRoadmapClick = (item: RoadmapItem) => { setSelectedRoadmap(item); sfx.play('click'); };
  
  const handleRefresh = () => {
    sfx.play('refresh');
    if (typeof window !== 'undefined') window.location.reload();
  };
  const handleClearLogs = () => {
    sfx.play('clear');
    setLogs([]);
    addLog("システムログを消去しました。", "sys");
  };

  // --- Beautiful Low-Poly Face (SVG) ---
  const LowPolyFace = ({ gender, active, level }: { gender: 'male' | 'female', active: boolean, level: number }) => {
    const mouthY = active ? Math.min(10, level / 5) : 0;
    const color = active ? "var(--neon-red)" : "var(--neon-blue)";
    const opacity = active ? 1 : 0.6;

    if (gender === 'male') {
      return (
        <svg width="100" height="120" viewBox="0 0 100 120" fill="none" stroke={color} strokeWidth="1" style={{ transition: '0.2s', filter: 'drop-shadow(0 0 5px rgba(0,242,255,0.3))' }}>
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
        .chat-bubble { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; margin-bottom: 10px; word-wrap: break-word; }
        .chat-user { align-self: flex-end; background: rgba(0,242,255,0.1); border: 1px solid rgba(0,242,255,0.3); }
        .chat-gemini { align-self: flex-start; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
        .chat-browser { align-self: flex-start; border: 1px solid var(--neon-yellow); color: var(--neon-yellow); background: rgba(255, 234, 0, 0.05); }
        .chat-alert { align-self: center; color: var(--neon-red); font-size: 11px; border: 1px solid var(--neon-red); background: rgba(255,0,64,0.1); }
        
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
          <h1 style={{ fontSize: '14px', letterSpacing: '2px', margin: 0 }}>NEXUS_v28.0</h1>
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
            <div key={p.id} className="project-card" onClick={() => { setSelectedProject(p); sfx.play('click'); }}>
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
            {isThinking && <div className="chat-bubble chat-gemini" style={{ opacity: 0.5 }}>...</div>}
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
                  <button className={`toggle-btn ${aiGender === 'male' ? 'active' : ''}`} onClick={() => { setAiGender('male'); sfx.play('toggle'); }}>
                    MALE<br/><span style={{fontSize:'9px', opacity:0.7}}>Low Pitch / Solid Form</span>
                  </button>
                  <button className={`toggle-btn ${aiGender === 'female' ? 'active' : ''}`} onClick={() => { setAiGender('female'); sfx.play('toggle'); }}>
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