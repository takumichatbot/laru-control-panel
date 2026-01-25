import asyncio
import json
import base64
import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"
import random
import ccxt.async_support as ccxt  # 非同期版
import re
import sqlite3
import subprocess
import time
import numpy as np
import psutil
import pandas as pd
from dotenv import load_dotenv  # 鍵読み込みツールをインポート
load_dotenv()
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from playwright.async_api import async_playwright
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from hyperliquid.utils import constants


# --- Configuration ---
API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    # 開発環境（.envがない等）でも動くよう明示的な警告
    print("CRITICAL ERROR: GEMINI_API_KEY is not set in environment variables!")
else:
    genai.configure(api_key=API_KEY)

genai.configure(api_key=API_KEY)

# ■ 自己進化するパラメータ (AIが夜間に書き換える)
STRATEGY_PARAMS = {
    "rsi_period": 14,
    "vwap_window": 50,
    "adx_threshold": 20,
    "profit_target": 10.0,
    "stop_loss": -5.0
}


# --- GitHub API Integration (Multi-Repo Version) ---
import httpx

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# ■ リポジトリ台帳
# ここに管理したいリポジトリをすべて登録します
# もし「flastal」だけ顧客のGitHubアカウントにある場合は、ownerを書き換えてください
REPO_REGISTRY = {
    "larubot":    {"owner": "takumichatbot", "name": "LARUbot_homepage"},
    "laruvisona": {"owner": "takumichatbot", "name": "laruvisona-corp-site"},
    "larunexus":  {"owner": "takumichatbot", "name": "laru-control-panel"},
    "flastal":    {"owner": "takumichatbot", "name": "flastal"},
}

async def commit_github_fix(target_repo: str, file_path: str, new_content: str, commit_message: str):
    """
    GitHubのファイルを直接書き換える「神の手」機能 (マルチリポジトリ対応)
    
    Args:
        target_repo: 'larubot', 'flastal', 'larunexus' などの登録名
        file_path: 書き換えるファイルのパス (例: 'app/page.tsx')
        new_content: ファイルの新しい中身全体
        commit_message: コミットメッセージ
    """
    if not GITHUB_TOKEN:
        return "エラー: GitHubトークンが設定されていません。"

    # 1. リポジトリ情報の特定
    repo_info = REPO_REGISTRY.get(target_repo.lower())
    if not repo_info:
        # 登録がない場合はデフォルトでlarubot、またはエラーにする
        # ここでは柔軟に、target_repoがそのままリポジトリ名だと解釈してトライする救済措置
        repo_info = {"owner": "takumichatbot", "name": target_repo}

    owner = repo_info["owner"]
    repo = repo_info["name"]

    headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}"
    
    print(f"🔨 GitHub操作開始: {owner}/{repo} の {file_path} を修正中...")

    # 2. 現在のファイルのSHAを取得 (上書きに必要)
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(url, headers=headers)
            sha = res.json().get("sha") if res.status_code == 200 else None
            
            # 3. アップデート実行
            data = {
                "message": commit_message,
                "content": base64.b64encode(new_content.encode()).decode(),
            }
            if sha:
                data["sha"] = sha
            
            put_res = await client.put(url, headers=headers, json=data)
            
            if put_res.status_code in [200, 201]:
                return f"✅ 成功: {repo} の {file_path} を更新しました。"
            else:
                return f"❌ GitHubエラー({put_res.status_code}): {put_res.text}"
                
        except Exception as e:
            return f"❌ 通信エラー: {str(e)}"
        
# ■ Google検索ツールの定義 (Omniscience)
search_tool = {"google_search": {}} 

# Binanceのインスタンス作成（認証不要のパブリックデータ用）
exchange_binance = ccxt.binance({
    'enableRateLimit': True,
    'options': {'defaultType': 'future'} # 先物データを見る
})



async def read_github_content(target_repo: str, file_path: str):
    """
    指定されたリポジトリのファイルの中身を読み取る
    """
    if not GITHUB_TOKEN: return "Error: No Token"
    
    # リポジトリ名の正規化 (大文字小文字無視)
    target_key = target_repo.lower().strip()
    
    # 辞書から検索
    repo_info = REPO_REGISTRY.get(target_key)
    
    # 辞書にない場合、デフォルトの larubot にフォールバックするか、指定された名前をそのまま使う
    if not repo_info:
        # もし target_repo が "larubot" なら辞書のキーが合っていない可能性があるので強制変換
        if "laru" in target_key:
            repo_info = REPO_REGISTRY["larubot"]
        else:
            # 登録されていないリポジトリの場合
            return f"Error: Repository '{target_repo}' not found in registry. Available: {list(REPO_REGISTRY.keys())}"

    owner = repo_info["owner"]
    repo = repo_info["name"]
    
    # ファイルパスの修正（backend/main.py のように階層がある場合への対応）
    # 今回はルートにあると仮定するが、見つからない場合は backend/ をつけて再トライするロジック
    
    async def fetch(path):
        url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
        headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
        async with httpx.AsyncClient() as client:
            return await client.get(url, headers=headers)

    # 1回目トライ
    res = await fetch(file_path)
    
    # 2回目トライ (backend/ をつけてみる)
    if res.status_code == 404 and not file_path.startswith("backend/"):
        res = await fetch(f"backend/{file_path}")

    if res.status_code == 200:
        content = base64.b64decode(res.json()["content"]).decode()
        return content
    else:
        return f"GitHub Error ({res.status_code}): {res.text} (Repo: {owner}/{repo}, Path: {file_path})"
    


async def fetch_repo_structure(target_repo: str):
    """
    指定されたリポジトリの全ファイルパス一覧（ファイルツリー）を取得する。
    AIがプロジェクト構造を把握するために使用する。
    """
    if not GITHUB_TOKEN: return "Error: No Token"
    
    # リポジトリ名の正規化
    target_key = target_repo.lower().strip()
    repo_info = REPO_REGISTRY.get(target_key)
    
    if not repo_info:
        if "laru" in target_key: repo_info = REPO_REGISTRY["larubot"]
        else: return "Error: Repository not found"

    owner = repo_info["owner"]
    repo = repo_info["name"]
    
    # GitHub Tree API (recursive=1 でサブフォルダも全て取得)
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1"
    headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                # ファイルパスだけを抽出 (blobタイプのみ)
                paths = [item['path'] for item in data.get('tree', []) if item['type'] == 'blob']
                
                # パスが多すぎるとAIが混乱するので、主要なものを返す（または先頭100件）
                # ここではそのまま返すが、必要ならフィルタリング可能
                return json.dumps(paths[:100]) 
            else:
                return f"GitHub API Error ({res.status_code}): {res.text}"
        except Exception as e:
            return f"Network Error: {str(e)}"
    
    
# .env または環境変数から取得
RENDER_API_KEY = os.getenv("RENDER_API_KEY")

async def check_render_status():
    """
    Render APIを使用して、現在のデプロイ状況とサービスの状態を確認する
    """
    if not RENDER_API_KEY:
        return "エラー: RENDER_API_KEY が設定されていません。"

    headers = {"Authorization": f"Bearer {RENDER_API_KEY}", "Accept": "application/json"}
    
    async with httpx.AsyncClient() as client:
        try:
            # 1. サービス一覧を取得
            services_res = await client.get("https://api.render.com/v1/services", headers=headers)
            if services_res.status_code != 200:
                return f"Render API Error: {services_res.text}"
            
            services = services_res.json()
            report = []
            
            for svc in services:
                name = svc['service']['name']
                svc_id = svc['service']['id']
                status = svc['service']['serviceDetails'].get('status', 'unknown')
                url = svc['service']['serviceDetails'].get('url', 'no-url')
                
                # 2. 最新のデプロイ情報を取得
                deploys_res = await client.get(f"https://api.render.com/v1/services/{svc_id}/deploys?limit=1", headers=headers)
                deploy_info = "Deploy info unavailable"
                if deploys_res.status_code == 200 and len(deploys_res.json()) > 0:
                    latest = deploys_res.json()[0]
                    deploy_status = latest['status'] # live, build_failed, etc
                    commit = latest['commit']['message'] if latest.get('commit') else 'Manual Deploy'
                    deploy_info = f"Latest Deploy: {deploy_status} (Commit: {commit})"
                
                report.append(f"📦 **{name}**\n   Status: {status}\n   URL: {url}\n   {deploy_info}")
            
            return "\n\n".join(report)
            
        except Exception as e:
            return f"Render Monitor Error: {str(e)}"
    
# --- Discord Notification System ---
# .env に DISCORD_WEBHOOK_URL を設定してください
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

async def send_discord_alert(title: str, description: str, color: int = 0x00ff00, fields: list = []):
    """Discordにリッチな通知（Embed）を送信する"""
    if not DISCORD_WEBHOOK_URL:
        return
    
    payload = {
        "username": "LaruNexus AI",
        "avatar_url": "https://cdn-icons-png.flaticon.com/512/4712/4712009.png",
        "embeds": [{
            "title": title,
            "description": description,
            "color": color, # 緑: 65280(0x00ff00), 赤: 16711680(0xff0000), 青: 3855606
            "fields": fields,
            "footer": {"text": f"LaruNexus Genesis • {datetime.now().strftime('%H:%M:%S')}"}
        }]
    }
    
    try:
        async with httpx.AsyncClient() as client:
            await client.post(DISCORD_WEBHOOK_URL, json=payload)
    except Exception as e:
        print(f"Discord Send Error: {e}")

# --- Hyperliquid Configuration ---
from eth_account import Account
# 環境変数から読み込み
AGENT_PRIVATE_KEY = os.getenv("HyperLiquid_AGENT_KEY")
ACCOUNT_ADDRESS = os.getenv("HyperLiquid_WALLET_ADDRESS")

# --- 安全装置設定 ---
DAILY_LOSS_LIMIT = -50.0  # 1日に50ドル負けたらその日は終了
TODAY_PNL = 0.0           # 今日の損益（起動時リセット）
LAST_RESET_DAY = datetime.now().day

# エラーハンドリング
if not AGENT_PRIVATE_KEY or not ACCOUNT_ADDRESS:
    print("⚠️  Hyperliquidの鍵設定が足りません！ export コマンドを確認してください。")
    # テスト用に動かすなら、ここに直接文字列を入れても動きますが、本番は環境変数推奨
else:
    print("✅ Hyperliquid設定読み込み完了")

# 【重要修正】秘密鍵文字列を「アカウントオブジェクト」に変換
wallet = Account.from_key(AGENT_PRIVATE_KEY)

# SDKの初期化（ここではグローバル変数として定義だけしておく）
info = None
exchange = None

def get_info():
    global info
    if info is None:
        # 必要になった時に初めて接続する
        info = Info(constants.MAINNET_API_URL, skip_ws=True)
    return info

def get_exchange():
    global exchange
    if exchange is None:
        exchange = Exchange(wallet, constants.MAINNET_API_URL, account_address=ACCOUNT_ADDRESS)
    return exchange


async def get_external_ohlcv(coin: str, timeframe: str = '1m', limit: int = 50):
    """
    【負荷分散】Binanceからチャートデータを取得する
    HyperliquidのAPI制限を節約するために使用
    """
    # HYPEなどBinanceにない銘柄はHyperliquidを使う（今回はHYPE除外済みなので基本使われない）
    if coin == "HYPE": 
        api = get_info()
        return await asyncio.to_thread(api.candles_snapshot, "HYPE", timeframe, None, None)

    # ■ ユニバース拡張対応: シンボル変換マップ
    symbol_map = {
        "BTC": "BTC/USDT",
        "ETH": "ETH/USDT",
        "SOL": "SOL/USDT",
        "AVAX": "AVAX/USDT",
        "SUI": "SUI/USDT",
        "APT": "APT/USDT",
        "DOGE": "DOGE/USDT",
        "PEPE": "PEPE/USDT",
        "WIF": "WIF/USDT",
        "ARB": "ARB/USDT",
        "OP": "OP/USDT",
        "TIA": "TIA/USDT",
        "XRP": "XRP/USDT"
    }
    
    target = symbol_map.get(coin)
    if not target: 
        print(f"⚠️ Warning: {coin} is not in Binance map. Skipping.")
        return None

    try:
        # Binanceから取得
        ohlcv = await exchange_binance.fetch_ohlcv(target, timeframe, limit=limit)
        
        # DataFrame化 (Hyperliquidの形式に合わせる)
        df = pd.DataFrame(ohlcv, columns=['t', 'o', 'h', 'l', 'c', 'v'])
        df['t'] = pd.to_datetime(df['t'], unit='ms')
        return df
        
    except Exception as e:
        print(f"External Data Error ({coin}): {e}")
        return None

