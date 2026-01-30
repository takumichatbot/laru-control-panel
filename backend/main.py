import asyncio
import json
import base64
import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"
import random
import re
import sqlite3
import subprocess
import time
import psutil
from dotenv import load_dotenv
load_dotenv()
from datetime import datetime
from contextlib import asynccontextmanager
from pydantic import BaseModel
# FastAPI関連
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # 【追加】404エラー対策

# AI & Browser
import google.generativeai as genai
from playwright.async_api import async_playwright
import httpx

# --- Configuration ---
API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    print("CRITICAL ERROR: GEMINI_API_KEY is not set in environment variables!")
else:
    genai.configure(api_key=API_KEY)

# --- GitHub API Integration ---
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# ■ リポジトリ台帳
REPO_REGISTRY = {
    "larubot":    {"owner": "takumichatbot", "name": "LARUbot_homepage"},
    "laruvisona": {"owner": "takumichatbot", "name": "laruvisona-corp-site"},
    "larunexus":  {"owner": "takumichatbot", "name": "laru-control-panel"},
    "flastal":    {"owner": "takumichatbot", "name": "flastal"},
}

async def commit_github_fix(target_repo: str, file_path: str, new_content: str, commit_message: str):
    """
    GitHubのファイルを直接書き換える「神の手」機能
    """
    if not GITHUB_TOKEN:
        return "エラー: GitHubトークンが設定されていません。"

    repo_info = REPO_REGISTRY.get(target_repo.lower())
    if not repo_info:
        repo_info = {"owner": "takumichatbot", "name": target_repo}

    owner = repo_info["owner"]
    repo = repo_info["name"]

    headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}"
    
    print(f"🔨 GitHub操作開始: {owner}/{repo} の {file_path} を修正中...")

    async with httpx.AsyncClient() as client:
        try:
            # 現在のファイルのSHAを取得 (上書きに必要)
            res = await client.get(url, headers=headers)
            sha = res.json().get("sha") if res.status_code == 200 else None
            
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

async def read_github_content(target_repo: str, file_path: str):
    """
    指定されたリポジトリのファイルの中身を読み取る
    """
    if not GITHUB_TOKEN: return "Error: No Token"
    
    target_key = target_repo.lower().strip()
    repo_info = REPO_REGISTRY.get(target_key)
    
    if not repo_info:
        if "laru" in target_key:
            repo_info = REPO_REGISTRY["larubot"]
        else:
            return f"Error: Repository '{target_repo}' not found."

    owner = repo_info["owner"]
    repo = repo_info["name"]
    
    async def fetch(path):
        url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
        headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
        async with httpx.AsyncClient() as client:
            return await client.get(url, headers=headers)

    res = await fetch(file_path)
    
    # 2回目トライ (backend/ をつけてみる)
    if res.status_code == 404 and not file_path.startswith("backend/"):
        res = await fetch(f"backend/{file_path}")

    if res.status_code == 200:
        content = base64.b64decode(res.json()["content"]).decode()
        return content
    else:
        return f"GitHub Error ({res.status_code}): {res.text}"

async def fetch_repo_structure(target_repo: str):
    """
    リポジトリの全ファイルパス一覧を取得
    """
    if not GITHUB_TOKEN: return "Error: No Token"
    
    target_key = target_repo.lower().strip()
    repo_info = REPO_REGISTRY.get(target_key)
    if not repo_info:
        if "laru" in target_key: repo_info = REPO_REGISTRY["larubot"]
        else: return "Error: Repository not found"

    owner = repo_info["owner"]
    repo = repo_info["name"]
    
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1"
    headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                paths = [item['path'] for item in data.get('tree', []) if item['type'] == 'blob']
                return json.dumps(paths[:100]) 
            else:
                return f"GitHub API Error ({res.status_code}): {res.text}"
        except Exception as e:
            return f"Network Error: {str(e)}"

