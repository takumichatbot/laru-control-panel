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

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # ログテーブル
    c.execute('''CREATE TABLE IF NOT EXISTS logs
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, channel_id TEXT, timestamp TEXT, msg TEXT, type TEXT, image_url TEXT)''')
    # KPIテーブル
    c.execute('''CREATE TABLE IF NOT EXISTS kpi_scores
                 (dept TEXT PRIMARY KEY, score INTEGER, streak INTEGER, last_eval TEXT)''')
    
    depts = ["CENTRAL", "DEV", "TRADING", "INFRA"]
    for d in depts:
        c.execute("INSERT OR IGNORE INTO kpi_scores (dept, score, streak, last_eval) VALUES (?, 50, 0, ?)", (d, datetime.now().isoformat()))
    conn.commit()
    conn.close()

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
            # 1. スクリーンショット撮影
            screenshot_bytes = await phantom_browser.page.screenshot(type='jpeg', quality=60)
            img_b64 = base64.b64encode(screenshot_bytes).decode('utf-8')
            await manager.broadcast({
                "type": "LOG", "channelId": "DEV", 
                "payload": {"msg": "📸 Screen Capture", "type": "browser", "imageUrl": f"data:image/jpeg;base64,{img_b64}"}
            })
            
            # 2. ページのテキスト取得
            text = await phantom_browser.page.inner_text('body')
            
            # 3. リンク・ボタン抽出 (JavaScriptの修正版)
            # Pythonの # コメントはJSではエラーになるため削除しました
            interactive_elements = await phantom_browser.page.evaluate('''() => {
                const elements = Array.from(document.querySelectorAll('a, button, input[type="submit"], input[type="button"]'));
                return elements
                    .filter(el => el.innerText.trim().length > 0 && el.offsetParent !== null)
                    .slice(0, 50)
                    .map(el => {
                        let t = el.innerText.trim().replace(/\\n/g, ' ');
                        let h = el.getAttribute('href') || 'button';
                        return `[${t}] -> ${h}`;
                    });
            }''')
            
            links_summary = "\n".join(interactive_elements)
            
            return f"""
Snapshot taken.

=== Page Text (Summary) ===
{text[:2000]}...

=== Interactive Elements (Clickable) ===
{links_summary}
            """
        except Exception as e:
            print(f"Screenshot Error: {e}") # ログにエラーを出す
            return f"Shot Error: {e}"

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

# --- AI Personas & Logic ---
DEPT_PERSONAS = {
    "CENTRAL": {
        "name": "LaruNexus GENESIS",
        "role": "CEO Office & Strategy",
        "instructions": "あなたは全権限を持つ統合AIです。ユーザーの意図を汲み取り、適切な専門機能（DEV/INFRA）を呼び出してください。"
    },
    "DEV": {
        "name": "LaruNexus Architect",
        "role": "Full Stack Engineer",
        "instructions": "あなたは自律型エンジニアです。GitHub操作、コード修正、テスト実行を行い、高品質なコードを維持してください。"
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
    await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": f"Cmd: {command}", "type": "user"}})
    
    if "会議" in command:
        await run_strategic_council(command, current_channel)
        return

    target = await determine_target_department(command)
    if target != current_channel:
        current_channel = target
        await manager.broadcast({"type": "CHANNEL_SWITCH", "target": target, "reason": "Redirecting..."})

    url_match = re.search(r'(https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?)', command)
    if url_match:
        await run_autonomous_browser_agent(url_match.group(0), command, current_channel)
        return

    persona = DEPT_PERSONAS.get(current_channel, DEPT_PERSONAS["CENTRAL"])
    
    history = [{"role": "user", "parts": [f"あなたは{persona['name']}。\n指示: {command}"]}]
    past = get_channel_logs(current_channel, 5)
    for p in past: 
        if p['type'] in ['user', 'gemini']:
            history.append({"role": "model" if p['type']=='gemini' else "user", "parts": [p['msg']]})

    chat = model.start_chat(history=history)
    try:
        response = await asyncio.to_thread(chat.send_message, command)
        
        # ★修正: 全パートから関数呼び出しを安全に探す
        for _ in range(5):
            part_with_fc = next((p for p in response.parts if p.function_call), None)
            
            if part_with_fc:
                fc = part_with_fc.function_call
                fname, args = fc.name, fc.args
                print(f"🔧 Tool: {fname}")
                await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": f"🔧 {fname}...", "type": "thinking"}})
                
                res = "Error"
                # 各ツールの実行
                if fname == "read_github_content": res = await read_github_content(args.get("target_repo"), args.get("file_path"))
                elif fname == "commit_github_fix": res = await commit_github_fix(args.get("target_repo"), args.get("file_path"), args.get("new_content"), args.get("commit_message"))
                elif fname == "fetch_repo_structure": res = await fetch_repo_structure(args.get("target_repo"))
                elif fname == "search_codebase": res = await search_codebase(args.get("target_repo"), args.get("query"))
                elif fname == "check_render_status": res = await check_render_status()
                elif fname == "run_terminal_command": res = await run_terminal_command(args.get("command"))
                elif fname == "browser_navigate": res = await browser_navigate(args.get("url"))
                elif fname == "browser_screenshot": res = await browser_screenshot()
                elif fname == "browser_click": res = await browser_click(args.get("target"))
                elif fname == "browser_type": res = await browser_type(args.get("target"), args.get("text"))
                elif fname == "browser_scroll": res = await browser_scroll(args.get("direction"))
                elif fname == "run_test_validation": res = await run_test_validation(args.get("target_file"), args.get("test_code"))

                if "Error" in str(res): update_kpi(current_channel, -2, fname)
                else: update_kpi(current_channel, 5, fname)

                response = await asyncio.to_thread(chat.send_message, genai.protos.Content(
                    role='function', parts=[genai.protos.Part(function_response=genai.protos.FunctionResponse(name=fname, response={'result': str(res)}))]))
            else:
                break
        
        # ★修正: テキスト部分だけを安全に取り出す（response.textは使わない）
        final_text = "".join([p.text for p in response.parts if not p.function_call])
        if not final_text: final_text = "✅ 処理完了"

        await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": final_text, "type": "gemini"}})
    except Exception as e:
        await manager.broadcast({"type": "LOG", "channelId": current_channel, "payload": {"msg": f"Error: {e}", "type": "error"}})
                
# --- Model Init ---
model = genai.GenerativeModel(
    model_name='gemini-2.0-flash',
    tools=[
        commit_github_fix, read_github_content, fetch_repo_structure, search_codebase,
        check_render_status, run_terminal_command, run_test_validation,
        browser_navigate, browser_screenshot, browser_click, browser_type, browser_scroll
    ]
)

@app.websocket("/ws/{channel_id}")
async def websocket_endpoint(websocket: WebSocket, channel_id: str):
    await manager.connect(websocket)
    try:
        await websocket.send_json({"type": "HISTORY_SYNC", "data": get_channel_logs(channel_id), "channelId": channel_id})
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            if payload.get("type") == "REALTIME_INPUT":
                # Vision Analysis
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