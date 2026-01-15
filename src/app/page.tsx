'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ==============================================================================
 * LARU NEXUS COMMAND SYSTEM v18.9 [AUTONOMOUS_COMPLETE]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President / Komazawa Law Student)
 * DATE: 2026-01-16
 * DESCRIPTION: 
 * バックエンドからのFunction Calling（自律命令）を受信し、
 * 実際にモニターの数値や色を物理的に書き換える「神経接続」を完了。
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

interface LogEntry {
  id: string;
  msg: string;
  type: 'user' | 'gemini' | 'sys' | 'sec';
  time: string;
}

export default function LaruNexusV18() {
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'CORE'>('CORE');
  const [isLive, setIsLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false); // 緊急モードフラグ

  // --- 自律型モニター：厳選50機能プロトコル ---
  const [services, setServices] = useState<Record<string, ServiceData>>({
    // [1] 自律コーディング・修正系 (10)
    auto_repair: { id: 'auto_repair', name: '自己修復', status: '待機', cpu: 5, color: '#00f2ff', desc: 'エラーを検知し即座にコードを自動修正' },
    remote_code: { id: 'remote_code', name: '遠隔開発', status: '監視', cpu: 2, color: '#00f2ff', desc: '社長の音声命令から新機能を自動生成' },
    layout_fix: { id: 'layout_fix', name: '外観補正', status: '最適', cpu: 3, color: '#00f2ff', desc: 'スマホ/PCの表示ズレをリアルタイム修正' },
    bug_hunter: { id: 'bug_hunter', name: '弱点探索', status: '実行', cpu: 12, color: '#00f2ff', desc: 'セキュリティの穴を自動で見つけて封鎖' },
    git_push: { id: 'git_push', name: '自動納品', status: '待機', cpu: 0, color: '#00f2ff', desc: '書いたコードを自動でGitHubへプッシュ' },
    speed_up: { id: 'speed_up', name: '高速化', status: '安定', cpu: 8, color: '#00f2ff', desc: '画像の圧縮やコードの整理を自動実行' },
    env_monitor: { id: 'env_monitor', name: '環境守護', status: 'NOMINAL', cpu: 1, color: '#00f2ff', desc: 'APIキーの期限切れや改行混入を監視' },
    api_updater: { id: 'api_updater', name: 'API更新', status: '最新', cpu: 0, color: '#00f2ff', desc: '最新AIモデルへの自動切り替えを準備' },
    debug_report: { id: 'debug_report', name: '解決日報', status: '作成', cpu: 4, color: '#00f2ff', desc: '夜間の修復内容を朝までにまとめて提示' },
    scaling: { id: 'scaling', name: '負荷分散', status: '監視', cpu: 6, color: '#00f2ff', desc: 'アクセス急増時にサーバーを自動強化' },
    // [2] ビジネス・運用監視系 (10)
    rival_watch: { id: 'rival_watch', name: '競合監視', status: '追跡', cpu: 15, color: '#39ff14', desc: '他社サイトの更新を分析し対抗案を提示' },
    user_mind: { id: 'user_mind', name: '心理分析', status: '解析', cpu: 20, color: '#39ff14', desc: '会話からユーザーの満足度を可視化' },
    trend_pred: { id: 'trend_pred', name: '流行予測', status: '計算', cpu: 25, color: '#39ff14', desc: '次に流行る技術を先取りして進言' },
    cost_save: { id: 'cost_save', name: '経費削減', status: '節約', cpu: 2, color: '#39ff14', desc: 'API使用量を監視し無駄な通信をカット' },
    backup_gen: { id: 'backup_gen', name: '即時保存', status: '完了', cpu: 1, color: '#39ff14', desc: '1時間ごとに全データを自動バックアップ' },
    geo_track: { id: 'geo_track', name: '地域分析', status: '記録', cpu: 5, color: '#39ff14', desc: 'どの国からアクセスが多いかを世界地図化' },
    vip_alert: { id: 'vip_alert', name: 'VIP検知', status: '待機', cpu: 0, color: '#39ff14', desc: '重要人物の来店を社長へ即座に通知' },
    seo_auto: { id: 'seo_auto', name: '検索対策', status: '向上', cpu: 10, color: '#39ff14', desc: '検索上位に来るよう文章を毎日微調整' },
    law_check: { id: 'law_check', name: '法務監視', status: '安全', cpu: 2, color: '#39ff14', desc: '利用規約が最新の法律に合うかチェック' },
    ai_status: { id: 'ai_status', name: '知能計測', status: '進化', cpu: 30, color: '#39ff14', desc: 'AIがどれだけ賢くなったかを数値化' },
    // [3] 社長専用・秘書系 (10)
    kill_switch: { id: 'kill_switch', name: '緊急停止', status: '待機', cpu: 0, color: '#ff006e', desc: '一瞬で全システムを遮断する最終防衛' },
    sch_sync: { id: 'sch_sync', name: '予定連動', status: '同期', cpu: 1, color: '#ff006e', desc: '社長の忙しさに合わせてAIの判断を調整' },
    boss_memo: { id: 'boss_memo', name: '社長日報', status: '作成', cpu: 5, color: '#ff006e', desc: '会話を要約し、明日の課題を自動作成' },
    emo_sense: { id: 'emo_sense', name: '感情共鳴', status: '感応', cpu: 12, color: '#ff006e', desc: '社長の疲れを声から察知し癒やしを提案' },
    cross_link: { id: 'cross_link', name: '多角連携', status: '結合', cpu: 18, color: '#ff006e', desc: '全プロジェクト間でデータを相互共有' },
    noti_filter: { id: 'noti_filter', name: '選別通知', status: '厳選', cpu: 3, color: '#ff006e', desc: '本当に重要な事だけを社長へ報告' },
    trans_auto: { id: 'trans_auto', name: '多言語化', status: '翻訳', cpu: 22, color: '#ff006e', desc: '海外ユーザーの声を完璧な日本語に変換' },
    hand_off: { id: 'hand_off', name: '作業引継', status: '待機', cpu: 2, color: '#ff006e', desc: 'MacからiPhoneへ作業をスムーズに移行' },
    short_cmd: { id: 'short_cmd', name: '時短命令', status: '有効', cpu: 0, color: '#ff006e', desc: 'いつもの作業を一言で終わらせる機能' },
    sim_nexus: { id: 'sim_nexus', name: '未来予測', status: '予測', cpu: 40, color: '#ff006e', desc: '新機能導入後の結果を100通り予測' },
    // [4] 将来拡張系 (20)
    srv_move: { id: 'srv_move', name: 'サーバー移転', status: '待機', cpu: 0, color: '#7b2eff', desc: '障害時に自動で別のサーバーへ避難' },
    sns_guard: { id: 'sns_guard', name: 'SNS守護', status: '監視', cpu: 5, color: '#7b2eff', desc: '炎上しそうな発言を事前にブロック' },
    moti_care: { id: 'moti_care', name: '意欲管理', status: '測定', cpu: 3, color: '#7b2eff', desc: '社長の気力を分析し作業代行を提案' },
    dark_sync: { id: 'dark_sync', name: '環境同期', status: '追従', cpu: 1, color: '#7b2eff', desc: '外の明るさに合わせ画面光量を調整' },
    fake_cut: { id: 'fake_cut', name: '嘘を見抜く', status: '稼働', cpu: 28, color: '#7b2eff', desc: 'ネット上のデマ情報を自動で排除' },
    mem_clean: { id: 'mem_clean', name: '記憶整理', status: '断捨離', cpu: 10, color: '#7b2eff', desc: '古い不要な記憶を消してAIを高速化' },
    auth_lock: { id: 'auth_lock', name: '偽者検知', status: '厳戒', cpu: 6, color: '#7b2eff', desc: '社長以外の声や入力を即座に遮断' },
    off_task: { id: 'off_task', name: '予約実行', status: '蓄積', cpu: 2, color: '#7b2eff', desc: '電波復帰時に命令を一括処理' },
    budget_eye: { id: 'budget_eye', name: '予算番人', status: '節約', cpu: 4, color: '#7b2eff', desc: '赤字にならないようAIの動きを制御' },
    font_tune: { id: 'font_tune', name: '視覚補佐', status: '追従', cpu: 1, color: '#7b2eff', desc: '社長の疲れに合わせ文字サイズを変更' },
    night_dev: { id: 'night_dev', name: '深夜開発', status: '予約', cpu: 0, color: '#7b2eff', desc: '社長の就寝中に細かいバグを修正' },
    man_auto: { id: 'man_auto', name: '説明書', status: '更新', cpu: 5, color: '#7b2eff', desc: '新機能の使い方を日本語で自動作成' },
    img_gen: { id: 'img_gen', name: '図解生成', status: '描画', cpu: 35, color: '#7b2eff', desc: '言葉を元にイメージ図を自動作成' },
    emo_cal: { id: 'emo_cal', name: '感情暦', status: '分析', cpu: 2, color: '#7b2eff', desc: '社長との会話の深さを月次でグラフ化' },
    surprise: { id: 'surprise', name: '特別演出', status: '待機', cpu: 0, color: '#7b2eff', desc: '記念日にAIが特別なメッセージを送信' },
    ping_test: { id: 'ping_test', name: '生存確認', status: '合格', cpu: 3, color: '#7b2eff', desc: 'バックアップが生きているか毎日テスト' },
    link_fix: { id: 'link_fix', name: 'リンク修理', status: '巡回', cpu: 4, color: '#7b2eff', desc: 'サイト内のリンク切れを自動で直す' },
    dict_auto: { id: 'dict_auto', name: '阿吽の呼吸', status: '学習', cpu: 8, color: '#7b2eff', desc: '社長の専門用語をAIが完全に理解' },
    battery: { id: 'battery', name: '省エネ', status: '追従', cpu: 1, color: '#7b2eff', desc: 'スマホの充電が減ると動きを制限' },
    next_gen: { id: 'next_gen', name: '次世代予約', status: '予約', cpu: 0, color: '#7b2eff', desc: '新型AIの発表時に即導入準備を開始' },
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string, type: 'user' | 'gemini' | 'sys' | 'sec' = 'sys') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setLogs(prev => [...prev, { id, msg, type, time }]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isThinking]);

  // --- 自律神経接続プロトコル (Function Calling Handler) ---
  const executeAutonomousAction = (action: any) => {
    const { name, args } = action;

    if (name === 'restart_service') {
      const targetId = args.serviceId;
      if (services[targetId]) {
        setServices(prev => ({
          ...prev,
          [targetId]: { ...prev[targetId], status: '復旧', cpu: 5, color: '#00f2ff' } // 青色に戻す
        }));
        addLog(`[自律修復] ${targetId.toUpperCase()} の再起動完了。正常値へ復帰。`, 'sec');
      }
    } else if (name === 'activate_emergency_mode') {
      setIsAlert(true);
      addLog(`[緊急事態] レベル${args.level}の警戒モードを発令。全システム防御態勢。`, 'sec');
      setTimeout(() => setIsAlert(false), 5000); // 5秒後に解除
    } else if (name === 'execute_autonomous_repair') {
      addLog(`[自律スキャン] ${args.target} のコード修正パッチを適用中... 完了。`, 'sys');
    }
  };

  // --- Gemini 2.5 Flash 実行エンジン ---
  const sendToGemini = async (text?: string) => {
    const messageToSend = text || inputMessage;
    if (!messageToSend || isThinking) return;

    setIsThinking(true);
    addLog(messageToSend, 'user');
    setInputMessage('');

    try {
      const res = await fetch(`/api/gemini?v=18.9&t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
        cache: 'no-store'
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.details || data.error || `ERROR_${res.status}`);

      // 1. テキストがあれば表示
      if (data.text) addLog(data.text, 'gemini');

      // 2. 自律命令(Function Call)があれば実行
      if (data.functionCalls && data.functionCalls.length > 0) {
        data.functionCalls.forEach((call: any) => executeAutonomousAction(call));
      }

    } catch (error: any) {
      addLog(`通信途絶: 命令を受理できませんでした。`, "sec");
      addLog(`理由: ${error.message.toUpperCase()}`, "sys");
    } finally {
      setIsThinking(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addLog("エラー: 音声モジュール非対応", "sec");
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.start();
    setIsLive(true);
    addLog("音声入力待機中...", "sys");
    recognition.onresult = (e: any) => {
      sendToGemini(e.results[0][0].transcript);
      setIsLive(false);
    };
    recognition.onerror = () => {
      setIsLive(false);
      addLog("音声のデコードに失敗。", "sys");
    };
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isLive) setAudioLevel(Math.random() * 100);
      setServices(prev => {
        const next = { ...prev };
        // 自律変動シミュレーション（アラート時は変動停止）
        if (!isAlert) {
          Object.keys(next).forEach(key => {
            const drift = Math.random() * 4 - 2;
            // 異常検知シミュレーション: たまに負荷を上げる
            if (Math.random() > 0.98) next[key].cpu = 95;
            
            next[key].cpu = Math.max(1, Math.min(99, next[key].cpu + drift));
            
            // 状態による色の自動変更
            if (next[key].cpu > 90) {
              next[key].color = '#ff0040'; // 赤
              next[key].status = '危険';
            } else if (next[key].cpu > 70) {
               next[key].color = '#ffea00'; // 黄
               next[key].status = '注意';
            } else {
               next[key].color = '#00f2ff'; // 青 (デフォルトに戻る)
               next[key].status = '正常';
            }
          });
        }
        return next;
      });
    }, 1000); // 1秒ごとに更新
    return () => clearInterval(interval);
  }, [isLive, isAlert]);

  return (
    <div className={`nexus-container ${isAlert ? 'alert-active' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Noto+Sans+JP:wght@300;400;700&display=swap');
        
        :root { --neon-blue: #00f2ff; --neon-red: #ff0040; --neon-green: #39ff14; --bg-dark: #050505; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; margin: 0; padding: 0; }
        body, html { height: 100dvh; width: 100vw; background: var(--bg-dark); overflow: hidden; position: fixed; }

        .nexus-container { 
          height: 100dvh; width: 100vw; background: var(--bg-dark); color: #fff; 
          font-family: 'JetBrains Mono', 'Noto Sans JP', sans-serif; 
          display: flex; flex-direction: column; overflow: hidden;
        }

        .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(0, 242, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.02) 1px, transparent 1px); background-size: 30px 30px; z-index: 0; pointer-events: none; }
        
        @keyframes pulse-red { 0% { box-shadow: inset 0 0 0 rgba(255,0,64,0); } 50% { box-shadow: inset 0 0 100px rgba(255,0,64,0.3); } 100% { box-shadow: inset 0 0 0 rgba(255,0,64,0); } }
        .alert-active { animation: pulse-red 1s infinite; border: 2px solid var(--neon-red); }

        .panel-content { flex-direction: column; height: 100%; width: 100%; overflow: hidden; position: relative; z-index: 10; display: none; }
        .panel-content.active { display: flex; }

        .bubble { max-width: 88%; padding: 10px 14px; border-radius: 10px; font-size: 13px; line-height: 1.5; position: relative; word-wrap: break-word; margin-bottom: 8px; }
        .bubble-user { align-self: flex-end; background: rgba(0, 242, 255, 0.05); border: 1px solid rgba(0, 242, 255, 0.2); border-bottom-right-radius: 2px; }
        .bubble-gemini { align-self: flex-start; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-bottom-left-radius: 2px; }
        .bubble-sys { align-self: center; color: #555; font-size: 8px; border: none; padding: 2px; }
        .bubble-sec { align-self: center; background: rgba(255, 0, 64, 0.05); border: 1px solid var(--neon-red); color: var(--neon-red); font-size: 9px; }

        .nexus-btn { 
          background: rgba(0, 242, 255, 0.05); border: 1px solid var(--neon-blue); color: var(--neon-blue); 
          padding: 12px 24px; font-weight: bold; cursor: pointer; text-transform: uppercase; 
          letter-spacing: 2px; transition: 0.2s; font-size: 11px; outline: none;
        }
        .nexus-btn:active { transform: scale(0.96); background: var(--neon-blue); color: #000; }
        .nexus-btn.listening { border-color: var(--neon-red); color: var(--neon-red); animation: blink 1s infinite; }

        .core-circle {
          position: relative; width: 180px; height: 180px; display: flex; align-items: center; justify-content: center;
          background: radial-gradient(circle, rgba(0, 242, 255, 0.1) 0%, transparent 80%);
          border-radius: 50%;
        }

        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 50% { opacity: 0.3; } }

        @media (max-width: 768px) {
          .core-circle { width: 140px; height: 140px; }
          .core-circle div:first-child { font-size: 28px !important; }
        }
      `}} />
      <div className="grid-bg" />

      {/* HEADER */}
      <header style={{ height: '50px', borderBottom: '1px solid rgba(0, 242, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'rgba(0, 0, 0, 0.95)', zIndex: 1100, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '18px', height: '18px', border: `2px solid ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '20%', background: isAlert ? 'var(--neon-red)' : 'var(--neon-blue)', boxShadow: `0 0 8px ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}` }} />
          </div>
          <h1 style={{ fontSize: '12px', letterSpacing: '2px', margin: 0, fontWeight: 700 }}>NEXUS_v18.9</h1>
        </div>
        <div style={{ fontSize: '8px', color: isAlert ? 'var(--neon-red)' : 'var(--neon-green)', fontFamily: 'JetBrains Mono' }}>[ 2.5_FLASH_AUTONOMOUS ]</div>
      </header>

      {/* TABS */}
      <nav style={{ display: 'flex', background: '#000', borderBottom: '1px solid #1a1a1a', zIndex: 1100, flexShrink: 0 }}>
        {(['CORE', 'MONITOR'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ 
            flex: 1, padding: '12px 0', border: 'none', background: 'transparent', 
            color: activeTab === tab ? 'var(--neon-blue)' : '#444', 
            borderBottom: activeTab === tab ? '2px solid var(--neon-blue)' : 'none', 
            fontSize: '9px', fontWeight: 'bold', cursor: 'pointer'
          }}>
            {tab === 'CORE' ? '司令本部 (対話)' : '自律監視パネル (50系統)'}
          </button>
        ))}
      </nav>

      <div className="nexus-main" style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* MONITOR PANEL */}
        <aside className={`panel-content ${activeTab === 'MONITOR' ? 'active' : ''}`} style={{ padding: '16px', overflowY: 'auto', background: 'rgba(0,0,0,0.85)' }}>
          <div style={{ fontSize: '9px', color: '#444', marginBottom: '15px', letterSpacing: '2px', textAlign: 'center' }}>// 50_SYSTEM_AUTONOMOUS_MONITOR</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '8px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {Object.values(services).map(s => (
              <div key={s.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                  <span style={{ color: s.color, fontWeight: 'bold' }}>{s.name}</span>
                  <span style={{ color: s.cpu > 90 ? 'var(--neon-red)' : '#666', fontSize: '8px' }}>{s.status}</span>
                </div>
                <div style={{ fontSize: '8px', color: '#444', marginBottom: '6px', height: '20px', overflow: 'hidden' }}>{s.desc}</div>
                <div style={{ height: '2px', background: '#111' }}><div style={{ width: `${s.cpu}%`, height: '100%', background: s.color, transition: '0.4s' }} /></div>
              </div>
            ))}
          </div>
        </aside>

        {/* CORE PANEL */}
        <main className={`panel-content ${activeTab === 'CORE' ? 'active' : ''}`} style={{ display: activeTab === 'CORE' ? 'flex' : 'none' }}>
          <section style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="core-circle">
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, opacity: 0.1, transform: `scale(${1 + audioLevel / 180})`, transition: '0.1s' }} />
              <div style={{ position: 'absolute', inset: '-8px', border: `1px dashed var(--neon-blue)`, borderRadius: '50%', animation: 'rotate 60s linear infinite', opacity: 0.08 }} />
              <div style={{ textAlign: 'center', zIndex: 10 }}>
                <div style={{ fontSize: '32px', fontWeight: 900, textShadow: `0 0 15px ${isAlert ? 'var(--neon-red)' : 'var(--neon-blue)'}`, letterSpacing: '3px' }}>LARU</div>
                <div style={{ fontSize: '7px', color: 'var(--neon-blue)', letterSpacing: '3px', marginTop: '4px', opacity: 0.8 }}>NEXUS CORE</div>
              </div>
            </div>
            <button onClick={startListening} className={`nexus-btn ${isLive ? 'listening' : ''}`} style={{ marginTop: '15px', padding: '8px 16px', borderRadius: '20px', fontSize: '10px' }}>
              {isLive ? '音声解析中...' : '音声コマンド'}
            </button>
          </section>

          <section style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' }}>
              {logs.map(log => (
                <div key={log.id} className={`bubble bubble-${log.type}`}>
                  <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.15)', marginBottom: '2px' }}>{log.type.toUpperCase()} // {log.time}</div>
                  {log.msg}
                </div>
              ))}
              {isThinking && <div className="bubble bubble-gemini" style={{ opacity: 0.4, animation: 'blink 1.5s infinite' }}>[ 思考ストリーム解析中 ]</div>}
              <div ref={chatEndRef} />
            </div>

            <div style={{ padding: '10px 12px', background: '#000', borderTop: '1px solid #111' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '2px 14px', border: '1px solid rgba(0,242,255,0.15)' }}>
                <input 
                  type="text" 
                  value={inputMessage} 
                  onChange={e => setInputMessage(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendToGemini(); } }} 
                  placeholder="直通コマンドを入力..." 
                  style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '13px', height: '36px' }} 
                />
                <button onClick={() => sendToGemini()} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>実行</button>
              </div>
            </div>
          </section>
        </main>
      </div>

      <footer style={{ height: '20px', background: '#000', borderTop: '1px solid #0a0a0a', display: 'flex', alignItems: 'center', fontSize: '7px', color: '#222', justifyContent: 'space-between', padding: '0 10px', zIndex: 1100 }}>
        <div>© 2026 LARUbot // PRESIDENT TAKUMI SAITO</div>
        <div style={{ color: 'var(--neon-green)', opacity: 0.4 }}>SYSTEM_STABLE_v18.9</div>
      </footer>
    </div>
  );
}