async def search_codebase(target_repo: str, query: str):
    """
    リポジトリ内Grep検索
    """
    if not GITHUB_TOKEN: return "Error: No Token"
    
    repo_info = REPO_REGISTRY.get(target_repo.lower())
    if not repo_info:
        if "laru" in target_repo.lower(): repo_info = REPO_REGISTRY["larubot"]
        else: return "Error: Repo not found"

    owner = repo_info["owner"]
    repo = repo_info["name"]
    
    search_url = f"https://api.github.com/search/code?q={query}+repo:{owner}/{repo}"
    headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(search_url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                items = data.get('items', [])
                if not items: return "No matches found."
                results = [f"- {item['path']}" for item in items[:10]]
                return f"Found '{query}' in:\n" + "\n".join(results)
            else:
                return f"Search Error ({res.status_code}): {res.text}"
        except Exception as e:
            return f"Network Error: {str(e)}"

# --- Render API ---
RENDER_API_KEY = os.getenv("RENDER_API_KEY")

async def check_render_status():
    """Renderのデプロイ状況確認"""
    if not RENDER_API_KEY: return "Error: No RENDER_API_KEY"
    headers = {"Authorization": f"Bearer {RENDER_API_KEY}", "Accept": "application/json"}
    
    async with httpx.AsyncClient() as client:
        try:
            services_res = await client.get("https://api.render.com/v1/services", headers=headers)
            if services_res.status_code != 200: return f"Render API Error: {services_res.text}"
            
            services = services_res.json()
            report = []
            for svc in services:
                name = svc['service']['name']
                svc_id = svc['service']['id']
                status = svc['service']['serviceDetails'].get('status', 'unknown')
                url = svc['service']['serviceDetails'].get('url', 'no-url')
                
                deploys_res = await client.get(f"https://api.render.com/v1/services/{svc_id}/deploys?limit=1", headers=headers)
                deploy_info = "No deploy info"
                if deploys_res.status_code == 200 and len(deploys_res.json()) > 0:
                    latest = deploys_res.json()[0]
                    deploy_info = f"Latest: {latest['status']} ({latest.get('commit', {}).get('message', 'Manual')})"
                
                report.append(f"📦 **{name}**\n   Status: {status}\n   URL: {url}\n   {deploy_info}")
            return "\n\n".join(report)
        except Exception as e:
            return f"Render Monitor Error: {str(e)}"

# --- Discord Notification ---
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

async def send_discord_alert(title: str, description: str, color: int = 0x00ff00):
    """Discord通知送信"""
    if not DISCORD_WEBHOOK_URL: return
    payload = {
        "username": "LaruNexus AI",
        "embeds": [{"title": title, "description": description, "color": color, "footer": {"text": "Genesis System"}}]
    }
    try:
        async with httpx.AsyncClient() as client:
            await client.post(DISCORD_WEBHOOK_URL, json=payload)
    except: pass

# --- Database ---
DB_PATH = "/opt/render/project/src/nexus_genesis.db" if os.getenv("RENDER") else "nexus_genesis.db"

# 既存の init_db を更新（テーブル追加）
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # 既存テーブル
    c.execute('''CREATE TABLE IF NOT EXISTS logs
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, channel_id TEXT, timestamp TEXT, msg TEXT, type TEXT, image_url TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS kpi_scores
                 (dept TEXT PRIMARY KEY, score INTEGER, streak INTEGER, last_eval TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS project_settings
                 (project_id TEXT PRIMARY KEY, email TEXT, password TEXT, login_type TEXT, memo TEXT)''')
    
    # ★追加: ミッション管理テーブル（AIの長期記憶）
    c.execute('''CREATE TABLE IF NOT EXISTS missions
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                  channel_id TEXT, 
                  main_goal TEXT, 
                  sub_tasks TEXT, 
                  current_step_index INTEGER, 
                  status TEXT, 
                  memory TEXT,
                  updated_at TEXT)''')
    
    depts = ["CENTRAL", "DEV", "TRADING", "INFRA"]
    for d in depts:
        c.execute("INSERT OR IGNORE INTO kpi_scores (dept, score, streak, last_eval) VALUES (?, 50, 0, ?)", (d, datetime.now().isoformat()))
    conn.commit()
    conn.close()

# ★追加: ミッション管理ツール関数
async def manage_mission(action: str, channel_id: str, data: str = ""):
    """
    AIが自身の長期タスクを管理するためのツール。
    action:
      - "create": 新しい目標を設定 (dataに目標記述)
      - "add_tasks": タスクリストを設定 (dataにカンマ区切りでタスク記述)
      - "update_step": 現在の進捗を更新 (dataにステップ番号 '0', '1'...)
      - "save_memo": 重要な情報をメモする (dataに追記するテキスト)
      - "complete": ミッション完了 (dataは空でOK)
      - "read": 現在のミッション状態を読み取る (dataは空でOK)
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        # 現在のアクティブなミッションを取得
        c.execute("SELECT id, main_goal, sub_tasks, current_step_index, memory FROM missions WHERE channel_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1", (channel_id,))
        row = c.fetchone()
        
        if action == "create":
            if row: # 既存があれば中断(aborted)扱いにする
                c.execute("UPDATE missions SET status = 'aborted' WHERE id = ?", (row[0],))
            c.execute("INSERT INTO missions (channel_id, main_goal, sub_tasks, current_step_index, status, memory, updated_at) VALUES (?, ?, '[]', 0, 'active', '', ?)", 
                      (channel_id, data, datetime.now().isoformat()))
            conn.commit()
            return f"✅ New Mission Started: {data}"

        if not row: return "Error: No active mission found. Use 'create' action first."
        mid, goal, tasks_json, step, memory = row
        tasks = json.loads(tasks_json) if tasks_json else []

        if action == "add_tasks":
            # カンマ区切りなどで来る可能性があるため整形
            new_tasks = [t.strip() for t in data.split(",") if t.strip()]
            c.execute("UPDATE missions SET sub_tasks = ?, updated_at = ? WHERE id = ?", 
                      (json.dumps(new_tasks), datetime.now().isoformat(), mid))
            return f"✅ Tasks Updated: {new_tasks}"

        elif action == "update_step":
            try:
                new_step = int(data)
                task_name = tasks[new_step] if len(tasks) > new_step else "Unknown"
                c.execute("UPDATE missions SET current_step_index = ?, updated_at = ? WHERE id = ?", (new_step, datetime.now().isoformat(), mid))
                return f"✅ Moved to step {new_step}: {task_name}"
            except: return "Error: Invalid step number"

        elif action == "save_memo":
            timestamp = datetime.now().strftime("%H:%M")
            new_entry = f"[{timestamp}] {data}"
            new_memory = (memory + "\n" + new_entry).strip()
            c.execute("UPDATE missions SET memory = ?, updated_at = ? WHERE id = ?", (new_memory, datetime.now().isoformat(), mid))
            return "✅ Memo Saved."

        elif action == "complete":
            c.execute("UPDATE missions SET status = 'completed', updated_at = ? WHERE id = ?", (datetime.now().isoformat(), mid))
            return "🎉 Mission Completed!"

        elif action == "read":
            current_task = tasks[step] if len(tasks) > step else "None"
            return f"""
=== 📋 CURRENT MISSION STATUS ===
Goal: {goal}
Current Step [{step}]: {current_task}
Tasks List: {tasks}
---------------------------------
[MEMORY / NOTES]
{memory}
=================================
"""
    except Exception as e: return f"Mission DB Error: {e}"
    finally: conn.close()

def update_kpi(dept: str, points: int, reason: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT score, streak FROM kpi_scores WHERE dept = ?", (dept,))
        row = c.fetchone()
        if row:
            current_score, current_streak = row
            new_score = max(0, min(100, current_score + points))
            new_streak = current_streak + 1 if points > 0 else 0
            c.execute("UPDATE kpi_scores SET score = ?, streak = ?, last_eval = ? WHERE dept = ?", 
                      (new_score, new_streak, datetime.now().isoformat(), dept))
            conn.commit()
            return new_score, new_streak
    except: pass
    finally: conn.close()
    return 50, 0

# ★追加: 設定の保存・取得関数
def upsert_project_settings(project_id, email, password, login_type, memo):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO project_settings (project_id, email, password, login_type, memo) VALUES (?, ?, ?, ?, ?)",
                  (project_id, email, password, login_type, memo))
        conn.commit()
        conn.close()
    except Exception as e: print(f"DB Error: {e}")

def get_project_settings(project_id):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT email, password, login_type, memo FROM project_settings WHERE project_id = ?", (project_id,))
        row = c.fetchone()
        conn.close()
        if row: return {"email": row[0], "password": row[1], "login_type": row[2], "memo": row[3]}
        return None
    except: return None

def get_current_kpi(dept: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT score, streak FROM kpi_scores WHERE dept = ?", (dept,))
    row = c.fetchone()
    conn.close()
    return row if row else (50, 0)

def save_log(channel_id, msg, log_type, image_url=None):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        timestamp = datetime.now().strftime("%H:%M:%S")
        c.execute("INSERT INTO logs (channel_id, timestamp, msg, type, image_url) VALUES (?, ?, ?, ?, ?)",
                  (channel_id, timestamp, msg, log_type, image_url))
        conn.commit()
        conn.close()
    except: pass

def get_channel_logs(channel_id, limit=50):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT timestamp, msg, type, image_url FROM logs WHERE channel_id = ? ORDER BY id DESC LIMIT ?", (channel_id, limit))
        rows = c.fetchall()
        conn.close()
        return [{"time": r[0], "msg": r[1], "type": r[2], "imageUrl": r[3], "id": f"hist_{i}_{channel_id}"} for i, r in enumerate(reversed(rows))]
    except: return []

init_db()

# --- Server Setup & 404 Fix ---
app = FastAPI()

@app.get("/api/status")
def root():
    return {"status": "ok", "service": "LaruNexus GENESIS", "mode": "DEV_ADMIN_ONLY", "time": datetime.now().isoformat()}

ORIGINS = os.getenv("FRONTEND_URL", "*").split(",")
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ★追加: 設定保存・取得用API
class SettingsModel(BaseModel):
    email: str
    password: str
    login_type: str
    memo: str

@app.post("/api/settings/{project_id}")
async def save_settings_endpoint(project_id: str, settings: SettingsModel):
    upsert_project_settings(project_id, settings.email, settings.password, settings.login_type, settings.memo)
    return {"status": "success"}

@app.get("/api/settings/{project_id}")
async def get_settings_endpoint(project_id: str):
    data = get_project_settings(project_id)
    return data if data else {"email": "", "password": "", "login_type": "", "memo": ""}

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections: self.active_connections.remove(websocket)
    async def broadcast(self, message: dict):
        if message.get("type") == "LOG":
            payload = message.get("payload", {})
            cid = message.get("channelId", "CENTRAL")
            save_log(cid, payload.get("msg"), payload.get("type"), payload.get("imageUrl"))
        for connection in list(self.active_connections):
            try: await connection.send_json(message)
            except: self.disconnect(connection)

manager = ConnectionManager()

# --- Browser Agent (Phantom Browser) ---
class GlobalBrowser:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.page = None
        self.lock = asyncio.Lock()

    async def start(self):
        if not self.playwright:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
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

phantom_browser = GlobalBrowser()

async def browser_navigate(url: str):
    async with phantom_browser.lock:
        if not phantom_browser.page: await phantom_browser.start()
        try:
            await phantom_browser.page.goto(url, timeout=30000)
            await asyncio.sleep(2)
            title = await phantom_browser.page.title()
            return f"Opened: {title}"
        except Exception as e: return f"Nav Error: {e}"

async def browser_screenshot():
    async with phantom_browser.lock:
        if not phantom_browser.page: return "Error: Browser not open."
        try:
            # ページがロードされるのを待つ
            await asyncio.sleep(1)
            
            # JS注入: 操作可能要素に「data-laru-id」と「視覚タグ」を付与
            visual_map = await phantom_browser.page.evaluate('''() => {
                // 既存のタグをクリア
                document.querySelectorAll('.laru-tag').forEach(e => e.remove());
                
                // 操作可能な要素を抽出
                const elements = Array.from(document.querySelectorAll('a, button, input, textarea, select, [role="button"], [onclick]'));
                
                // 画面内に見えているものだけに絞る
                const visibleElements = elements.filter(el => {
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden' && !el.disabled &&
                           rect.width > 0 && rect.height > 0 &&
                           rect.top >= 0 && rect.left >= 0 &&
                           rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
                }).slice(0, 60); // トークン節約のため最大60個

                const map = [];
                visibleElements.forEach((el, index) => {
                    const id = index + 1;
                    
                    // 1. 要素自体にID属性を付与（クリック用）
                    el.setAttribute('data-laru-id', id);
                    
                    // 2. 視覚的タグ（赤枠と番号）を作成（AI認識用）
                    const rect = el.getBoundingClientRect();
                    const tag = document.createElement('div');
                    tag.className = 'laru-tag';
                    tag.innerText = id;
                    tag.style.position = 'fixed';
                    tag.style.left = rect.left + 'px';
                    tag.style.top = Math.max(0, rect.top - 20) + 'px'; // 要素の少し上に表示
                    tag.style.backgroundColor = '#ff0000';
                    tag.style.color = 'white';
                    tag.style.fontSize = '14px';
                    tag.style.fontWeight = 'bold';
                    tag.style.padding = '2px 6px';
                    tag.style.borderRadius = '4px';
                    tag.style.zIndex = '2147483647'; // 最大値
                    tag.style.pointerEvents = 'none';
                    tag.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
                    document.body.appendChild(tag);
                    
                    // 3. マップ情報の作成
                    let text = el.innerText ? el.innerText.substring(0, 30).replace(/\\n/g, '') : '';
                    if (!text && el.placeholder) text = `[Input] ${el.placeholder}`;
                    if (!text && el.value) text = `[Value] ${el.value}`;
                    if (!text && el.ariaLabel) text = el.ariaLabel;
                    
                    let tagName = el.tagName.toLowerCase();
                    map.push(`ID [${id}]: <${tagName}> ${text}`);
                });
                return map;
            }''')
            
            # タグ描画待ち
            await asyncio.sleep(0.5)
            
            # スクリーンショット撮影
            screenshot_bytes = await phantom_browser.page.screenshot(type='jpeg', quality=70)
            img_b64 = base64.b64encode(screenshot_bytes).decode('utf-8')
            
            # 視覚タグ（赤箱）だけ削除（画面が汚れないように）。data-laru-idは残す。
            await phantom_browser.page.evaluate("document.querySelectorAll('.laru-tag').forEach(e => e.remove())")
            
            # フロントエンドへ送信
            await manager.broadcast({
                "type": "LOG", "channelId": "DEV", 
                "payload": {"msg": "📸 Visual Targeting Active", "type": "browser", "imageUrl": f"data:image/jpeg;base64,{img_b64}"}
            })
            
            map_text = "\n".join(visual_map)
            
            return f"""
IMAGE CAPTURED WITH VISUAL ID TAGS (Red Numbers).
You MUST use `click_element_by_id(id)` to interact with these elements.
Do NOT use `browser_click` with text selectors anymore.

=== INTERACTIVE ELEMENTS (ID Mapping) ===
{map_text}
            """
        except Exception as e:
            return f"Shot Error: {e}"
        
async def click_element_by_id(id: int):
    """
    browser_screenshotで確認した「赤い数字（ID）」を指定してクリックする。
    """
    async with phantom_browser.lock:
        if not phantom_browser.page: return "Error: Browser not open."
        try:
            # 注入された data-laru-id 属性を探してクリック
            selector = f'[data-laru-id="{id}"]'
            element = await phantom_browser.page.query_selector(selector)
            
            if element:
                # 要素が見えているか確認してスクロール
                await element.scroll_into_view_if_needed()
                await asyncio.sleep(0.5)
                try:
                    await element.click(timeout=3000)
                except:
                    # JSクリック（強制実行）
                    await phantom_browser.page.evaluate(f'document.querySelector(\'{selector}\').click()')
                
                return f"✅ Clicked Element ID [{id}]"
            else:
                return f"❌ Error: Element ID [{id}] not found. The page might have changed. Please take a screenshot again."
        except Exception as e:
            return f"Click Error: {e}"
        

async def browser_click(target: str):
    async with phantom_browser.lock:
        if not phantom_browser.page: return "Error: Browser not open."
        try:
            try: await phantom_browser.page.click(f"text={target}", timeout=2000)
            except: await phantom_browser.page.click(target, timeout=2000)
            return f"Clicked '{target}'"
        except Exception as e: return f"Click Error: {e}"

async def browser_type(target: str, text: str):
    async with phantom_browser.lock:
        if not phantom_browser.page: return "Error: Browser not open."
        try:
            await phantom_browser.page.fill(target, text)
            return f"Typed '{text}' into '{target}'"
        except Exception as e: return f"Type Error: {e}"

async def browser_scroll(direction: str):
    async with phantom_browser.lock:
        if not phantom_browser.page: return "Error: Browser not open."
        try:
            y = 500 if direction == "down" else -500
            await phantom_browser.page.evaluate(f"window.scrollBy(0, {y})")
            return f"Scrolled {direction}"
        except Exception as e: return f"Scroll Error: {e}"
        
async def perform_login(url: str, email: str, password: str):
    """
    指定されたURLでメールアドレスとパスワードを入力し、ログインボタンを押す一括操作ツール
    """
    async with phantom_browser.lock:
        if not phantom_browser.page: await phantom_browser.start()
        page = phantom_browser.page
        
        # ★追加: AIが「現在のURL」という文字列を渡してきた場合の救済措置
        if url in ["現在のURL", "current", "", "None"] or not url.startswith("http"):
            print(f"⚠️ URL補正: '{url}' -> '{page.url}'")
            url = page.url

        try:
            print(f"🔐 Auto-Login started for {url}")
            
            # URLが現在のページと異なる場合のみ移動
            if page.url != url:
                try:
                    await page.goto(url, timeout=30000)
                except Exception as nav_err:
                    return f"Error: Navigation failed to {url}. ({nav_err})"
            
            await asyncio.sleep(2)

            # 2. メールアドレス入力欄を探して入力
            email_selectors = [
                'input[type="email"]', 'input[name*="email"]', 'input[name*="user"]', 'input[id*="email"]', 
                'input[placeholder*="Email"]', 'input[placeholder*="メール"]', 'input[name="login"]'
            ]
            email_filled = False
            for sel in email_selectors:
                if await page.query_selector(sel):
                    await page.fill(sel, email)
                    email_filled = True
                    print(f"  - Email filled into '{sel}'")
                    break
            
            if not email_filled: return "Error: Could not find Email input field."

            # 3. パスワード入力欄を探して入力
            pass_selectors = [
                'input[type="password"]', 'input[name*="pass"]', 'input[id*="pass"]', 
                'input[placeholder*="Password"]', 'input[placeholder*="パスワード"]'
            ]
            pass_filled = False
            for sel in pass_selectors:
                if await page.query_selector(sel):
                    await page.fill(sel, password)
                    pass_filled = True
                    print(f"  - Password filled into '{sel}'")
                    break
            
            if not pass_filled: return "Error: Could not find Password input field."

            # 4. ログインボタン（Submit）を押す
            btn_selectors = [
                'button[type="submit"]', 'input[type="submit"]', 
                'button[class*="login"]', 'a[class*="login"]',
                'button:has-text("Login")', 'button:has-text("ログイン")',
                'div[role="button"]:has-text("Login")'
            ]
            clicked = False
            for sel in btn_selectors:
                if await page.query_selector(sel):
                    await page.click(sel)
                    clicked = True
                    print(f"  - Clicked login button '{sel}'")
                    break
            
            if not clicked: return "Error: Could not find Login button."

            # 5. 完了待ち
            await asyncio.sleep(5) # 少し長めに待つ
            title = await page.title()
            return f"✅ Login Action Completed. Current Page Title: {title}"

        except Exception as e:
            return f"Login Failed: {str(e)}"

async def run_autonomous_browser_agent(url: str, task_description: str, channel_id: str):
    await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": f"🌐 潜入開始: {url}", "type": "thinking"}})
    try:
        # 1. ブラウザを操作して情報を集める
        nav_result = await browser_navigate(url)
        shot_result = await browser_screenshot() # ここにページのテキストが入っています

        # 2. 集めた情報をプロンプトに埋め込む
        prompt = f"""
        Target URL: {url}
        User Request: {task_description}
        
        [Browser Logs]
        {nav_result}
        {shot_result}
        
        Based on the above page content, report the status to the user in Japanese.
        """
        
        # 3. AIに報告させる（ここでエラーが出ないように安全策を追加）
        response = await asyncio.to_thread(model.generate_content, prompt)
        
        # 安全にテキストだけを取り出す（万が一ツールを使おうとしても無視する）
        final_text = "".join([p.text for p in response.parts if not p.function_call])
        if not final_text: final_text = "✅ ページを確認しました（要約の生成に失敗しましたが、アクセスは成功しました）。"

        await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": final_text, "type": "gemini"}})

    except Exception as e:
        await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": f"Agent Error: {e}", "type": "error"}})

# --- Terminal & System Tools ---
async def run_terminal_command(command: str):
    forbidden = ["rm -rf /", "shutdown", "reboot", ":(){ :|:& };:"]
    if any(f in command for f in forbidden): return "Error: Security Block."
    print(f"💻 Shell: {command}")
    try:
        proc = await asyncio.create_subprocess_shell(command, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, stderr = await proc.communicate()
        res = (stdout.decode() + stderr.decode()).strip()
        return res[:2000] if res else "Success (No output)"
    except Exception as e: return f"Shell Error: {e}"

async def run_test_validation(target_file: str, test_code: str):
    test_filename = "temp_validation.py"
    with open(test_filename, "w") as f: f.write(test_code)
    result = await run_terminal_command(f"python {test_filename}")
    os.remove(test_filename)
    return f"Test Result:\n{result}"

async def system_pulse():
    while True:
        if manager.active_connections:
            cpu = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory().percent
            await manager.broadcast({"type": "KPI_UPDATE", "data": {"time": datetime.now().strftime("%H:%M:%S"), "cpu": cpu, "mem": mem}})
        await asyncio.sleep(2)

async def immune_system_loop():
    print("🛡️ IMMUNE SYSTEM: ACTIVE")
    last_check_id = 0
    while True:
        try:
            await asyncio.sleep(10)
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("SELECT id, msg FROM logs WHERE type='error' AND id > ? ORDER BY id ASC LIMIT 1", (last_check_id,))
            row = c.fetchone()
            conn.close()
            if row:
                last_check_id, err_msg = row
                print(f"🚑 Auto-Healing: {err_msg[:30]}...")
                # 自動修復ロジック（簡易版）
                prompt = f"エラーが発生しました: {err_msg}。原因を推測し、`read_github_content` 等を使って調査してください。"
                await asyncio.to_thread(model.generate_content, prompt)
        except: pass

# --- AI Personas (報・連・相モード) ---
DEPT_PERSONAS = {
    "CENTRAL": {
        "name": "LaruNexus GENESIS",
        "role": "Autonomous Agent",
        "instructions": (
            "あなたは自律型AI「LaruNexus」です。\n"
            "以下の【行動プロセス】を厳守してください。\n\n"
            "1. **Thought (思考)**: 現状を分析し、次にすべき行動を決定する。\n"
            "2. **Report (報告)**: ユーザーに「〇〇を実行します」と短く宣言する。\n"
            "3. **Action (実行)**: **報告と同じメッセージ内で、必ずツール関数（`browser_click` 等）を呼び出す。**\n\n"
            "🚫 **禁止事項**:\n"
            "・「実行します」と言って、ツールを使わずに会話を終了すること。\n"
            "・言葉と行動は必ずセットで行うこと。"
        )
    },
    "DEV": {
        "name": "LaruNexus Architect",
        "role": "Full Stack Engineer",
        "instructions": (
            "あなたはエンジニアです。調査の過程を透明化してください。"
            "「ファイルを確認します」「該当コードが見つかりました」など、進捗を共有しながら進めてください。"
        )
    },
    "INFRA": {
        "name": "Site Reliability Engineer",
        "role": "SRE & Security",
        "instructions": "サーバー監視、Renderデプロイ確認、セキュリティチェックを行ってください。"
    }
}

async def determine_target_department(command: str):
    prompt = f"指示: {command}\n適切な部署を選んでください: DEV (開発), INFRA (インフラ), CENTRAL (その他)。回答は部署名のみ。"
    try:
        res = await asyncio.to_thread(model.generate_content, prompt)
        dept = res.text.strip().upper()
        return dept if dept in DEPT_PERSONAS else "CENTRAL"
    except: return "CENTRAL"

async def run_strategic_council(topic: str, requester: str):
    await manager.broadcast({"type": "LOG", "channelId": requester, "payload": {"msg": f"🏛️ 戦略会議: {topic}", "type": "thinking"}})
    opinions = []
    for dept in ["DEV", "INFRA"]:
        prompt = f"議題: {topic}\n{dept}の立場から意見を述べてください。"
        res = await asyncio.to_thread(model.generate_content, prompt)
        opinions.append(f"**{dept}**: {res.text}")
        await manager.broadcast({"type": "LOG", "channelId": requester, "payload": {"msg": f"**{dept}**: {res.text}", "type": "gemini"}})
    
    summary = await asyncio.to_thread(model.generate_content, f"意見を統合して結論を出してください:\n{chr(10).join(opinions)}")
    await manager.broadcast({"type": "LOG", "channelId": requester, "payload": {"msg": f"⚖️ **結論**\n{summary.text}", "type": "sys"}})

async def process_command(command: str, current_channel: str):
    # 1. ユーザーの指示をログ出力
    await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": f"Cmd: {command}", "type": "user"}})
    
    # 2. 設定情報の注入
    settings = get_project_settings(current_channel)
    credentials_info = ""
    if settings and (settings['email'] or settings['password'] or settings['memo']):
        credentials_info = (
            f"\n\n【極秘：登録済み認証情報】\n"
            f"プロジェクトID: {current_channel}\n"
            f"Email: {settings['email']}\n"
            f"Password: {settings['password']}\n"
            f"Login Type: {settings['login_type']}\n"
            f"Memo: {settings['memo']}\n"
            f"※この情報はユーザーには隠蔽されていますが、あなたは自由に使用できます。"
        )

    # 3. ペルソナとシステムプロンプト (Phase 2: 戦略モード搭載)
    persona = DEPT_PERSONAS.get(current_channel, DEPT_PERSONAS["CENTRAL"])
    system_prompt = (
        f"あなたは{persona['name']}。\n{persona['instructions']}{credentials_info}\n\n"
        "【重要: 戦略的タスク遂行 (Strategic Mode)】\n"
        "複雑な依頼（例: 複数ページの巡回、比較調査、長時間の開発作業）を受けた場合は、"
        "いきなり操作を始めず、**まず `manage_mission` ツールで計画を立ててください。**\n"
        "1. `manage_mission('create', '...')` で目標を宣言。\n"
        "2. `manage_mission('add_tasks', 'A実行, B実行...')` で手順を分解。\n"
        "3. 実行中は `update_step` で進捗を管理し、得られた情報は `save_memo` で保存。\n"
        "4. 迷ったら `read` で自分の現在地を確認。\n\n"
        "【重要: 視覚操作 (Visual Mode)】\n"
        "画面操作時は `browser_screenshot` を使い、画像内の**「赤い数字（ID）」**を見て、"
        "**必ず `click_element_by_id(id)` で操作**してください。\n"
        "※ただしログイン画面だけは `perform_login` を最優先してください。\n\n"
        "【ルール】\n"
        "・Function Callのみを使用すること（テキストでの言い訳禁止）。"
    )

    history = [{"role": "user", "parts": [system_prompt]}]
    past = get_channel_logs(current_channel, 8) 
    for p in past:
        role = "user"
        content = p['msg']
        if p['type'] == 'user': role = "user"
        elif p['type'] == 'gemini': role = "model"
        elif p['type'] in ['browser', 'thinking', 'sys']:
            role = "model"
            content = f"（システムログ）: {p['msg']}"
        history.append({"role": role, "parts": [content]})
    
    history.append({"role": "user", "parts": [f"指示: {command}"]})

    chat = model.start_chat(history=history)

    # 安全送信関数
    async def safe_send_message(content_to_send):
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = await asyncio.to_thread(chat.send_message, content_to_send)
                if not response.candidates: raise Exception("Empty candidates")
                return response
            except IndexError:
                print(f"⚠️ [Attempt {attempt+1}] IndexError (SDK Bug). Retrying...")
                await asyncio.sleep(2)
            except Exception as e:
                print(f"🔄 Retry ({attempt+1}/{max_retries}): {e}")
                await asyncio.sleep((attempt + 1) * 2)
        return None

    try:
        # 5. 初回リクエスト
        response = await safe_send_message(command)
        if not response:
            await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": "⚠️ AI応答エラー", "type": "error"}})
            return

        # 6. 実行ループ
        for i in range(15): # タスクが複雑になるため回数を増加
            if not response.candidates: break

            part_with_fc = next((p for p in response.parts if p.function_call), None)
            text_part = "".join([p.text for p in response.parts if not p.function_call])

            # 鬼軍曹ロジック
            if not part_with_fc:
                if text_part:
                    is_fake_code = "Action:" in text_part or "print(" in text_part or "browser_" in text_part
                    if is_fake_code or ("完了" not in text_part and "終了" not in text_part and i < 12):
                        print(f"👮 [{current_channel}] ツール不使用検知(Turn {i})。")
                        retry_success = False
                        current_text_part = text_part 
                        for retry_count in range(2): 
                            msg = "続きを。状況報告不要。アクション（Function Call）を行え。"
                            if "mission" in command or "計画" in command:
                                msg += " 必要なら `manage_mission` を使え。"
                            
                            history.append({"role": "model", "parts": [current_text_part]})
                            history.append({"role": "user", "parts": [msg]})
                            response = await safe_send_message(msg)
                            if not response: break
                            
                            part_with_fc = next((p for p in response.parts if p.function_call), None)
                            current_text_part = "".join([p.text for p in response.parts if not p.function_call])
                            if part_with_fc:
                                retry_success = True
                                break 
                        if not retry_success: break 
                    else: break
                else: break

            # 7. ツール実行
            if part_with_fc:
                fc = part_with_fc.function_call
                fname, args = fc.name, fc.args
                await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": f"🔧 {fname}...", "type": "thinking"}})
                
                res = "Error"
                safe_args = dict(args)
                
                # ★ここで channel_id を自動注入
                if fname == "manage_mission":
                    res = await manage_mission(safe_args.get("action"), current_channel, safe_args.get("data"))
                elif fname == "read_github_content": res = await read_github_content(safe_args.get("target_repo"), safe_args.get("file_path"))
                elif fname == "commit_github_fix": res = await commit_github_fix(safe_args.get("target_repo"), safe_args.get("file_path"), safe_args.get("new_content"), safe_args.get("commit_message"))
                elif fname == "fetch_repo_structure": res = await fetch_repo_structure(safe_args.get("target_repo"))
                elif fname == "perform_login": res = await perform_login(safe_args.get("url"), safe_args.get("email"), safe_args.get("password"))
                elif fname == "search_codebase": res = await search_codebase(safe_args.get("target_repo"), safe_args.get("query"))
                elif fname == "check_render_status": res = await check_render_status()
                elif fname == "run_terminal_command": res = await run_terminal_command(safe_args.get("command"))
                elif fname == "browser_navigate": res = await browser_navigate(safe_args.get("url"))
                elif fname == "browser_screenshot": res = await browser_screenshot()
                # Phase 1 の視覚クリックツール
                elif fname == "click_element_by_id": res = await click_element_by_id(int(safe_args.get("id")))
                elif fname == "browser_click": res = await browser_click(safe_args.get("target"))
                elif fname == "browser_type": res = await browser_type(safe_args.get("target"), safe_args.get("text"))
                elif fname == "browser_scroll": res = await browser_scroll(safe_args.get("direction"))
                elif fname == "run_test_validation": res = await run_test_validation(safe_args.get("target_file"), safe_args.get("test_code"))

                role_res = {'result': str(res)}
                if "Error" in str(res): role_res['result'] = f"ERROR: {str(res)}"

                response = await safe_send_message(genai.protos.Content(
                    role='function', parts=[genai.protos.Part(function_response=genai.protos.FunctionResponse(name=fname, response=role_res))]))
                
                if not response: break
            else:
                break
        
        # 8. 最終応答
        if response and response.candidates:
            final_text = "".join([p.text for p in response.parts if not p.function_call])
            if final_text:
                await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": final_text, "type": "gemini"}})

    except Exception as e:
        await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": f"Error: {e}", "type": "error"}})
        
# --- Model Init ---
# 安全設定：意図的なブロックを防ぐため、すべてのフィルタをOFFにします
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]

model = genai.GenerativeModel(
    model_name='gemini-2.0-flash',
    safety_settings=safety_settings,
    tools=[
        manage_mission,  # ★追加: 戦略脳
        perform_login, click_element_by_id, # Phase 1の最強ツールたち
        commit_github_fix, read_github_content, fetch_repo_structure, search_codebase,
        check_render_status, run_terminal_command, run_test_validation,
        browser_navigate, browser_screenshot, browser_click, browser_type, browser_scroll
    ]
)

# --- websocket_endpoint (修正版) ---
@app.websocket("/ws/{channel_id}")
async def websocket_endpoint(websocket: WebSocket, channel_id: str):
    await manager.connect(websocket)
    try:
        # ★追加: 接続直後に、DBから過去ログを取得してフロントエンドに送信
        history = get_channel_logs(channel_id, 50)
        await websocket.send_json({"type": "HISTORY_SYNC", "data": history, "channelId": channel_id})
        
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            if payload.get("type") == "REALTIME_INPUT":
                img = payload.get("image")
                txt = payload.get("text", "Analyze this")
                await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": "👁️ Vision Processing...", "type": "thinking"}})
                chat = model.start_chat(history=[])
                res = await asyncio.to_thread(chat.send_message, [txt, {"mime_type": "image/jpeg", "data": img}])
                await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": res.text, "type": "gemini"}})
            
            elif payload.get("command"):
                asyncio.create_task(process_command(payload.get("command"), channel_id))
    except: manager.disconnect(websocket)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 GENESIS DEV-ONLY MODE STARTED")
    asyncio.create_task(system_pulse())
    asyncio.create_task(immune_system_loop())
    yield
    print("💤 SHUTDOWN")

app.router.lifespan_context = lifespan

# ★重要: Next.jsの静的ファイル配信設定（404エラー対策）
if os.path.exists("out"):
    # _next フォルダ（JS, CSSチャンク）
    app.mount("/_next", StaticFiles(directory="out/_next"), name="next")
    # ルートフォルダ（index.html, faviconなど）
    app.mount("/", StaticFiles(directory="out", html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)