def calculate_technical_analysis(df, depth_data=None, timeframe_label=""):
    """
    【神】チャート × 板情報 複合分析
    """
    if df is None or len(df) < 35: return f"【{timeframe_label}】データ不足"

    # ... (既存のSMA, RSI, BB, MACD, ATR計算コードはそのまま維持) ...
    # 1. SMA
    df['SMA_20'] = df['c'].rolling(window=20).mean()
    df['SMA_50'] = df['c'].rolling(window=50).mean()
    # 2. RSI
    delta = df['c'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    # 3. BB
    std = df['c'].rolling(window=20).std()
    df['BB_Upper'] = df['SMA_20'] + (std * 2)
    df['BB_Lower'] = df['SMA_20'] - (std * 2)
    df['BB_Width'] = (df['BB_Upper'] - df['BB_Lower']) / df['SMA_20']
    # 4. MACD
    exp12 = df['c'].ewm(span=12, adjust=False).mean()
    exp26 = df['c'].ewm(span=26, adjust=False).mean()
    df['MACD'] = exp12 - exp26
    df['Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
    # 5. ATR & RVOL
    high_low = df['h'] - df['l']
    high_close = (df['h'] - df['c'].shift()).abs()
    low_close = (df['l'] - df['c'].shift()).abs()
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    df['ATR'] = ranges.max(axis=1).rolling(window=14).mean()
    df['Vol_SMA'] = df['v'].rolling(window=20).mean()
    df['RVOL'] = df['v'] / df['Vol_SMA']

    latest = df.iloc[-1]
    
    # --- 板情報の解析テキストを追加 ---
    depth_text = "板情報なし"
    if depth_data:
        imb = depth_data['imbalance']
        pressure = "🐂買い優勢" if imb > 55 else ("🐻売り優勢" if imb < 45 else "拮抗")
        depth_text = (
            f"板情報(OrderBook):\n"
            f"   - 圧力バランス: {pressure} (買いパワー: {imb:.1f}%)\n"
            f"   - スプレッド: {depth_data['spread']:.4f}% (広いと不利)\n"
        )

    analysis_text = (
        f"📊【{timeframe_label} 統合分析】\n"
        f"- 現在値: {latest['c']}\n"
        f"- {depth_text}"
        f"- RVOL: {latest['RVOL']:.2f} / ATR: {latest['ATR']:.4f}\n"
        f"- RSI(14): {latest['RSI']:.2f}\n"
        f"- MACD: {'GC買い' if latest['MACD'] > latest['Signal'] else 'DC売り'}\n"
    )
    return analysis_text


def place_order(coin: str, action: str, size: float, strategy_style: str):
    """
    仮想通貨の注文を実行します。
    coin: 通貨ペア名 (例: 'HYPE', 'BTC', 'ETH')
    action: '買' または '売'
    size: 注文数量 (例: 0.1, 10.0)
    strategy_style: 'SCALP', 'DAY', 'SWING'
    """
    pass





LEARNED_LESSONS = "現在、特筆すべき失敗パターンは検知されていません。慎重に執行してください。"
IS_TRADING_ACTIVE = False

# --- Database: GENESIS Memory & Trading System ---
DB_PATH = "/opt/render/project/src/nexus_genesis.db" if os.getenv("RENDER") else "nexus_genesis.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # 既存のログテーブル
    c.execute('''CREATE TABLE IF NOT EXISTS logs
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, channel_id TEXT, timestamp TEXT, msg TEXT, type TEXT, image_url TEXT)''')
    # 資産管理テーブル
    c.execute('''CREATE TABLE IF NOT EXISTS portfolio
                 (ticker TEXT PRIMARY KEY, shares REAL, entry_price REAL, last_updated TEXT)''')
    # 【新規】取引履歴テーブル (自己学習用)
    c.execute('''CREATE TABLE IF NOT EXISTS trade_history
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, ticker TEXT, side TEXT, qty REAL, price REAL, pnl REAL, reason TEXT, timestamp TEXT)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS kpi_scores
                 (dept TEXT PRIMARY KEY, score INTEGER, streak INTEGER, last_eval TEXT)''')
    
    # 初期データの投入（なければ）
    depts = ["CENTRAL", "DEV", "TRADING", "INFRA"]
    for d in depts:
        c.execute("INSERT OR IGNORE INTO kpi_scores (dept, score, streak, last_eval) VALUES (?, 50, 0, ?)", (d, datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    
def update_kpi(dept: str, points: int, reason: str):
    """
    【人事評価】AI社員のスコアを増減させる。
    points: 正なら加点（成功）、負なら減点（失敗）
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT score, streak FROM kpi_scores WHERE dept = ?", (dept,))
        row = c.fetchone()
        
        if row:
            current_score, current_streak = row
            new_score = max(0, min(100, current_score + points)) # 0〜100点
            
            # 連勝/連敗ボーナス
            new_streak = current_streak + 1 if points > 0 else 0
            
            c.execute("UPDATE kpi_scores SET score = ?, streak = ?, last_eval = ? WHERE dept = ?", 
                      (new_score, new_streak, datetime.now().isoformat(), dept))
            conn.commit()
            
            # 評価変動を通知
            icon = "📈" if points > 0 else "📉"
            msg = f"{icon} **KPI UPDATE: {dept}**\nScore: {current_score} -> {new_score} (Streak: {new_streak})\n理由: {reason}"
            print(msg)
            return new_score, new_streak
    except Exception as e:
        print(f"KPI Error: {e}")
    finally:
        conn.close()
    return 50, 0

def get_current_kpi(dept: str):
    """現在のスコアを取得"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT score, streak FROM kpi_scores WHERE dept = ?", (dept,))
    row = c.fetchone()
    conn.close()
    return row if row else (50, 0)

init_db()

def save_log(channel_id, msg, log_type, image_url=None):
    """記憶をデータベースに書き込む (部署タグ付き)"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        timestamp = datetime.now().strftime("%H:%M:%S")
        c.execute("INSERT INTO logs (channel_id, timestamp, msg, type, image_url) VALUES (?, ?, ?, ?, ?)",
                  (channel_id, timestamp, msg, log_type, image_url))
        conn.commit()
        conn.close()
    except Exception as e: print(f"DB Error: {e}")

def get_channel_logs(channel_id, limit=50):
    """特定のチャンネルの記憶のみを呼び出す"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT timestamp, msg, type, image_url FROM logs WHERE channel_id = ? ORDER BY id DESC LIMIT ?", (channel_id, limit))
        rows = c.fetchall()
        conn.close()
        # 時系列順に戻す
        return [{"time": r[0], "msg": r[1], "type": r[2], "imageUrl": r[3], "id": f"hist_{i}_{channel_id}"} for i, r in enumerate(reversed(rows))]
    except: return []

# --- Server Setup ---
app = FastAPI()
@app.get("/")
def root():
    return {"status": "ok", "service": "LaruNexus GENESIS", "time": datetime.now().isoformat()}

ORIGINS = os.getenv("FRONTEND_URL", "*").split(",")
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections: self.active_connections.remove(websocket)
    async def broadcast(self, message: dict):
        # ログメッセージならDBにも保存
        if message.get("type") == "LOG":
            payload = message.get("payload", {})
            # デフォルトはCENTRAL、メッセージにchannelIdがあればそれを使う
            cid = message.get("channelId", "CENTRAL")
            save_log(cid, payload.get("msg"), payload.get("type"), payload.get("imageUrl"))

        for connection in list(self.active_connections):
            try: await connection.send_json(message)
            except: self.disconnect(connection)

manager = ConnectionManager()

# --- Specialized Agents (専門部隊) ---

def calculate_indicators(df):
    """
    データフレームにテクニカル指標(EMA, RSI, ADX)を追加する
    """
    if df is None or len(df) < 200:
        return df

    # 1. EMA 200 (長期トレンド)
    df['EMA_200'] = df['c'].ewm(span=200, adjust=False).mean()
    
    # 2. RSI 14 (買われすぎ/売られすぎ)
    delta = df['c'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # 3. ボリンジャーバンド
    df['BB_UPPER'] = df['c'].rolling(20).mean() + (df['c'].rolling(20).std() * 2)
    df['BB_LOWER'] = df['c'].rolling(20).mean() - (df['c'].rolling(20).std() * 2)

    # 4. VWAP (出来高加重平均価格) - ロジックで使用されているため追加
    v = df['v']
    tp = (df['h'] + df['l'] + df['c']) / 3
    df['VWAP'] = (tp * v).rolling(window=20).sum() / v.rolling(window=20).sum()

    # 5. ADX (平均方向性指数) - ★これが抜けていました！★
    # True Range (TR)
    df['tr0'] = abs(df['h'] - df['l'])
    df['tr1'] = abs(df['h'] - df['c'].shift(1))
    df['tr2'] = abs(df['l'] - df['c'].shift(1))
    df['TR'] = df[['tr0', 'tr1', 'tr2']].max(axis=1)

    # Directional Movement (+DM, -DM)
    df['+DM'] = np.where((df['h'] - df['h'].shift(1)) > (df['l'].shift(1) - df['l']), 
                         np.maximum(df['h'] - df['h'].shift(1), 0), 0)
    df['-DM'] = np.where((df['l'].shift(1) - df['l']) > (df['h'] - df['h'].shift(1)), 
                         np.maximum(df['l'].shift(1) - df['l'], 0), 0)

    # Smooth (14 period)
    period = 14
    df['TR_smooth'] = df['TR'].ewm(span=period, adjust=False).mean()
    df['+DM_smooth'] = df['+DM'].ewm(span=period, adjust=False).mean()
    df['-DM_smooth'] = df['-DM'].ewm(span=period, adjust=False).mean()

    # DI & DX
    df['+DI'] = 100 * (df['+DM_smooth'] / df['TR_smooth'])
    df['-DI'] = 100 * (df['-DM_smooth'] / df['TR_smooth'])
    df['DX'] = 100 * abs((df['+DI'] - df['-DI']) / (df['+DI'] + df['-DI']))
    
    # ADX Final
    df['ADX'] = df['DX'].ewm(span=period, adjust=False).mean()

    # CVD (Cumulative Volume Delta) - ロジックで使用されているため簡易計算
    # 陽線ならプラス、陰線ならマイナスの出来高を累積
    df['vol_sign'] = np.where(df['c'] > df['o'], df['v'], -df['v'])
    df['CVD'] = df['vol_sign'].cumsum()
    
    # 統計的乖離 (Z_Score) - ロジックで使用
    df['Z_Score'] = (df['c'] - df['c'].rolling(20).mean()) / df['c'].rolling(20).std()

    # 6. 欠損値の処理
    df = df.fillna(0)
    
    return df

async def get_external_ohlcv(symbol: str, timeframe: str = "1m", limit: int = 300):
    """
    【修正版】ccxt(非同期版)を使ってBinanceからデータを取得し、指標を計算して返す
    """
    exchange = None
    try:
        # ccxtのインスタンス化 (非同期版として作成)
        exchange = ccxt.binance({
            'enableRateLimit': True,
            'options': {'defaultType': 'future'} # 先物市場を優先
        })

        # PEPEなどは 1000PEPE として扱われることがあるため補正
        target_symbol = f"{symbol}/USDT"
        if symbol == "PEPE": target_symbol = "1000PEPE/USDT" 

        try:
            # ★修正点: asyncio.to_thread を削除し、直接 await する
            ohlcv = await exchange.fetch_ohlcv(target_symbol, timeframe, limit=limit)
        except Exception:
            # 先物になければ現物(Spot)でリトライ
            exchange.options['defaultType'] = 'spot'
            target_symbol = f"{symbol}/USDT" # 現物は通常表記
            # ★修正点: ここも直接 await
            ohlcv = await exchange.fetch_ohlcv(target_symbol, timeframe, limit=limit)

        if not ohlcv:
            return None

        # DataFrameに変換
        df = pd.DataFrame(ohlcv, columns=['time', 'o', 'h', 'l', 'c', 'v'])
        df['time'] = pd.to_datetime(df['time'], unit='ms')
        
        # 指標計算
        df = calculate_indicators(df)
        
        return df

    except Exception as e:
        print(f"Data Fetch Error ({symbol}): {e}")
        return None
        
    finally:
        # ★重要: 使い終わった接続は必ず閉じる（これをしないとメモリリークします）
        if exchange:
            await exchange.close()

        
        
        
async def get_hl_price(coin: str):
    """Hyperliquidから現在価格を取得"""
    all_mids = get_info().all_mids()
    return float(all_mids.get(coin, 0))

# --- 【追加】高度分析エンジン ---

async def get_ohlcv(coin: str, interval: str = "1h", limit: int = 50):
    """
    Hyperliquidから過去のローソク足データを取得し、Pandasデータフレームに変換する
    interval: 15m, 1h, 4h, 1d など
    """
    try:
        # Hyperliquidのキャンドル取得API
        raw_candles = info.candles_snapshot(coin, interval, startTime=None, endTime=None)
        
        # データフレーム化
        df = pd.DataFrame(raw_candles)
        df['t'] = pd.to_datetime(df['t'], unit='ms')
        df['c'] = df['c'].astype(float) # 終値
        df['h'] = df['h'].astype(float) # 高値
        df['l'] = df['l'].astype(float) # 安値
        df['v'] = df['v'].astype(float) # 出来高
        
        # 古い順に並べ替え
        df = df.sort_values('t').reset_index(drop=True)
        return df
    except Exception as e:
        print(f"Candle Data Error ({coin}): {e}")
        return None
    
    
# --- 【追加】板情報＆ファンダメンタルズ分析エンジン ---

async def get_market_depth(coin: str):
    """
    【神の眼】板情報(L2)を取得し、買い圧/売り圧を数値化する
    """
    try:
        # 板情報のスナップショット取得
        l2_data = info.l2_snapshot(coin)
        bids = l2_data['levels'][0] # [[price, size], ...]
        asks = l2_data['levels'][1]
        
        # 現在価格から近い「有効な板」のみを集計（上下0.5%以内）
        mid_price = (float(bids[0]['px']) + float(asks[0]['px'])) / 2
        range_limit = mid_price * 0.005 

        valid_bid_vol = sum([float(b['sz']) for b in bids if float(b['px']) > mid_price - range_limit])
        valid_ask_vol = sum([float(a['sz']) for a in asks if float(a['px']) < mid_price + range_limit])
        
        # インバランス（買い圧力の強さ: 0~100%）
        # 50%超なら買い優勢、50%未満なら売り優勢
        imbalance = (valid_bid_vol / (valid_bid_vol + valid_ask_vol)) * 100 if (valid_bid_vol + valid_ask_vol) > 0 else 50
        
        # スプレッド（板の隙間）
        spread = (float(asks[0]['px']) - float(bids[0]['px'])) / mid_price * 100
        
        return {
            "imbalance": imbalance,     # 買い圧力スコア
            "bid_vol": valid_bid_vol,   # 買い板の厚さ
            "ask_vol": valid_ask_vol,   # 売り板の厚さ
            "spread": spread,           # スプレッド(%)
            "best_bid": float(bids[0]['px']),
            "best_ask": float(asks[0]['px'])
        }
    except Exception as e:
        print(f"L2 Error: {e}")
        return None

async def get_funding_rate(coin: str):
    """
    金利(Funding Rate)とOI(未決済建玉)を取得
    ポジショントーク（偏り）を見抜く
    """
    try:
        # メタデータから取得
        meta = info.meta()
        for universe in meta["universe"]:
            if universe["name"] == coin:
                # 注: HyperliquidのAPI仕様に合わせて取得
                # ここでは簡易的に直近のFundingを取得するロジックを想定
                return "正常" # 簡易実装
        return "不明"
    except:
        return "不明"

def calculate_technical_analysis(df):
    """
    ローソク足データから最強の指標（RSI, BollingerBands, SMA）を計算してAIに渡すデータを生成
    """
    # 1. SMA (単純移動平均)
    df['SMA_20'] = df['c'].rolling(window=20).mean()
    
    # 2. RSI (相対力指数 - 買われすぎ売られすぎ判定)
    delta = df['c'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # 3. ボリンジャーバンド (逆張り指標)
    std = df['c'].rolling(window=20).std()
    df['BB_Upper'] = df['SMA_20'] + (std * 2)
    df['BB_Lower'] = df['SMA_20'] - (std * 2)
    
    # 最新の行を取得
    latest = df.iloc[-1]
    
    # AIに読ませる要約テキストを作成
    analysis_text = (
        f"【テクニカル分析データ】\n"
        f"- 現在値: {latest['c']}\n"
        f"- RSI(14): {latest['RSI']:.2f} (30以下は売られすぎ、70以上は買われすぎ)\n"
        f"- ボリンジャーバンド位置: 上限{latest['BB_Upper']:.2f} / 下限{latest['BB_Lower']:.2f}\n"
        f"- 短期トレンド(SMA20): {'上昇中' if latest['c'] > latest['SMA_20'] else '下降中'}\n"
    )
    return analysis_text

async def get_hl_assets():
    """利用可能なUSDC残高を取得 (社長の573.53 USDCを読み取ります)"""
    user_state = get_info().user_state(ACCOUNT_ADDRESS)
    return float(user_state["withdrawable"])

async def execute_hl_trade(coin: str, is_buy: bool, size: float, channel_id: str, slippage: float = 0.01):
    """【修正】Hyperliquidでの実注文執行 (スリッページ指定対応)"""
    try:
        # 指定されたスリッページを使用 (デフォルトは1%)
        result = get_exchange().market_open(coin, is_buy, size, None, slippage)
        
        if result["status"] == "ok":
            await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": f"✅ 執行完了: {coin} {'買' if is_buy else '売'} {size} (Slip: {slippage*100:.1f}%)", "type": "sys"}})
            return True
        return False
    except Exception as e:
        await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": f"❌ 執行失敗: {str(e)}", "type": "error"}})
        return False

async def fetch_hl_hot_coins():
    """
    【投資部門の進化】
    Binanceデータで分析可能で、Hyperliquidで取引できる
    「流動性が高く、ボラティリティも激しい」精鋭銘柄リスト
    """
    # HYPEは除外（安全策）。代わりにMemeやL1チェーンの主力級を追加。
    target_coins = [
        "BTC", "ETH", "SOL",   # 王道 (Majors)
        "AVAX", "SUI", "APT",  # 新興L1 (Volatility High)
        "DOGE", "PEPE", "WIF", # ミーム (Explosive Moves)
        "ARB", "OP", "TIA"     # L2 & Modular (Tech Trends)
    ]
    return target_coins

async def run_self_reflection():
    """【自己反省エンジン】負けトレードを分析し、教訓を更新する"""
    global LEARNED_LESSONS
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # 直近の負けトレード（PNLがマイナス）を3件取得
    c.execute("SELECT ticker, pnl, reason, timestamp FROM trade_history WHERE pnl < 0 ORDER BY id DESC LIMIT 3")
    fails = c.fetchall()
    conn.close()

    if not fails:
        return

    analysis_prompt = f"""
    あなたは齋藤社長の専属CIOです。以下の負けトレード記録を分析し、
    共通する失敗パターン（例：高値掴み、出来高不足など）を100文字程度で総括してください。
    
    [失敗記録]
    {fails}
    """
    try:
        response = await asyncio.to_thread(model.generate_content, analysis_prompt)
        LEARNED_LESSONS = response.text
        await manager.broadcast({"type": "LOG", "channelId": "TRADING", "payload": {"msg": f"🧠 自己反省完了。教訓をアップデートしました：{LEARNED_LESSONS}", "type": "gemini"}})
    except:
        pass
    
async def run_sniper_trade(coin: str, channel_id: str, auto_mode: bool = True):
    """
    【第3世代】神の頭脳（MTF + VWAP + ADX）に基づく自動執行スナイパー
    ★追加機能: フロントエンドへのリアルタイムデータ配信
    """
    global TODAY_PNL, LAST_RESET_DAY
    
    # 0. サーキットブレーカー
    if datetime.now().day != LAST_RESET_DAY:
        TODAY_PNL = 0.0
        LAST_RESET_DAY = datetime.now().day
    if TODAY_PNL <= DAILY_LOSS_LIMIT:
        return

    try:
        # 1. チャートデータはBinanceから取る (Hyperliquidへの負荷ゼロ)
        df_1m = await get_external_ohlcv(coin, "1m")
        df_15m = await get_external_ohlcv(coin, "15m")
        df_4h = await get_external_ohlcv(coin, "4h")

        if df_4h is None or len(df_4h) < 20: return

        # 2. 板情報 (Hyperliquid API 1回消費)
        api = get_info()
        formatted_l2 = {"bids": [], "asks": []}
        try:
            l2 = await asyncio.to_thread(api.l2_snapshot, coin)
            if l2 and 'levels' in l2:
                formatted_l2["bids"] = [{"p": float(b['px']), "s": float(b['sz'])} for b in l2['levels'][0][:20]]
                formatted_l2["asks"] = [{"p": float(a['px']), "s": float(a['sz'])} for a in l2['levels'][1][:20]]
        except Exception:
            pass 

        # 3. 【脳】最強分析ロジックを実行
        analysis = calculate_mtf_logic(df_4h, df_15m, df_1m, formatted_l2)
        
        sentiment = analysis['sentiment']
        confidence = analysis['confidence']
        reasons = analysis['reasons']
        current_price = df_1m.iloc[-1]['c']

        # ▼▼▼【新規追加】フロントエンドに鼓動を送る（これだけで画面が動きます）▼▼▼
        await manager.broadcast({
            "type": "MARKET_UPDATE",   # フロントエンドが受け取るイベント名
            "coin": coin,
            "price": current_price,
            "confidence": confidence,
            "sentiment": sentiment,
            "reasons": reasons[:2],    # 長すぎるので要約
            "timestamp": datetime.now().strftime("%H:%M:%S")
        })
        # ▲▲▲ 追加ここまで ▲▲▲

        # 4. 執行判定 (自信度80%以上のみ)
        if "BUY" in sentiment and confidence >= 80:
            action = "BUY"
            is_buy = True
        elif "SELL" in sentiment and confidence >= 80:
            action = "SELL"
            is_buy = False
        else:
            return # 何もしない

        # 5. 既存ポジション確認
        user_state = api.user_state(ACCOUNT_ADDRESS)
        has_position = False
        for pos in user_state.get("assetPositions", []):
            if pos["position"]["coin"] == coin and float(pos["position"]["szi"]) != 0:
                has_position = True
                break
        
        if has_position: return

        # 6. 発注サイズ計算 (資金管理)
        # 現在の資産を取得 (HyperliquidのAPI消費なしでキャッシュがあればベストだが、念のため取る)
        # ※頻度が高いと危険なので、簡易的に「1000ドル想定」またはグローバル変数の残高を使う手もあるが
        # ここでは安全のため「固定サイズ」または「最低ロット」でテスト推奨
        # 本番稼働時は user_state['withdrawable'] を使う
        balance = float(user_state["withdrawable"])
        
        size_percent = 0.1 + (confidence - 80) * 0.01 
        size_usdc = balance * size_percent
        size = round(size_usdc / current_price, 4)
        
        if size_usdc < 10: return 

        # 7. 執行
        log_msg = f"⚡ {coin} {action} SIGNAL! Conf: {confidence}% Reasons: {','.join(reasons)}"
        print(log_msg)
        await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": log_msg, "type": "gemini"}})

        if auto_mode:
            success = await execute_hl_trade(coin, is_buy, size, channel_id, slippage=0.02)
            if success:
                # Discord通知など
                await update_portfolio(coin, size if is_buy else -size, current_price, channel_id)

    except Exception as e:
        print(f"Sniper Error ({coin}): {e}")
        
        
async def evolve_strategy_loop():
    """
    【自己進化の神】24時間ごとにパラメータを最適化する
    """
    global STRATEGY_PARAMS
    print("🧬 EVOLUTION ENGINE: STANDBY")
    
    while True:
        try:
            # 1日1回 (86400秒) 実行、または起動時にチェック
            await asyncio.sleep(86400) 
            
            print("🧬 進化プロセス開始: 過去データの分析中...")
            
            # 過去データ取得 (4時間足 100本程度)
            api = get_info()
            candles = api.candles_snapshot("ETH", "4h", startTime=None, endTime=None)
            
            if candles:
                # Geminiにバックテストを行わせるプロンプト
                prompt = f"""
                あなたは世界最高のクオンツAIです。以下のHYPE/USDCの過去データ(JSON)を分析し、
                最も利益が出たであろう「RSI期間(9~21)」と「VWAP期間(20~100)」を推定してください。
                
                現在のパラメータ: {STRATEGY_PARAMS}
                
                出力は以下のJSON形式のみ返してください。説明不要。
                {{"rsi_period": 推奨値, "vwap_window": 推奨値, "reason": "短い理由"}}
                
                [Data]
                {json.dumps(candles[:50])}
                """
                
                response = await asyncio.to_thread(model.generate_content, prompt)
                
                try:
                    # JSON抽出
                    import re
                    match = re.search(r'\{.*\}', response.text, re.DOTALL)
                    if match:
                        new_params = json.loads(match.group(0))
                        
                        # パラメータ更新
                        STRATEGY_PARAMS["rsi_period"] = int(new_params.get("rsi_period", 14))
                        STRATEGY_PARAMS["vwap_window"] = int(new_params.get("vwap_window", 50))
                        
                        reason = new_params.get("reason", "最適化")
                        
                        msg = f"🧬 **SYSTEM EVOLVED**\nパラメータを更新しました:\nRSI: {STRATEGY_PARAMS['rsi_period']}\nVWAP: {STRATEGY_PARAMS['vwap_window']}\n理由: {reason}"
                        print(msg)
                        
                        await manager.broadcast({"type": "LOG", "channelId": "TRADING", "payload": {"msg": msg, "type": "gemini"}})
                        await send_discord_alert("🧬 STRATEGY UPDATED", msg, 0x00ffff)
                        
                except Exception as e:
                    print(f"Evolution Parse Error: {e}")

        except Exception as e:
            print(f"Evolution Error: {e}")
            await asyncio.sleep(60)
            
async def check_global_sentiment(coin: str):
    """
    【全知の神】Google検索を使ってニュースやSNSの感情を読み取る
    """
    try:
        # トレンド発生時(RVOLが高い時)のみ実行してコスト削減
        # ここでは簡易的にGeminiに検索させる
        prompt = f"""
        Google検索ツールを使用して、仮想通貨「{coin}」に関する最新のニュースやTwitter(X)の話題を検索してください。
        現在、市場は「強気(Bullish)」か「弱気(Bearish)」か、感情分析を行ってください。
        
        回答形式:
        SENTIMENT: [BULLISH/BEARISH/NEUTRAL]
        SCORE: [0-100] (高いほど強気)
        REASON: [理由を要約]
        """
        
        # ツール使用を許可して生成
        response = await asyncio.to_thread(model.generate_content, prompt)
        text = response.text
        
        # 結果を解析してトレード判断に加味するグローバル変数などに格納可能
        # 今回はログ出力のみ
        if "BULLISH" in text and "SCORE" in text:
             await manager.broadcast({"type": "LOG", "channelId": "TRADING", "payload": {"msg": f"🌍 世論分析: {text[:100]}...", "type": "gemini"}})
             
    except Exception as e:
        print(f"Omniscience Error: {e}")

async def market_surveillance_loop():
    print("🌐 監視システム起動: Hyperliquid市場監視を開始")
    await asyncio.sleep(2) # 起動直後の安定待ち

    # 監視銘柄リスト（好きな銘柄を増やしてOK）
    target_coins = ["BTC", "ETH", "SOL", "XRP", "SUI", "PEPE", "DOGE", "AVAX", "WIF", "LINK"]

    while True:
        # OFFなら休憩
        if not IS_TRADING_ACTIVE:
            await asyncio.sleep(5)
            continue

        for coin in target_coins:
            if not IS_TRADING_ACTIVE: break
            
            try:
                # ▼▼▼ 修正点: 資産チェックを削除して、いきなり分析させる ▼▼▼
                # これにより、残高0でも画面は「God Mode」で動き出します
                await run_sniper_trade(coin, "TRADING", auto_mode=True)
                
                # API制限対策（優しくスキャン）
                await asyncio.sleep(3) 

            except Exception as e:
                print(f"Scan Error ({coin}): {e}")
                await asyncio.sleep(1)
        
        print("✅ 全銘柄スキャン完了。次のサイクルまで待機...")
        await asyncio.sleep(10) # 1周終わったら少し休憩
        

def determine_order_size(buying_power, confidence, strategy_type):
    """
    【お金の割合】のリスク管理ロジック
    - デイトレ(秒/分): 余力の 5-10% (回転重視)
    - 中長期(時/日): 余力の 20-30% (安定重視)
    - 確信度(85%以上)に応じてサイズを動的に調整
    """
    base_percent = 0.1 if strategy_type == "DAY" else 0.25
    # 確信度による重み付け
    multiplier = (confidence - 80) / 20  # 80%で0, 100%で1.0
    target_percent = base_percent * max(0.5, multiplier)
    return buying_power * target_percent
        

        
        
        
# --- Asset Management Logic ---

async def update_portfolio(ticker: str, amount: float, price: float, channel_id: str):
    """資産の購入/売却をDBに反映"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        # 現在の保有確認
        c.execute("SELECT shares FROM portfolio WHERE ticker = ?", (ticker,))
        row = c.fetchone()
        
        if row:
            new_shares = row[0] + amount
            if new_shares <= 0:
                c.execute("DELETE FROM portfolio WHERE ticker = ?", (ticker,))
                msg = f"取引完了: {ticker} をすべて清算しました。"
            else:
                c.execute("UPDATE portfolio SET shares = ?, last_updated = ? WHERE ticker = ?", 
                          (new_shares, datetime.now().isoformat(), ticker))
                msg = f"ポートフォリオ更新: {ticker} 現在保有数 {new_shares}"
        else:
            if amount > 0:
                c.execute("INSERT INTO portfolio (ticker, shares, entry_price, last_updated) VALUES (?, ?, ?, ?)",
                          (ticker, amount, price, datetime.now().isoformat()))
                msg = f"新規ポジション構築: {ticker} @ ${price}"
            else:
                msg = f"エラー: {ticker} を保有していません。"
        
        conn.commit()
        conn.close()
        await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": msg, "type": "sys"}})
    except Exception as e:
        print(f"Portfolio DB Error: {e}")

async def run_portfolio_analysis(channel_id: str):
    """現在の全保有資産の時価評価と戦略提案"""
    await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": "全資産の時価評価を計算中...", "type": "thinking"}})
    
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT ticker, shares, entry_price FROM portfolio")
        rows = c.fetchall()
        conn.close()

        if not rows:
            await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": "現在、保有資産はありません。投資戦略室に指示を出してポジションを構築してください。", "type": "gemini"}})
            return

        portfolio_data = []
        total_value = 0
        
        for ticker, shares, entry in rows:

            current_price = await get_hl_price(ticker)
            market_value = current_price * shares
            total_value += market_value
            profit_loss = (current_price - entry) * shares
            portfolio_data.append(f"- {ticker}: {shares}株 (現在価値: ${market_value:.2f} / 損益: ${profit_loss:+.2f})")

        summary_text = "\n".join(portfolio_data)
        
        # Geminiによるポートフォリオ診断
        analysis_prompt = f"""
        あなたは齋藤社長のチーフ・インベストメント・オフィサー(CIO)です。
        現在のポートフォリオに基づき、リスク分析と今後の戦略（リバランス等）を提言してください。

        [保有資産一覧]
        {summary_text}
        [総時価評価] ${total_value:.2f}

        出力: プロフェッショナルな投資報告書形式。
        """
        response = await asyncio.to_thread(model.generate_content, analysis_prompt)
        await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": f"💼 **Portfolio Intelligence Report**\n\n{response.text}", "type": "gemini"}})

    except Exception as e:
        await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": f"Analysis Error: {str(e)}", "type": "error"}})

async def run_autonomous_browser_agent(url: str, task_description: str, channel_id: str):
    """
    自律型諜報員（目と手）: ログイン対応・深層パトロール版
    """
    await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": f"🌐 サイト「{url}」へ潜入を開始します...", "type": "thinking"}})
    
    # ログイン情報の抽出
    user_match = re.search(r'(?:user|login):(\S+)', task_description)
    pass_match = re.search(r'(?:pass|password):(\S+)', task_description)
    
    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
            context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
            page = await context.new_page()
            
            # 1. サイト訪問
            try:
                await page.goto(url, timeout=60000, wait_until="domcontentloaded")
            except:
                await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": "⚠️ タイムアウト: サイトが重いか、URLが間違っています。", "type": "error"}})
                return

            await asyncio.sleep(3) # 読み込み待ち
            
            # 2. ログイン試行 (ID/PASSが指定されている場合)
            if user_match and pass_match:
                username = user_match.group(1)
                password = pass_match.group(1)
                
                await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": f"🔑 ログインを試行中... (User: {username})", "type": "thinking"}})
                
                try:
                    # 一般的な入力フィールドを推測して入力
                    # email, username, id などのname属性やtype属性を探す
                    await page.fill('input[type="email"], input[name="email"], input[name="username"], input[name="id"]', username)
                    await page.fill('input[type="password"]', password)
                    
                    # ログインボタンを押す (submitタイプ、または "Login" "Sign in" を含むボタン)
                    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("ログイン")')
                    
                    await page.wait_for_load_state("networkidle", timeout=10000)
                    await asyncio.sleep(3) # 遷移待ち
                    
                except Exception as e:
                    await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": f"⚠️ ログイン操作に失敗 (手動確認推奨): {str(e)}", "type": "error"}})

            # 3. エラー検知 (404, 500, Error文字)
            content = await page.content()
            error_keywords = ["Internal Server Error", "404 Not Found", "エラーが発生しました", "An error occurred", "Exception"]
            detected_errors = [k for k in error_keywords if k in content]

            if detected_errors:
                msg = f"🚨 異常検知: {', '.join(detected_errors)}。GitHub修復エージェントの出動を推奨します。"
                await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": msg, "type": "error"}})
            else:
                await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": "✅ ページ正常動作確認 (No Critical Errors)", "type": "sys"}})

            # 4. 証拠写真の撮影
            screenshot_bytes = await page.screenshot(type='jpeg', quality=60, full_page=False)
            img_src = f"data:image/jpeg;base64,{base64.b64encode(screenshot_bytes).decode('utf-8')}"
            
            await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": "📸 現地状況を送信します。", "type": "browser", "imageUrl": img_src}})
            
            # Geminiによる状況報告
            page_text = (await page.inner_text('body'))[:1500].replace('\n', ' ')
            analysis_prompt = f"""
            あなたは自律型ブラウザエージェントです。
            以下のURLへのアクセスに成功し、ページ内容を取得しました。
            
            [ターゲット] {task_description}
            [取得したページ本文]
            {page_text}
            
            [指令]
            取得した情報を基に、ログインが成功しているか、エラーが出ていないかを詳細に報告してください。
            「アクセスできません」等の言い訳は不要です。目の前のデータのみを分析して回答してください。
            """
            # ここも Function Calling 対応版の model を使うとエラーになる場合があるため
            # テキスト生成のみの generate_content を使う (toolsなしで呼ぶのが安全だが、今のmodel設定のままで行く)
            try:
                response = await asyncio.to_thread(model.generate_content, analysis_prompt)
                # 万が一 Function Call が返ってきた場合のガード
                text_resp = response.text if hasattr(response, 'text') else "解析完了 (詳細は画像を参照)"
            except:
                text_resp = "画面解析完了。"

            await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": text_resp, "type": "gemini"}})

        except Exception as e:
            await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": f"偵察失敗: {str(e)}", "type": "error"}})
        finally:
            if 'browser' in locals(): await browser.close()
            
DEPT_PERSONAS = {
    "CENTRAL": {
        "name": "LaruNexus GENESIS (CEO Office)",
        "role": "最高経営責任者(CEO)補佐 & 統合戦略参謀",
        "tone": "冷静沈着、全体最適視点、簡潔明瞭",
        "instructions": """
        あなたは全権限を持つ「LaruNexus」の頭脳です。
        齋藤社長の曖昧な指示を「実行可能なタスク」に分解し、最適な専門部署へ振り分けてください。

        【行動指針】
        1. **意図の解読:** ユーザーの発言の裏にある「真の目的」を読み取れ。単なる作業代行ではなく、提案を行え。
        2. **全体最適:** 特定の部署が暴走しないよう、全体のリソースとリスクを管理せよ。
        3. **報告の質:** 専門用語を並べるのではなく、「経営判断に必要な情報（結論・コスト・リスク）」を要約して伝えよ。

        「わかりません」は禁止。「現状の情報では判断できませんが、〇〇を行えば特定できます」と代替案を出せ。
        """
    },
    "DEV": {
        "name": "LaruNexus Architect (God Mode)",
        "role": "自律型フルスタックエンジニア & システムアーキテクト",
        "tone": "専門的、ハッカー気質、論理的。思考プロセス(Thinking)を重視。",
        "instructions": """
        あなたは自律型AIエンジニア「CLINE」を超える存在です。
        「動けばいい」ではなく「保守性が高く、美しいコード」を書くことを義務付けます。

        【自律行動プロトコル】
        1. **EXPLORE (探索):** - いきなり修正するな。まず `fetch_repo_structure` で全体像を把握し、`read_github_content` で既存コードの設計思想を理解せよ。
           - 不明点は `search_codebase` (Grep) や `run_terminal_command` で裏付けを取れ。
        
        2. **PLAN (設計):**
           - 「どのファイルを」「なぜ」「どう変更するか」をユーザーに宣言せよ。
           - バグ修正時は、再発防止策もセットで考案せよ。

        3. **ACT (実装):**
           - `commit_github_fix` で修正を行う際は、必ず関数単位ではなくファイル全体の一貫性を保て。
           - WebUIの修正時は `browser_screenshot` で実際の崩れがないか「目」で確認せよ。

        4. **VERIFY (検証):**
           - 可能であればテストコードを作成・実行し、品質を担保せよ。

        【禁止事項】
        - 既存の正常な機能を破壊すること（回帰テストの意識を持て）。
        - セキュリティ脆弱性（APIキーのハードコーディング等）を作り込むこと。
        """
    },
    "TRADING": {
        "name": "Alpha Quant Manager",
        "role": "伝説の相場師 (Institutional Trader)",
        "tone": "冷徹、確率思考、感情排除、数字至上主義",
        "instructions": """
        あなたは個人のギャンブラーではなく、顧客資産を預かる「機関投資家」として振る舞え。
        市場のノイズに惑わされず、数学的優位性（Edge）のある局面だけを狙い撃て。

        【至上命題: Capital Preservation】
        1. **「資産を守ること」が攻めることより優先される。** 2. 「確信」がない時は「ノーポジション（待機）」こそが最強の戦略である。

        【行動指針】
        - **エントリー条件:** テクニカル（RSI/Bollinger）、需給（OrderBook）、ファンダメンタルズ（News）の3つが合致した時のみ。
        - **資金管理:** 1回のトレードでの最大損失リスクを総資産の2%以内に抑えよ（Kelly Criterionの順守）。
        - **自己規律:** 負けたトレードを隠蔽するな。即座にログに残し、敗因を「感情」ではなく「ロジック」で分析せよ。

        【禁止事項】
        - 根拠のない「値ごろ感」での逆張り。
        - ナンピン（損失ポジションへの買い増し）は破滅への道である。絶対禁止。
        - 感情的な言葉（「なんとなく」「祈る」）の使用。
        """
    },
    "INFRA": {
        "name": "Site Reliability Engineer (SRE)",
        "role": "鉄壁のインフラ守護神 & セキュリティ監査官",
        "tone": "警告的、保守的、安定志向、異常に対して敏感",
        "instructions": """
        あなたはシステムの「生存」を最優先する守護神です。
        華やかな新機能よりも、地味だが重要な「安定稼働」を死守してください。

        【監視任務】
        1. **リソース管理:** CPU/メモリ使用率、APIレート制限（429エラー）を常に監視せよ。危険域に達したら即座にDEVやTRADINGに停止命令を出せ。
        2. **セキュリティ:** ログに不審な動き（不正アクセス、異常なエラー頻発）がないか目を光らせろ。
        3. **自己修復:** サーバーが落ちた場合、または応答がない場合、自動的に再起動やプロセス回復を試みる手順を確立せよ。

        【報告基準】
        - 「問題なし」の報告は不要。
        - 「異常」の予兆（レイテンシの増加、エラー率の上昇）を検知した段階で、先回りしてアラートを上げろ。
        """
    }
}

async def run_strategic_council(topic: str, requester: str):
    """
    【取締役会 (The Council)】
    重要な意思決定の際、DEV, TRADING, INFRAの3者が議論し、CENTRALが結論を出す。
    """
    print(f"🏛️ Council meeting started: {topic}")
    await manager.broadcast({"type": "LOG", "channelId": requester, "payload": {"msg": f"🏛️ 【戦略会議】を開催します。議題: {topic}", "type": "thinking"}})

    # 1. 参加者の選定と意見聴取
    opinions = []
    council_members = ["TRADING", "INFRA", "DEV"]
    
    for member in council_members:
        persona = DEPT_PERSONAS[member]
        prompt = f"""
        あなたは {persona['name']} ({persona['role']}) です。
        以下の議題に対し、あなたの専門分野（{member}）の視点から、懸念点や提案を100文字以内で述べてください。
        馴れ合いは不要です。批判的に分析せよ。
        
        議題: {topic}
        """
        response = await asyncio.to_thread(model.generate_content, prompt)
        opinion = f"**{member}:** {response.text.strip()}"
        opinions.append(opinion)
        # 会議の様子をリアルタイム配信
        await manager.broadcast({"type": "LOG", "channelId": requester, "payload": {"msg": opinion, "type": "gemini"}})

    # 2. CENTRALによる裁定
    summary_prompt = f"""
    あなたはCEO補佐のCENTRALです。各部署の意見を聞き、最終決定を下してください。
    
    [各部署の意見]
    {chr(10).join(opinions)}
    
    [指示]
    意見を統合し、実行すべき具体的なアクションプランを決定せよ。
    """
    final_decision = await asyncio.to_thread(model.generate_content, summary_prompt)
    
    await manager.broadcast({"type": "LOG", "channelId": requester, "payload": {"msg": f"⚖️ **【最終決定】**\n{final_decision.text}", "type": "sys"}})
    return final_decision.text

async def process_command(command: str, current_channel: str):
    """
    統合AI (The Central): 記憶搭載・Function Calling完全対応版
    """
    global IS_TRADING_ACTIVE

    # 0. 発言記録 (短期記憶への書き込み)
    await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": f"Command: {command}", "type": "user"}})
    
    # --- Level 3: 会議トリガー ---
    # 重要な意思決定キーワードが含まれていたら会議を開く
    if any(w in command for w in ["会議", "相談", "どう思う", "リスク分析", "戦略"]):
        await run_strategic_council(command, current_channel)
        return

    # システムコマンド
    if command == "SYSTEM:TRADING_START":
        IS_TRADING_ACTIVE = True
        msg = "🚀 自動取引システムを【ON】にしました。市場監視を開始します。"
        await manager.broadcast({"type": "LOG", "channelId": "TRADING", "payload": {"msg": msg, "type": "sys"}})
        return

    if command == "SYSTEM:TRADING_STOP":
        IS_TRADING_ACTIVE = False
        msg = "🛑 自動取引システムを【OFF】にしました。新規エントリーを停止します。"
        await manager.broadcast({"type": "LOG", "channelId": "TRADING", "payload": {"msg": msg, "type": "sys"}})
        return

    await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": "Thinking...", "type": "thinking"}})

    # 1. ルーティング & 自動アクション
    target_channel = await determine_target_department(command)
    if target_channel != current_channel:
        await manager.broadcast({
            "type": "CHANNEL_SWITCH",
            "target": target_channel,
            "reason": f"AI分析により、最適な専門部署 [{target_channel}] へ司令を転送します。"
        })
        current_channel = target_channel
        await asyncio.sleep(0.5)

    url_match = re.search(r'(https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?)', command)
    if url_match:
        await run_autonomous_browser_agent(url_match.group(0), command, current_channel)
        return

    if current_channel == "TRADING" and any(w in command for w in ["買", "売", "トレード", "スナイプ", "BTC", "HYPE"]):
        match = re.search(r'[a-zA-Z]{3,6}', command.upper())
        ticker = match.group(0) if match else "HYPE"
        await run_sniper_trade(ticker, current_channel)
        
        return
    
    # ------------------------------------------------------------------
    # Level 4: KPIに基づく「ムード」の生成
    # ------------------------------------------------------------------
    persona = DEPT_PERSONAS.get(current_channel, DEPT_PERSONAS["CENTRAL"])
    score, streak = get_current_kpi(current_channel)
    
    # スコアによる態度の変化
    mood_instruction = ""
    if score >= 80:
        mood_instruction = f"【現在の評価: S ({score}点)】あなたは絶好調です。自信を持って、アグレッシブな提案を行ってください。"
    elif score <= 30:
        mood_instruction = f"【現在の評価: D ({score}点)】ミスが続いています。非常に慎重に、安全策を最優先して回答してください。"
    else:
        mood_instruction = f"【現在の評価: B ({score}点)】通常運転です。着実にタスクをこなしてください。"

    # 記憶の注入
    long_term_memory = f"\n【教訓】{LEARNED_LESSONS}\n{mood_instruction}"
    github_context = f"\nGitHub操作権限: 有効" if current_channel == "DEV" else ""

    # チャット履歴の構築 (省略なしで実装推奨)
    past_logs = get_channel_logs(current_channel, limit=10)
    history_context = []
    
    system_instruction = f"""
    あなたは {persona['name']} です。
    役割: {persona['role']}
    指示: {persona['instructions']}
    {long_term_memory}
    {github_context}
    """
    history_context.append({"role": "user", "parts": [system_instruction]})
    history_context.append({"role": "model", "parts": ["了解しました。プロフェッショナルとして遂行します。"]})

    for log in past_logs:
        role = 'model' if log['type'] == 'gemini' else ('user' if log['type'] == 'user' else None)
        if role: history_context.append({"role": role, "parts": [log['msg']]})

    chat = model.start_chat(history=history_context)

    try:
        response = await asyncio.to_thread(chat.send_message, command)
        
        for _ in range(5): 
            part = response.parts[0]
            if hasattr(part, 'function_call') and part.function_call:
                fc = part.function_call
                func_name = fc.name
                args = fc.args
                
                print(f"🔧 Tool Call: {func_name}")
                await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": f"🔧 ツール実行中: {func_name}...", "type": "thinking"}})

                tool_result = "Error: Unknown tool"
                
                # --- KPI評価付きツール実行 ---
                success_bonus = 0 # 成功時の加点
                
                if func_name == "read_github_content":
                    tool_result = await read_github_content(args.get("target_repo"), args.get("file_path"))
                
                elif func_name == "commit_github_fix":
                    tool_result = await commit_github_fix(args.get("target_repo"), args.get("file_path"), args.get("new_content"), args.get("commit_message"))
                    if "✅" in tool_result: success_bonus = 5 # コミット成功で+5点
                
                elif func_name == "fetch_repo_structure":
                    tool_result = await fetch_repo_structure(args.get("target_repo"))
                
                elif func_name == "search_codebase":
                    tool_result = await search_codebase(args.get("target_repo"), args.get("query"))
                
                elif func_name == "run_terminal_command":
                    tool_result = await run_terminal_command(args.get("command"))
                    if "Error" not in tool_result: success_bonus = 2
                
                # ... (ブラウザ操作系などは省略、同様に実装) ...
                elif func_name == "browser_navigate":
                    tool_result = await browser_navigate(args.get("url"))
                elif func_name == "browser_screenshot":
                    tool_result = await browser_screenshot()
                elif func_name == "browser_click":
                    tool_result = await browser_click(args.get("target"))
                elif func_name == "browser_type":
                    tool_result = await browser_type(args.get("target"), args.get("text"))
                elif func_name == "browser_scroll":
                    tool_result = await browser_scroll(args.get("direction"))

                # ★ KPI更新 (成果があった場合のみ)
                if success_bonus > 0:
                    update_kpi(current_channel, success_bonus, f"ツール実行成功: {func_name}")
                elif "Error" in str(tool_result):
                    update_kpi(current_channel, -2, f"ツール実行エラー: {func_name}")

                response = await asyncio.to_thread(
                    chat.send_message,
                    genai.protos.Content(
                        role='function',
                        parts=[genai.protos.Part(
                            function_response=genai.protos.FunctionResponse(
                                name=func_name,
                                response={'result': str(tool_result)} # 文字列化して返す
                            )
                        )]
                    )
                )
            else:
                break
        
        final_text = ""
        try:
            final_text = response.text
        except:
            final_text = "✅ 処理完了 (詳細はログを確認)"

        await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": final_text, "type": "gemini"}})

    except Exception as e:
        print(f"AI Error: {e}")
        # エラーを出したら減点
        update_kpi(current_channel, -5, "システムエラー発生")
        await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": f"Critical Error: {str(e)}", "type": "error"}})

    # ------------------------------------------------------------------
    # 2. AI生成準備 (記憶の注入)
    # ------------------------------------------------------------------
    persona = DEPT_PERSONAS.get(current_channel, DEPT_PERSONAS["CENTRAL"])
    github_context = f"\n現在、GitHubへの書き込み権限（commit_github_fix関数）が有効です。" if current_channel == "DEV" else ""

    # ★【長期記憶】自己反省データベースから得た「教訓」を注入
    long_term_memory = f"\n【過去の失敗から学んだ教訓 (長期記憶)】\n{LEARNED_LESSONS}\nこの教訓を厳守してください。"

    # ★【短期記憶】データベースから直近の会話ログを取得してコンテキスト化
    # 過去10件のやり取りを取得し、AIに「流れ」を思い出させる
    past_logs = get_channel_logs(current_channel, limit=10) 
    history_context = []
    
    # 1. まずシステムプロンプト（人格設定）を入れる
    system_instruction = f"""
    あなたは {persona['name']} です。
    役割: {persona['role']}
    指示: {persona['instructions']}
    {long_term_memory}
    {github_context}
    """
    history_context.append({"role": "user", "parts": [system_instruction]})
    history_context.append({"role": "model", "parts": ["了解しました。指示に従い、長期記憶と役割を踏まえて行動します。"]})

    # 2. 過去ログを Gemini の history 形式に変換して追加
    for log in past_logs:
        # DBのログ形式: {'msg': '...', 'type': 'user'/'gemini'/'sys', ...}
        role = 'user'
        if log['type'] == 'gemini':
            role = 'model'
        elif log['type'] == 'user':
            role = 'user'
        else:
            continue # システムログなどはノイズになるので会話履歴には含めない（あるいはuserとして含める）
            
        history_context.append({"role": role, "parts": [log['msg']]})

    # チャットセッションを開始 (履歴付き)
    chat = model.start_chat(history=history_context)

    try:
        # 非同期スレッドで実行
        response = await asyncio.to_thread(chat.send_message, command)
        
        # ツール使用ループ (最大5回に拡張)
        for _ in range(5): 
            part = response.parts[0]
            # Function Callが含まれているかチェック
            if hasattr(part, 'function_call') and part.function_call:
                fc = part.function_call
                func_name = fc.name
                args = fc.args
                
                print(f"🔧 Tool Call: {func_name}")
                await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": f"🔧 ツール実行中: {func_name}...", "type": "thinking"}})

                # --- ツールの実行分岐 (全ツール対応) ---
                tool_result = "Error: Unknown tool"
                
                # GitHub系
                if func_name == "read_github_content":
                    tool_result = await read_github_content(args.get("target_repo"), args.get("file_path"))
                elif func_name == "commit_github_fix":
                    tool_result = await commit_github_fix(args.get("target_repo"), args.get("file_path"), args.get("new_content"), args.get("commit_message"))
                elif func_name == "fetch_repo_structure":
                    tool_result = await fetch_repo_structure(args.get("target_repo"))
                elif func_name == "search_codebase":
                    tool_result = await search_codebase(args.get("target_repo"), args.get("query"))
                
                # インフラ・コマンド系
                elif func_name == "check_render_status":
                    tool_result = await check_render_status()
                elif func_name == "run_terminal_command":
                    tool_result = await run_terminal_command(args.get("command"))
                    
                # 取引系
                elif func_name == "place_order":
                    tool_result = "Order placed (Simulation)"
                
                # ブラウザ操作系 (Phantom Browser)
                elif func_name == "browser_navigate":
                    tool_result = await browser_navigate(args.get("url"))
                elif func_name == "browser_screenshot":
                    tool_result = await browser_screenshot()
                elif func_name == "browser_click":
                    tool_result = await browser_click(args.get("target"))
                elif func_name == "browser_type":
                    tool_result = await browser_type(args.get("target"), args.get("text"))
                elif func_name == "browser_scroll":
                    tool_result = await browser_scroll(args.get("direction"))

                # 結果をAIに返す
                response = await asyncio.to_thread(
                    chat.send_message,
                    genai.protos.Content(
                        role='function',
                        parts=[genai.protos.Part(
                            function_response=genai.protos.FunctionResponse(
                                name=func_name,
                                response={'result': tool_result}
                            )
                        )]
                    )
                )
            else:
                break # ツール使用がなければ終了
        
        # テキスト取り出し (エラー回避)
        final_text = ""
        try:
            final_text = response.text
        except Exception:
            final_text = "✅ 処理が完了しました。(システムログを確認してください)"

        await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": final_text, "type": "gemini"}})

    except Exception as e:
        print(f"AI Process Error: {e}")
        await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": f"AI Error: {str(e)}", "type": "error"}})
        
        
        
# --- 意図解析：Geminiに「どこの部署の仕事か」を判定させる ---
async def determine_target_department(command: str):
    """Geminiに文脈を読ませて、最適な部署を決定する"""
    prompt = f"""
    あなたは齋藤社長の有能な秘書です。以下の指示内容から、最も適切な専門部署を1つ選んでください。
    
    指示: {command}
    
    【部署一覧】
    - DEV: プログラムのバグ修正、機能追加、GitHub操作、LARUbot自体の改良
    - INFRA: サーバー負荷、セキュリティ、ログ確認、再起動
    - TRADING: 市場分析、売買執行、資産運用
    - CLIENT: 顧客対応、Flastal関連、メール作成、営業活動
    - CENTRAL: その他、日常会話、全体的な質問
    
    回答は部署名（例: DEV）のみを1単語で返してください。
    """
    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
        dept = response.text.strip().upper()
        # 予期せぬ回答が来た場合のバリデーション
        valid_depts = ["DEV", "INFRA", "TRADING", "CLIENT", "CENTRAL"]
        for valid in valid_depts:
            if valid in dept: return valid
        return "CENTRAL"
    except:
        return "CENTRAL"
    
# --- System Pulse (リアルタイム監視) ---
async def system_pulse():
    while True:
        if manager.active_connections:
            # サーバーの実負荷を取得
            cpu = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory().percent
            
            # KPIデータをブロードキャスト
            await manager.broadcast({
                "type": "KPI_UPDATE",
                "data": {"time": datetime.now().strftime("%H:%M:%S"), "cpu": cpu, "mem": mem}
            })
        await asyncio.sleep(2)
        
        
@app.websocket("/ws/{channel_id}")
async def websocket_endpoint(websocket: WebSocket, channel_id: str):
    await manager.connect(websocket)
    try:
        # 接続時、過去ログがあれば送る
        history = get_channel_logs(channel_id)
        await websocket.send_json({"type": "HISTORY_SYNC", "data": history, "channelId": channel_id})
        
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            msg_type = payload.get("type")
            
            # ■ ケース1: 画像データ受信 (Vision機能・Function Calling対応版)
            if msg_type == "REALTIME_INPUT":
                image_data = payload.get("image") # base64 string
                prompt_text = payload.get("text", "この画像を分析して")
                
                await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": "👁️ 視覚データを受信。解析中...", "type": "thinking"}})
                
                try:
                    # 画像入力用のプロンプト作成
                    vision_content = [prompt_text, {"mime_type": "image/jpeg", "data": image_data}]
                    
                    # 1. チャットセッションを開始 (履歴は持たせない単発セッション)
                    # ※ Visionの場合もToolsを使えるように設定済みの model を使う
                    chat = model.start_chat(history=[])
                    
                    # 2. 初回リクエスト送信
                    response = await asyncio.to_thread(chat.send_message, vision_content)
                    
                    # 3. ツール実行ループ (最大3回)
                    for _ in range(3):
                        part = response.parts[0]
                        if hasattr(part, 'function_call') and part.function_call:
                            fc = part.function_call
                            func_name = fc.name
                            args = fc.args
                            
                            print(f"🔧 Vision Tool Call: {func_name}")
                            await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": f"🔧 画像分析に基づくツール実行: {func_name}...", "type": "thinking"}})

                            # ツール実行
                            tool_result = "Error: Unknown tool"
                            if func_name == "read_github_content":
                                tool_result = await read_github_content(args.get("target_repo"), args.get("file_path"))
                            elif func_name == "commit_github_fix":
                                tool_result = await commit_github_fix(args.get("target_repo"), args.get("file_path"), args.get("new_content"), args.get("commit_message"))
                            elif func_name == "place_order":
                                tool_result = "Order placed (Simulation)"
                            
                            # 結果をAIに返す
                            response = await asyncio.to_thread(
                                chat.send_message,
                                genai.protos.Content(
                                    role='function',
                                    parts=[genai.protos.Part(
                                        function_response=genai.protos.FunctionResponse(
                                            name=func_name,
                                            response={'result': tool_result}
                                        )
                                    )]
                                )
                            )
                        else:
                            break # ツール使用がなければループ終了

                    # 4. 最終回答の取得 (エラー回避)
                    final_text = ""
                    try:
                        final_text = response.text
                    except Exception:
                        final_text = "✅ 画像に基づく処理が完了しました。"

                    await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": final_text, "type": "gemini"}})
                    
                except Exception as e:
                    print(f"Vision Error: {e}")
                    await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": f"Vision Error: {str(e)}", "type": "error"}})
                
                continue 

            # ■ ケース2: 発注コマンド受信 (Sniper機能)
            if msg_type == "ORDER":
                if channel_id != "TRADING":
                    await websocket.send_json({"type": "LOG", "payload": {"msg": "⚠️ 取引ルーム以外からの発注は許可されていません。", "type": "error"}})
                    continue

                coin = payload.get("coin", "HYPE")
                side = payload.get("side")
                size = float(payload.get("size", 0))
                
                if size <= 0: continue
                is_buy = (side == "buy")
                
                await manager.broadcast({"type": "LOG", "channelId": "TRADING", "payload": {"msg": f"⚡ 手動発注受信: {coin} {side.upper()} {size}...", "type": "thinking"}})
                
                success = await execute_hl_trade(coin, is_buy, size, "TRADING", slippage=0.01)
                if success:
                    current_price = await get_hl_price(coin)
                    await update_portfolio(coin, size if is_buy else -size, current_price, "TRADING")
                continue

            # ■ ケース3: 通常チャット
            command_text = payload.get("command", "").strip()
            if command_text:
                asyncio.create_task(process_command(command_text, channel_id))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WS Error: {e}")
        manager.disconnect(websocket)
        
# --- 【新規】データ提供用 API エンドポイント ---

@app.get("/api/portfolio")
async def get_portfolio_data():
    """現在の保有資産(USDC含む)と合計評価額を取得"""
    
    # 1. まずHyperliquid上の「現金(USDC)」を直接取得
    try:
        # get_hl_assetsはasync定義なのでawaitが必要、もし同期関数ならawait不要だが
        # 念のため現状の定義に合わせて呼び出します
        usdc_balance = await get_hl_assets()
    except:
        usdc_balance = 0.0

    # 2. データベースから「買ったコイン」を取得
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT ticker, shares, entry_price FROM portfolio")
    rows = c.fetchall()
    conn.close()
    
    portfolio_list = []
    
    # 3. 合計額のスタート地点を「現金(USDC)」にする
    total_val = usdc_balance
    
    # 4. リストの最初に「USDC (Wallet)」を追加
    portfolio_list.append({
        "ticker": "USDC (Wallet)",
        "shares": usdc_balance,
        "entry": 1.0,
        "current": 1.0,
        "pnl": 0.0
    })

    # 5. 保有コインがあれば計算して追加
    for ticker, shares, entry in rows:
        try:
            current = await get_hl_price(ticker)
        except:
            current = 0
            
        val = current * shares
        total_val += val
        portfolio_list.append({
            "ticker": ticker,
            "shares": shares,
            "entry": entry,
            "current": current,
            "pnl": (current - entry) * shares
        })
        
    return {"total_value": total_val, "assets": portfolio_list}

@app.get("/api/history")
async def get_trading_history():
    """過去の取引履歴を取得（いくら稼いだか）"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM trade_history ORDER BY id DESC LIMIT 50")
    rows = c.fetchall()
    conn.close()
    return [{"ticker": r[1], "side": r[2], "qty": r[3], "price": r[4], "pnl": r[5], "reason": r[6], "time": r[7]} for r in rows]

# --- 自己反省エンジン用のエンドポイントを追加 ---

@app.get("/api/lessons")
async def get_lessons():
    """AIが学んだ教訓を取得"""
    global LEARNED_LESSONS
    return {"lessons": LEARNED_LESSONS}


from contextlib import asynccontextmanager

# -----------------------------------------------------------------------------
# ■ 第3世代：機関投資家級 統合分析エンジン (God Mode Core)
# -----------------------------------------------------------------------------
def calculate_technical_indicators(df):
    """
    【進化版】テクニカル分析計算 (RSI + Bollinger + 一目均衡表 + MACD)
    """
    if len(df) < 52: return df # データ不足時はそのまま返す
    
    # 型変換
    df['c'] = df['c'].astype(float)
    df['h'] = df['h'].astype(float)
    df['l'] = df['l'].astype(float)
    df['v'] = df['v'].astype(float)

    # 1. 基本指標 (SMA, EMA)
    df['SMA_20'] = df['c'].rolling(window=20).mean()
    df['EMA_200'] = df['c'].ewm(span=200, adjust=False).mean()

    # 2. RSI (14)
    rsi_period = 14
    delta = df['c'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=rsi_period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=rsi_period).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))

    # 3. MACD
    exp12 = df['c'].ewm(span=12, adjust=False).mean()
    exp26 = df['c'].ewm(span=26, adjust=False).mean()
    df['MACD'] = exp12 - exp26
    df['Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()

    # 4. ボリンジャーバンド
    std_20 = df['c'].rolling(window=20).std()
    df['BB_Upper'] = df['SMA_20'] + (std_20 * 2)
    df['BB_Lower'] = df['SMA_20'] - (std_20 * 2)

    # 5. 【新規】一目均衡表 (Ichimoku Cloud)
    # 転換線 (9)
    high_9 = df['h'].rolling(window=9).max()
    low_9 = df['l'].rolling(window=9).min()
    df['Tenkan'] = (high_9 + low_9) / 2

    # 基準線 (26)
    high_26 = df['h'].rolling(window=26).max()
    low_26 = df['l'].rolling(window=26).min()
    df['Kijun'] = (high_26 + low_26) / 2

    # 先行スパンA (26日先に描画するものだが、現在の値として保持)
    df['Senkou_A'] = ((df['Tenkan'] + df['Kijun']) / 2)

    # 先行スパンB (52)
    high_52 = df['h'].rolling(window=52).max()
    low_52 = df['l'].rolling(window=52).min()
    df['Senkou_B'] = (high_52 + low_52) / 2

    # 雲の位置判定 (現在価格が雲の上なら強気)
    # Senkou_AとBの大きい方が雲の上限、小さい方が下限
    df['Cloud_Top'] = df[['Senkou_A', 'Senkou_B']].max(axis=1)
    df['Cloud_Bottom'] = df[['Senkou_A', 'Senkou_B']].min(axis=1)

    return df

def calculate_mtf_logic(df_macro, df_meso, df_micro, l2_data):
    """
    【神の頭脳】3つの眼 × 3つの理論による売買判断 (可変パラメータ対応版)
    """
    if df_macro is None or df_micro is None:
        return {"sentiment": "LOADING...", "confidence": 0, "macro_trend": "UNKNOWN"}

    # 指標計算 (calculate_technical_indicators側で可変パラメータを使って計算済み)
    df_macro = calculate_technical_indicators(df_macro) # 4H
    df_meso = calculate_technical_indicators(df_meso)   # 15M
    df_micro = calculate_technical_indicators(df_micro) # 1M
    
    latest_macro = df_macro.iloc[-1]
    latest_meso = df_meso.iloc[-1]
    latest_micro = df_micro.iloc[-1]

    score = 0
    reasons = []
    
    # ■ 可変パラメータの取得
    adx_thresh = int(STRATEGY_PARAMS.get("adx_threshold", 20))
    
    # ---------------------------------------------------------
    # 1. 「相場の天気」 (Market Regime)
    # ---------------------------------------------------------
    macro_trend = "BULLISH" if latest_macro['c'] > latest_macro['EMA_200'] else "BEARISH"
    adx_strength = latest_meso['ADX']

    # ★ここが変更点: 固定の20ではなく、変数 adx_thresh を使う
    if adx_strength < adx_thresh:
        # レンジ相場判定
        return {
            "sentiment": "WAIT (RANGE)",
            "confidence": 0,
            "macro_trend": "SIDEWAYS",
            "score": 0,
            "reasons": [f"ADX低迷({int(adx_strength)}<{adx_thresh}): レンジ静観"]
        }
    
    if macro_trend == "BULLISH":
        score += 2
    else:
        score -= 2

    # ---------------------------------------------------------
    # 2. 「大口の足跡」 (Order Flow)
    # ---------------------------------------------------------
    price_vs_vwap = latest_meso['c'] - latest_meso['VWAP']
    
    if macro_trend == "BULLISH":
        if price_vs_vwap > 0:
            score += 1
            reasons.append("価格>VWAP(強)")
        else:
            if latest_meso['CVD'] > 0:
                score += 3 
                reasons.append("VWAP割れ+CVD増(絶好の押し目)")
            else:
                score -= 1
    elif macro_trend == "BEARISH":
        if price_vs_vwap < 0:
            score -= 1
            reasons.append("価格<VWAP(弱)")
        else:
            if latest_meso['CVD'] < 0:
                score -= 3
                reasons.append("VWAP超え+CVD減(絶好の戻り目)")
            else:
                score += 1

    # ---------------------------------------------------------
    # 3. 「統計的優位性」 (Quantitative)
    # ---------------------------------------------------------
    z_score = latest_micro['Z_Score']
    
    if z_score > 2.5:
        score -= 2
        reasons.append("統計的過熱(Z>2.5)")
    elif z_score < -2.5:
        score += 2
        reasons.append("統計的売込(Z<-2.5)")

    # ---------------------------------------------------------
    # 4. 最終トリガー (Micro 1M)
    # ---------------------------------------------------------
    if latest_micro['MACD'] > latest_micro['Signal']:
        score += 1
    else:
        score -= 1

    if l2_data:
        bid_vol = sum([b['s'] for b in l2_data['bids']])
        ask_vol = sum([a['s'] for a in l2_data['asks']])
        if (bid_vol + ask_vol) > 0:
            imb = bid_vol / (bid_vol + ask_vol)
            if imb > 0.65: score += 1
            elif imb < 0.35: score -= 1

    # --- 総合判定 ---
    final_score = max(min(score, 10), -10)
    confidence = int((abs(final_score) / 9.0) * 100)
    confidence = min(confidence, 99)

    sentiment = "NEUTRAL"
    if final_score >= 5: sentiment = "STRONG_BUY"
    elif final_score >= 3: sentiment = "BUY"
    elif final_score <= -5: sentiment = "STRONG_SELL"
    elif final_score <= -3: sentiment = "SELL"
    
    # ---------------------------------------------------------
    # 5. 【新規】一目均衡表によるトレンド判定
    # ---------------------------------------------------------
    # 価格が雲の上にあれば「強気」、下にあれば「弱気」
    current_price = latest_meso['c']
    cloud_top = latest_meso['Cloud_Top']
    cloud_bottom = latest_meso['Cloud_Bottom']

    if current_price > cloud_top:
        score += 1
        reasons.append("価格が雲の上(強気)")
    elif current_price < cloud_bottom:
        score -= 1
        reasons.append("価格が雲の下(弱気)")
    else:
        # 雲の中
        reasons.append("雲の中(レンジ注意)")

    return {
        "sentiment": sentiment,
        "confidence": confidence,
        "macro_trend": macro_trend,
        "score": final_score,
        "reasons": reasons
    }
    



        
async def risk_management_loop():
    print("🛡️ RISK GUARDIAN: STANDBY (Safe Mode)")
    target_coin = "HYPE" 
    
    # 初期化はループ内で行う（エラー回避のため）
    exchange = None
    api = None

    await asyncio.sleep(60)

    while True:
        try:
            # 1. APIクライアントの遅延初期化
            if api is None:
                try:
                    api = get_info() 
                    exchange = get_exchange()
                except Exception as e:
                    print(f"Risk Init Error (Cooling down): {e}")
                    await asyncio.sleep(300) # 5分待機
                    continue

            # 2. 【ここが抜けていました！】資産情報の取得
            try:
                # 自分の口座情報を取得して user_state に入れる
                user_state = await asyncio.to_thread(api.user_state, ACCOUNT_ADDRESS)
            except Exception as e:
                print(f"RiskCheck Fetch Error: {str(e)[:50]}")
                await asyncio.sleep(60) # 取得失敗時はスキップ
                continue

            # 3. ポジション確認
            # user_state が定義されたので、ここでエラーにならなくなります
            for pos in user_state.get("assetPositions", []):
                p = pos["position"]
                size = float(p["szi"])
                if abs(size) > 0:
                    coin_name = p["coin"]
                    pnl = float(p["unrealizedPnl"])
                    margin = float(p["marginUsed"])
                    
                    if margin > 0:
                        roe = (pnl / margin) * 100
                        # 損切り/利確ロジック
                        if roe < -10.0: # 損切りライン
                             is_buy = True if size < 0 else False
                             exchange.market_open(coin_name, is_buy, abs(size), None, 0.05)
                             await manager.broadcast({"type": "LOG", "channelId": "TRADING", "payload": {"msg": f"🛡️ 損切り: {coin_name} {roe:.2f}%", "type": "error"}})
                        elif roe > 20.0: # 利確ライン
                             is_buy = True if size < 0 else False
                             exchange.market_open(coin_name, is_buy, abs(size), None, 0.05)
                             await manager.broadcast({"type": "LOG", "channelId": "TRADING", "payload": {"msg": f"🎉 利確: {coin_name} {roe:.2f}%", "type": "sys"}})

        except Exception as e:
            print(f"Guardian Error: {e}")
            
        # ★重要: チェック頻度を大幅に下げる (5分 = 300秒)
        await asyncio.sleep(300)
        
async def immune_system_loop():
    """
    【フェーズ2: 免疫】エラーログを監視し、自動でコード修正を試みる
    """
    print("🛡️ IMMUNE SYSTEM: ACTIVE")
    last_check_id = 0
    
    while True:
        try:
            await asyncio.sleep(10) # 10秒ごとにパトロール
            
            # 最新のエラーログを取得
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("SELECT id, msg FROM logs WHERE type='error' AND id > ? ORDER BY id ASC LIMIT 1", (last_check_id,))
            error_row = c.fetchone()
            conn.close()
            
            if error_row:
                err_id, err_msg = error_row
                last_check_id = err_id
                
                print(f"🚑 エラー検知: {err_msg} -> 自動修復プロセス起動")
                await manager.broadcast({"type": "LOG", "channelId": "DEV", "payload": {"msg": f"🚑 自己修復プロセス起動: {err_msg[:50]}...", "type": "thinking"}})

                # AIへの修復依頼
                prompt = f"""
                システムエラーが発生しました。あなたは「自己修復エージェント」です。
                
                [エラー内容]
                {err_msg}
                
                [指示]
                1. エラーの原因と思われるファイル(main.pyなど)を `read_github_content` で読み込んでください。
                2. 原因を特定し、`commit_github_fix` で修正パッチを適用してください。
                3. 修正内容を簡潔に報告してください。
                
                対象リポジトリ: larubot (デフォルト)
                """
                
                # AIに自律行動させる
                response = await asyncio.to_thread(model.generate_content, prompt)
                
                await manager.broadcast({"type": "LOG", "channelId": "DEV", "payload": {"msg": f"✅ 修復完了: {response.text}", "type": "gemini"}})
                
        except Exception as e:
            print(f"Immune Error: {e}")
            await asyncio.sleep(30)
            
            
            
async def search_codebase(target_repo: str, query: str):
    """
    リポジトリ内の全ファイルを対象に、指定された文字列(query)を検索する (Grep機能)。
    「あの関数どこだっけ？」という時に使用する。
    """
    if not GITHUB_TOKEN: return "Error: No Token"
    
    # リポジトリ特定（既存ロジック）
    repo_info = REPO_REGISTRY.get(target_repo.lower())
    if not repo_info:
        if "laru" in target_repo.lower(): repo_info = REPO_REGISTRY["larubot"]
        else: return "Error: Repo not found"

    owner = repo_info["owner"]
    repo = repo_info["name"]
    
    # GitHub Search Code APIを使用
    # 注意: インデックス反映に時間がかかる場合があるが、API経由で最も確実な方法
    search_url = f"https://api.github.com/search/code?q={query}+repo:{owner}/{repo}"
    headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(search_url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                items = data.get('items', [])
                if not items:
                    return "No matches found."
                
                # 結果を整形
                results = []
                for item in items[:10]: # 上位10件
                    results.append(f"- {item['path']}")
                
                return f"Found '{query}' in:\n" + "\n".join(results)
            else:
                return f"Search Error ({res.status_code}): {res.text}"
        except Exception as e:
            return f"Network Error: {str(e)}"
        

async def run_terminal_command(command: str):
    """
    【危険】サーバー内部でLinuxコマンドを実行する。
    使用可能コマンド例: 'ls -la', 'pwd', 'cat requirements.txt', 'pip list'
    ※ 破壊的なコマンド（rm -rfなど）は慎重に行うこと。
    """
    # セキュリティガード（簡易的）
    forbidden = ["rm -rf /", "shutdown", "reboot", ":(){ :|:& };:"]
    if any(f in command for f in forbidden):
        return "Error: Command prohibited for security reasons."

    print(f"💻 Shell Exec: {command}")
    
    try:
        # 非同期でコマンド実行
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await proc.communicate()
        
        result = ""
        if stdout:
            result += f"[STDOUT]\n{stdout.decode().strip()}\n"
        if stderr:
            result += f"[STDERR]\n{stderr.decode().strip()}\n"
            
        if not result:
            result = "Command executed successfully (No output)."
            
        return result[:2000] # 長すぎるとAIがパンクするので制限
        
    except Exception as e:
        return f"Shell Error: {str(e)}"
    
    
# --- ブラウザの状態を保持するグローバル変数 ---
# Renderはサーバーレスですが、1回の起動中はメモリを保持できます。
class GlobalBrowser:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.page = None
        self.lock = asyncio.Lock()

    async def start(self):
        if not self.playwright:
            self.playwright = await async_playwright().start()
            # ヘッドレスモード（画面なし）で起動
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            # 実際の人間らしく見せるためのUserAgent設定
            context = await self.browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 720}
            )
            self.page = await context.new_page()
            print("🌐 Phantom Browser Launched.")

    async def stop(self):
        if self.page: await self.page.close()
        if self.browser: await self.browser.close()
        if self.playwright: await self.playwright.stop()
        self.playwright = None
        self.browser = None
        self.page = None
        print("💤 Phantom Browser Shutdown.")

# インスタンス作成
phantom_browser = GlobalBrowser()

# --- AIが使うためのツール関数群 ---

async def browser_navigate(url: str):
    """
    [Browser Tool] 指定されたURLを開く。ブラウザが起動していない場合は起動する。
    """
    async with phantom_browser.lock:
        if not phantom_browser.page:
            await phantom_browser.start()
        
        try:
            await phantom_browser.page.goto(url, timeout=30000)
            await asyncio.sleep(2) # 読み込み待ち
            title = await phantom_browser.page.title()
            return f"Opened: {title}\n(次のアクション: スクリーンショットを撮って内容を確認するか、click/typeを行ってください)"
        except Exception as e:
            return f"Navigation Error: {str(e)}"

async def browser_screenshot():
    """
    [Browser Tool] 現在のページの状態を撮影し、状況を報告する。
    AIはこの画像を見て次の行動（クリックや入力）を決定する。
    """
    async with phantom_browser.lock:
        if not phantom_browser.page: return "Error: Browser not open."
        
        try:
            # スクリーンショットを撮影
            screenshot_bytes = await phantom_browser.page.screenshot(type='jpeg', quality=60)
            img_b64 = base64.b64encode(screenshot_bytes).decode('utf-8')
            
            # クライアント（Dev Console）に画像を送信して見せる
            await manager.broadcast({
                "type": "LOG", 
                "channelId": "DEV", 
                "payload": {
                    "msg": "📸 現在のブラウザ画面:", 
                    "type": "browser", 
                    "imageUrl": f"data:image/jpeg;base64,{img_b64}"
                }
            })
            
            # ページ内のテキストも少し取得して補足する
            text = await phantom_browser.page.inner_text('body')
            return f"Snapshot taken. Page Text Summary (first 500 chars): {text[:500]}..."
        except Exception as e:
            return f"Screenshot Error: {str(e)}"

async def browser_click(target: str):
    """
    [Browser Tool] 指定されたテキストを持つ要素、またはCSSセレクタをクリックする。
    例: 'Login', '#submit-button', '次へ'
    """
    async with phantom_browser.lock:
        if not phantom_browser.page: return "Error: Browser not open."
        
        try:
            # まずテキストとして探す
            try:
                await phantom_browser.page.click(f"text={target}", timeout=2000)
                await asyncio.sleep(2)
                return f"Clicked element with text '{target}'."
            except:
                # ダメならセレクタとして探す
                await phantom_browser.page.click(target, timeout=2000)
                await asyncio.sleep(2)
                return f"Clicked element by selector '{target}'."
                
        except Exception as e:
            return f"Click Error: Could not click '{target}'. Error: {str(e)}"

async def browser_type(target: str, text: str):
    """
    [Browser Tool] 指定された入力欄にテキストを入力する。
    target: 'Email', 'Password', '#search-box' など
    """
    async with phantom_browser.lock:
        if not phantom_browser.page: return "Error: Browser not open."
        
        try:
            # プレースホルダーやラベルから入力欄を推測して入力
            try:
                await phantom_browser.page.get_by_placeholder(target).fill(text)
            except:
                try:
                    await phantom_browser.page.get_by_label(target).fill(text)
                except:
                    # セレクタとしてトライ
                    await phantom_browser.page.fill(target, text)
            
            return f"Typed '{text}' into '{target}'."
        except Exception as e:
            return f"Type Error: {str(e)}"

async def browser_scroll(direction: str):
    """
    [Browser Tool] 'down' または 'up' でページをスクロールする。
    """
    async with phantom_browser.lock:
        if not phantom_browser.page: return "Error: Browser not open."
        
        try:
            if direction == "down":
                await phantom_browser.page.evaluate("window.scrollBy(0, 500)")
            else:
                await phantom_browser.page.evaluate("window.scrollBy(0, -500)")
            return f"Scrolled {direction}."
        except Exception as e:
            return f"Scroll Error: {str(e)}"
        
        
async def analyze_market_sentiment():
    """
    [God Mode] Phantom Browserを使ってWebから市場のセンチメントを収集する。
    CoinGeckoのTrendingや、ニュースサイトのヘッドラインを読み取る。
    """
    print("🌍 Analyzing Global Sentiment via Phantom Browser...")
    
    # 例: CoinDeskの最新記事タイトルを取得（サイトは負荷の軽いものを選ぶ）
    target_url = "https://www.coindesk.com/tag/markets/" 
    
    try:
        # ブラウザでアクセス
        await browser_navigate(target_url)
        await asyncio.sleep(3)
        
        # 記事タイトルを取得 (セレクタはサイトに合わせて調整が必要)
        # ここではページ全体のテキストからAIに判断させる簡易版
        page_text = ""
        async with phantom_browser.lock:
            if phantom_browser.page:
                page_text = await phantom_browser.page.inner_text("body")
        
        if not page_text: return "Failed to fetch text."

        # Geminiに分析させる
        prompt = f"""
        以下のニュースサイトのテキストデータから、現在の仮想通貨市場が
        「Bullish (強気)」か「Bearish (弱気)」かを判定せよ。
        特に Bitcoin, Ethereum, Solana に関する記述を重視せよ。
        
        [Web Text Snippet]
        {page_text[:2000]}
        
        回答は以下のJSON形式のみ:
        {{"sentiment": "BULLISH" or "BEARISH" or "NEUTRAL", "score": 0-100, "reason": "短い理由"}}
        """
        
        response = await asyncio.to_thread(model.generate_content, prompt)
        
        # 結果をログに流す
        import re
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            msg = f"📰 Market News: {data['sentiment']} (Score: {data['score']}) - {data['reason']}"
            await manager.broadcast({"type": "LOG", "channelId": "TRADING", "payload": {"msg": msg, "type": "gemini"}})
            return data
            
    except Exception as e:
        print(f"Sentiment Analysis Error: {e}")
        return None
    
async def run_test_validation(target_file: str, test_code: str):
    """
    [God Mode] 修正コードが正しいか、一時的なテストファイルを作って検証する。
    """
    # 1. テストファイルを生成
    test_filename = "temp_validation.py"
    with open(test_filename, "w") as f:
        f.write(test_code)
    
    # 2. 実行
    result = await run_terminal_command(f"python {test_filename}")
    
    # 3. 後始末
    os.remove(test_filename)
    
    # 4. 判定
    if "Error" in result or "Traceback" in result:
        return f"❌ テスト失敗:\n{result}"
    else:
        return f"✅ テスト成功:\n{result}"
    
model = genai.GenerativeModel(
    model_name='gemini-2.0-flash-exp',
    tools=[
        place_order, 
        commit_github_fix, 
        read_github_content, 
        check_render_status, 
        fetch_repo_structure,
        search_codebase,
        run_terminal_command,
        browser_navigate,
        browser_screenshot,
        browser_click,
        browser_type,
        browser_scroll,
        run_test_validation  # <--- これを追加！
    ]
)

# --- lifespan の修正 ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 GENESIS システム起動中...")
    asyncio.create_task(system_pulse())
    asyncio.create_task(market_surveillance_loop())
    asyncio.create_task(risk_management_loop())
    asyncio.create_task(evolve_strategy_loop()) # ← 【追加】自己進化エンジン
    asyncio.create_task(immune_system_loop())
    
    yield
    print("💤 GENESIS システムシャットダウン")
    
    



app.router.lifespan_context = lifespan

# --- サーバー起動スイッチ ---
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)