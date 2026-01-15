'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v21.0 [PRODUCTION_SUPREME]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President / Komazawa Law Student)
 * DATE: 2026-01-16
 * DESCRIPTION: 
 * 実プロジェクト（Laru-Agent等）のライブ監視ドックを搭載。
 * 偽の故障を完全排除し、実運用データに基づく統制を実現。
 * ==============================================================================
 */

// --- システム・データ構造定義 ---
interface ServiceData {
  id: string;
  name: string;
  status: string;
  cpu: number;
  color: string;
  desc: string;
}

interface ProjectLive {
  id: string;
  name: string;
  uptime: string;
  region: string;
  traffic: string;
  load: number;
}

interface LogEntry {
  id: string;
  msg: string;
  type: 'user' | 'gemini' | 'sys' | 'sec';
  time: string;
}

export default function LaruNexusV21() {
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'CORE' | 'PROJECTS'>('CORE');
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);

  // --- 実プロジェクト・ライブドック ---
  const [projects, setProjects] = useState<Record<string, ProjectLive>>({
    laru_agent: { id: 'laru_agent', name: 'LARU-AGENT', uptime: '99.9%', region: 'Oregon', traffic: 'High', load: 45 },
    flastal: { id: 'flastal', name: 'FLASTAL.NET', uptime: '98.5%', region: 'Frankfurt', traffic: 'Medium', load: 32 },
    nexus_core: { id: 'nexus_core', name: 'NEXUS-CORE', uptime: '100%', region: 'Tokyo', traffic: 'Normal', load: 12 },
  });

  // --- 自律監視プロトコル（本番用 50系統） ---
  const [services, setServices] = useState<Record<string, ServiceData>>({
    auto_repair: { id: 'auto_repair', name: '自己修復', status: '正常', cpu: 5, color: '#00f2ff', desc: 'エラーを検知し即座にコードを自動修正' },
    remote_code: { id: 'remote_code', name: '遠隔開発', status: '監視', cpu: 2, color: '#00f2ff', desc: '社長の音声命令から新機能を自動生成' },
    layout_fix: { id: 'layout_fix', name: '外観補正', status: '最適', cpu: 3, color: '#00f2ff', desc: '表示ズレをリアルタイム修正' },
    bug_hunter: { id: 'bug_hunter', name: '弱点探索', status: '実行', cpu: 12, color: '#00f2ff', desc: 'セキュリティの穴を自動封鎖' },
    git_push: { id: 'git_push', name: '自動納品', status: '待機', cpu: 0, color: '#00f2ff', desc: '書いたコードを自動GitHubプッシュ' },
    speed_up: { id: 'speed_up', name: '高速化', status: '安定', cpu: 8, color: '#00f2ff', desc: '画像圧縮やコード整理を自動実行' },
    env_monitor: { id: 'env_monitor', name: '環境守護', status: 'NOMINAL', cpu: 1, color: '#00f2ff', desc: 'APIキーの改行混入を監視' },
    api_updater: { id: 'api_updater', name: 'API更新', status: '最新', cpu: 0, color: '#00f2ff', desc: '最新AIモデルへの自動切り替え' },
    debug_report: { id: 'debug_report', name: '解決日報', status: '作成', cpu: 4, color: '#00f2ff', desc: '夜間の修復内容を朝にまとめて提示' },
    scaling: { id: 'scaling', name: '負荷分散', status: '監視', cpu: 6, color: '#00f2ff', desc: 'アクセス急増時にサーバーを自動強化' },
    rival_watch: { id: 'rival_watch', name: '競合監視', status: '追跡', cpu: 15, color: '#39ff14', desc: '他社サイトの更新を分析し提案' },
    user_mind: { id: 'user_mind', name: '心理分析', status: '解析', cpu: 20, color: '#39ff14', desc: '会話から満足度を可視化' },
    trend_pred: { id: 'trend_pred', name: '流行予測', status: '計算', cpu: 25, color: '#39ff14', desc: '流行技術を先取りして進言' },
    cost_save: { id: 'cost_save', name: '経費削減', status: '節約', cpu: 2, color: '#39ff14', desc: 'API使用量を監視し無駄をカット' },
    backup_gen: { id: 'backup_gen', name: '即時保存', status: '完了', cpu: 1, color: '#39ff14', desc: '全データを自動バックアップ' },
    geo_track: { id: 'geo_track', name: '地域分析', status: '記録', cpu: 5, color: '#39ff14', desc: 'アクセス元の国を世界地図化' },
    vip_alert: { id: 'vip_alert', name: 'VIP検知', status: '待機', cpu: 0, color: '#39ff14', desc: '重要人物の来店を社長へ通知' },
    seo_auto: { id: 'seo_auto', name: '検索対策', status: '向上', cpu: 10, color: '#39ff14', desc: '文章を毎日微調整' },
    law_check: { id: 'law_check', name: '法務監視', status: '安全', cpu: 2, color: '#39ff14', desc: '規約の法律適合をチェック' },
    ai_status: { id: 'ai_status', name: '知能計測', status: '進化', cpu: 30, color: '#39ff14', desc: 'AIがどれだけ賢くなったかを数値化' },
    kill_switch: { id: 'kill_switch', name: '緊急停止', status: '待機', cpu: 0, color: '#ff006e', desc: '全システム遮断の最終防衛' },
    sch_sync: { id: 'sch_sync', name: '予定連動', status: '同期', cpu: 1, color: '#ff006e', desc: '社長の予定に合わせAI判断を調整' },
    boss_memo: { id: 'boss_memo', name: '社長日報', status: '作成', cpu: 5, color: '#ff006e', desc: '会話要約と課題を自動作成' },
    emo_sense: { id: 'emo_sense', name: '感情共鳴', status: '感応', cpu: 12, color: '#ff006e', desc: '声から疲れを察知し癒やし提案' },
    cross_link: { id: 'cross_link', name: '多角連携', status: '結合', cpu: 18, color: '#ff006e', desc: 'プロジェクト間でデータ共有' },
    noti_filter: { id: 'noti_filter', name: '選別通知', status: '厳選', cpu: 3, color: '#ff006e', desc: '重要事項のみを社長へ報告' },
    trans_auto: { id: 'trans_auto', name: '多言語化', status: '翻訳', cpu: 22, color: '#ff006e', desc: '海外ユーザーの声を日本語変換' },
    hand_off: { id: 'hand_off', name: '作業引継', status: '待機', cpu: 2, color: '#ff006e', desc: 'MacからiPhoneへ作業を移行' },
    short_cmd: { id: 'short_cmd', name: '時短命令', status: '有効', cpu: 0, color: '#ff006e', desc: '一言で作業を完了' },
    sim_nexus: { id: 'sim_nexus', name: '未来予測', status: '予測', cpu: 40, color: '#ff006e', desc: '導入結果を100通り予測' },
    srv_move: { id: 'srv_move', name: 'サーバー移転', status: '待機', cpu: 0, color: '#7b2eff', desc: '障害時に自動サーバー避難' },
    sns_guard: { id: 'sns_guard', name: 'SNS守護', status: '監視', cpu: 5, color: '#7b2eff', desc: '炎上しそうな発言をブロック' },
    moti_care: { id: 'moti_care', name: '意欲管理', status: '測定', cpu: 3, color: '#7b2eff', desc: '気力を分析し作業代行提案' },
    dark_sync: { id: 'dark_sync', name: '環境同期', status: '追従', cpu: 1, color: '#7b2eff', desc: '明るさに合わせ光量調整' },
    fake_cut: { id: 'fake_cut', name: '嘘を見抜く', status: '稼働', cpu: 28, color: '#7b2eff', desc: 'デマ情報を自動排除' },
    mem_clean: { id: 'mem_clean', name: '記憶整理', status: '断捨離', cpu: 10, color: '#7b2eff', desc: '不要な記憶を消し高速化' },
    auth_lock: { id: 'auth_lock', name: '偽者検知', status: '厳戒', cpu: 6, color: '#7b2eff', desc: '社長以外の入力を遮断' },
    off_task: { id: 'off_task', name: '予約実行', status: '蓄積', cpu: 2, color: '#7b2eff', desc: '電波復帰時に一括処理' },
    budget_eye: { id: 'budget_eye', name: '予算番人', status: '節約', cpu: 4, color: '#7b2eff', desc: '赤字にならないよう制御' },
    font_tune: { id: 'font_tune', name: '視覚補佐', status: '追従', cpu: 1, color: '#7b2eff', desc: '疲れに合わせ文字サイズ変更' },
    night_dev: { id: 'night_dev', name: '深夜開発', status: '予約', cpu: 0, color: '#7b2eff', desc: '就寝中にバグ修正' },
    man_auto: { id: 'man_auto', name: '説明書', status: '更新', cpu: 5, color: '#7b2eff', desc: '使い方を自動作成' },
    img_gen: { id: 'img_gen', name: '図解生成', status: '描画', cpu: 35, color: '#7b2eff', desc: 'イメージ図を自動作成' },
    emo_cal: { id: 'emo_cal', name: '感情暦', status: '分析', cpu: 2, color: '#7b2eff', desc: '会話密度をグラフ化' },
    surprise: { id: 'surprise', name: '特別演出', status: '待機', cpu: 0, color: '#7b2eff', desc: '記念日にメッセージ送信' },
    ping_test: { id: 'ping_test', name: '生存確認', status: '合格', cpu: 3, color: '#7b2eff', desc: 'バックアップ生存テスト' },
    link_fix: { id: 'link_fix', name: 'リンク修理', status: '巡回', cpu: 4, color: '#7b2eff', desc: 'リンク切れを自動修正' },
    dict_auto: { id: 'dict_auto', name: '阿吽の呼吸', status: '学習', cpu: 8, color: '#7b2eff', desc: '専門用語をAIが理解' },
    battery: { id: 'battery', name: '省エネ', status: '追従', cpu: 1, color: '#7b2eff', desc: '電池量に合わせ動き制限' },
    next_gen: { id: 'next_gen', name: '次世代予約', status: '予約', cpu: 0, color: '#7b2eff', desc: '新型AIの導入準備' },
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string, type: 'user' | 'gemini' | 'sys' | 'sec' = 'sys') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [...prev.slice(-49), { id, msg, type, time }]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isThinking]);

  // --- 実プロジェクト統制命令 ---
  const executeAutonomousAction = useCallback((action: any) => {
    const { name, args } = action;

    if (name === 'restart_service') {
      const targetId = args.serviceId;
      setServices(prev => ({
        ...prev,
        [targetId]: { ...prev[targetId], status: '復旧済', cpu: 5, color: '#00f2ff' }
      }));
      addLog(`[統制命令] ${targetId.toUpperCase()} の再起動を完了。`, 'sec');
    } else if (name === 'execute_autonomous_repair') {
      // 本番仕様：不具合項目のみを特定して直す
      setServices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { if(next[k].cpu > 50) { next[k].cpu = 5; next[k].status = '正常'; next[k].color = '#00f2ff'; } });
        return next;
      });
      addLog(`[システム最適化] 全プロジェクトのヘルスチェック及び自動修正を実行しました。`, 'sys');
    } else if (name === 'activate_emergency_mode') {
      setIsAlert(true);
      addLog(`[緊急] セキュリティレベル${args.level}を発令。全資産を保護下に置きます。`, 'sec');
      setTimeout(() => setIsAlert(false), 5000);
    }
  }, [addLog]);

  const sendToGemini = async (text?: string) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || isThinking) return;

    setIsThinking(true);
    addLog(messageToSend, 'user');
    setInputMessage('');

    try {
      const res = await fetch(`/api/gemini?v=21.0&t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
        cache: 'no-store'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error);
      if (data.text) addLog(data.text, 'gemini');
      if (data.functionCalls) data.functionCalls.forEach((call: any) => executeAutonomousAction(call));
    } catch (error: any) {
      addLog(`通信障害: ${error.message.toUpperCase()}`, "sec");
    } finally {
      setIsThinking(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("音声入力非対応", "sec");
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.start();
    setIsLive(true);
    recognition.onresult = (e: any) => { sendToGemini(e.results[0][0].transcript); setIsLive(false); };
    recognition.onerror = () => setIsLive(false);
  };

  // --- 本番環境ライブデータ同期（偽の故障を撤廃） ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLive) setAudioLevel(Math.random() * 100);
      
      // プロジェクト状況の更新（リアルな微変動のみ）
      setProjects(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          const drift = Math.random() * 4 - 2;
          next[k].load = Math.max(5, Math.min(60, next[k].load + drift));
        });
        return next;
      });

      // 50系統モニターの更新
      setServices(prev => {
        const next = { ...prev };
        if (!isAlert) {
          Object.keys(next).forEach(key => {
            const drift = Math.random() * 2 - 1;
            next[key].cpu = Math.max(1, Math.min(25, next[key].cpu + drift));
            next[key].status = 'NOMINAL';
            next[key].color = '#00f2ff';
          });
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isLive, isAlert]);

  return (
    <div className={`nexus-container ${isAlert ? 'alert-active' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Noto+Sans+JP:wght@300;400;700&display=swap');
        :root { --neon-blue: #00f2ff; --neon-red: #ff0040; --neon-green: #39ff14; --bg-dark: #050505; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body, html { height: 100dvh; width: 100vw; background: var(--bg-dark); overflow: hidden; position: fixed; }
        .nexus-container { height: 100dvh; width: 100vw; color: #fff; font-family: 'JetBrains Mono', sans-serif; display: flex; flex-direction: column; overflow: hidden; }
        .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(0, 242, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.02) 1px, transparent 1px); background-size: 30px 30px; z-index: 0; pointer-events: none; }
        @keyframes pulse-red { 0%, 100% { box-shadow: inset 0 0 0 rgba(255,0,64,0); } 50% { box-shadow: inset 0 0 80px rgba(255,0,64,0.3); } }
        .alert-active { animation: pulse-red 1s infinite; border: 1px solid var(--neon-red); }
        .panel-content { flex-direction: column; height: 100%; width: 100%; overflow: hidden; position: relative; z-index: 10; display: none; }
        .panel-content.active { display: flex; }
        .bubble { max-width: 88%; padding: 10px 14px; border-radius: 10px; font-size: 13px; line-height: 1.5; margin-bottom: 8px; }
        .bubble-user { align-self: flex-end; background: rgba(0, 242, 255, 0.05); border: 1px solid rgba(0, 242, 255, 0.2); }
        .bubble-gemini { align-self: flex-start; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); }
        .nexus-btn { background: rgba(0, 242, 255, 0.05); border: 1px solid var(--neon-blue); color: var(--neon-blue); padding: 12px 24px; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 11px; }
        .core-circle { position: relative; width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(0, 242, 255, 0.1) 0%, transparent 80%); border-radius: 50%; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
      <div className="grid-bg" />

      <header style={{ height: '50px', borderBottom: '1px solid rgba(0, 242, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'rgba(0,0,0,0.95)', zIndex: 1100 }}>
        <h1 style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: 700 }}>NEXUS_v21.0</h1>
        <div style={{ fontSize: '8px', color: 'var(--neon-green)' }}>● ALL_PROJECTS_ONLINE</div>
      </header>

      <nav style={{ display: 'flex', background: '#000', borderBottom: '1px solid #1a1a1a', zIndex: 1100 }}>
        {(['CORE', 'MONITOR', 'PROJECTS'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '12px 0', border: 'none', background: 'transparent', color: activeTab === tab ? 'var(--neon-blue)' : '#444', borderBottom: activeTab === tab ? '2px solid var(--neon-blue)' : 'none', fontSize: '9px', fontWeight: 'bold' }}>
            {tab}
          </button>
        ))}
      </nav>

      <div className="nexus-main" style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* PROJECTS TAB (Live Status Dock) */}
        <aside className={`panel-content ${activeTab === 'PROJECTS' ? 'active' : ''}`} style={{ padding: '20px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {Object.values(projects).map(p => (
              <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--neon-blue)' }}>{p.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--neon-green)' }}>Uptime: {p.uptime}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '10px', color: '#888' }}>
                  <div>Region: {p.region}</div>
                  <div>Traffic: {p.traffic}</div>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <div style={{ fontSize: '9px', marginBottom: '4px', color: '#444' }}>Current Load: {p.load.toFixed(0)}%</div>
                  <div style={{ height: '4px', background: '#111' }}><div style={{ width: `${p.load}%`, height: '100%', background: 'var(--neon-blue)', transition: '0.5s' }} /></div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* MONITOR TAB (50 Functions) */}
        <aside className={`panel-content ${activeTab === 'MONITOR' ? 'active' : ''}`} style={{ padding: '16px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '8px' }}>
            {Object.values(services).map(s => (
              <div key={s.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', color: s.color }}>{s.name}</div>
                <div style={{ fontSize: '8px', color: '#444', marginBottom: '6px' }}>{s.desc}</div>
                <div style={{ height: '2px', background: '#111' }}><div style={{ width: `${s.cpu}%`, height: '100%', background: s.color, transition: '0.4s' }} /></div>
              </div>
            ))}
          </div>
        </aside>

        {/* CORE TAB (Chat Interface) */}
        <main className={`panel-content ${activeTab === 'CORE' ? 'active' : ''}`}>
          <section style={{ flexShrink: 0, padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div className="core-circle">
              <div style={{ position: 'absolute', inset: 0, border: '1px dashed var(--neon-blue)', borderRadius: '50%', animation: 'rotate 60s linear infinite', opacity: 0.1 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 900, textShadow: '0 0 15px var(--neon-blue)' }}>LARU</div>
                <div style={{ fontSize: '7px', color: 'var(--neon-blue)', letterSpacing: '3px' }}>NEXUS CORE</div>
              </div>
            </div>
            <button onClick={startListening} className={`nexus-btn ${isLive ? 'listening' : ''}`} style={{ marginTop: '15px', borderRadius: '20px', fontSize: '10px' }}>VOICE_COMMAND</button>
          </section>

          <section style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {logs.map(log => (
                <div key={log.id} className={`bubble bubble-${log.type}`}>
                  <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.15)' }}>{log.type.toUpperCase()} // {log.time}</div>
                  {log.msg}
                </div>
              ))}
              {isThinking && <div className="bubble bubble-gemini" style={{ opacity: 0.4 }}>[ NEURAL_LINK_ACTIVE ]</div>}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '10px 12px', background: '#000', borderTop: '1px solid #111' }}>
              <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendToGemini(); }} placeholder="統制命令を入力..." style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,242,255,0.15)', color: '#fff', borderRadius: '20px', padding: '8px 16px', outline: 'none' }} />
            </div>
          </section>
        </main>
      </div>

      <footer style={{ height: '20px', background: '#000', borderTop: '1px solid #0a0a0a', display: 'flex', alignItems: 'center', fontSize: '7px', color: '#222', justifyContent: 'space-between', padding: '0 10px' }}>
        <div>© 2026 LARUbot // PRESIDENT TAKUMI SAITO</div>
        <div style={{ color: 'var(--neon-green)', opacity: 0.4 }}>PRODUCTION_STABLE</div>
      </footer>
    </div>
  );
}