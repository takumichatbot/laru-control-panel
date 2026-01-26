import asyncio
import json
import base64
import os
import sys
import glob

# プロトコルバッファ対策
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

# --- 診断: 必要なライブラリのチェック ---
print("🔍 DIAGNOSTIC: Checking imports...")
try:
    import re
    import sqlite3
    import subprocess
    import time
    import psutil
    from dotenv import load_dotenv
    load_dotenv()
    from datetime import datetime
    from contextlib import asynccontextmanager
    from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    from fastapi.staticfiles import StaticFiles
    import google.generativeai as genai
    import httpx
    print("✅ Imports successful.")
except ImportError as e:
    print(f"❌ CRITICAL IMPORT ERROR: {e}")
    # サーバーを落とさず、ログに残すために処理を続行（後でエラーになるがログは残る）

# Playwrightは重いので失敗してもスルーする設定
try:
    from playwright.async_api import async_playwright
    HAS_PLAYWRIGHT = True
except ImportError:
    print("⚠️ Playwright not found. Browser features disabled.")
    HAS_PLAYWRIGHT = False

# --- Configuration ---
API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    print("⚠️ WARNING: GEMINI_API_KEY is not set. AI features will fail.")
else:
    try:
        genai.configure(api_key=API_KEY)
    except Exception as e:
        print(f"⚠️ AI Config Error: {e}")

# --- Server Setup ---
app = FastAPI()

# ★重要: CORS (通信許可) を最大まで緩める（接続不良の原因排除）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # すべてのオリジンを許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 診断用: ファイルシステムスキャン ---
def scan_directory():
    """現在のディレクトリにあるファイルを全リストアップしてログに出す"""
    print("\n📂 --- FILE SYSTEM SCAN ---")
    files = glob.glob("**/*", recursive=True)
    for f in files[:50]: # 多すぎるとログが流れるので50個まで
        print(f" - {f}")
    if len(files) > 50:
        print(f" ... and {len(files)-50} more files.")
    print("----------------------------\n")

# --- Database Setup ---
DB_PATH = "/opt/render/project/src/nexus_genesis.db" if os.getenv("RENDER") else "nexus_genesis.db"

def init_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS logs
                     (id INTEGER PRIMARY KEY AUTOINCREMENT, channel_id TEXT, timestamp TEXT, msg TEXT, type TEXT, image_url TEXT)''')
        c.execute('''CREATE TABLE IF NOT EXISTS kpi_scores
                     (dept TEXT PRIMARY KEY, score INTEGER, streak INTEGER, last_eval TEXT)''')
        depts = ["CENTRAL", "DEV", "TRADING", "INFRA"]
        for d in depts:
            c.execute("INSERT OR IGNORE INTO kpi_scores (dept, score, streak, last_eval) VALUES (?, 50, 0, ?)", (d, datetime.now().isoformat()))
        conn.commit()
        conn.close()
        print("✅ Database initialized.")
    except Exception as e:
        print(f"❌ DB Init Error: {e}")

# --- WebSocket Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"🔌 WebSocket Connected. Total: {len(self.active_connections)}")
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections: self.active_connections.remove(websocket)
        print("🔌 WebSocket Disconnected.")
    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try: await connection.send_json(message)
            except: self.disconnect(connection)

manager = ConnectionManager()

# --- Routes ---

# サーバー生存確認用 (Frontendがこれを叩いて生死を確認する)
@app.get("/")
@app.get("/health")
@app.get("/api/status")
def health_check():
    return {
        "status": "online",
        "service": "LaruNexus DIAGNOSTIC MODE",
        "timestamp": datetime.now().isoformat(),
        "db_path": DB_PATH
    }

# 静的ファイル配信 (404対策)
if os.path.exists("out"):
    print("✅ 'out' directory found. Serving static files.")
    app.mount("/_next", StaticFiles(directory="out/_next"), name="next")
    app.mount("/", StaticFiles(directory="out", html=True), name="static")
else:
    print("⚠️ 'out' directory NOT found. Frontend might be 404.")

# --- GitHub & Tools Logic (Simplified) ---
# GitHubトークン確認
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    print("⚠️ GITHUB_TOKEN not set.")

async def run_terminal_command(command: str):
    print(f"💻 Executing: {command}")
    try:
        proc = await asyncio.create_subprocess_shell(command, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, stderr = await proc.communicate()
        res = (stdout.decode() + stderr.decode()).strip()
        return res[:1000]
    except Exception as e: return f"Error: {e}"

# --- AI Model Setup ---
# ツール定義（エラーが出ないよう最小限かつ堅牢に）
tools_list = [run_terminal_command]
if HAS_PLAYWRIGHT:
    # Playwrightがある場合のみブラウザ機能を追加（ここでは定義省略して軽量化）
    pass 

model = None
if API_KEY:
    model = genai.GenerativeModel('gemini-2.0-flash-exp', tools=tools_list)

async def process_command(command: str, channel_id: str):
    print(f"📨 Command received: {command}")
    if not model:
        await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": "AI Model not loaded (No API Key).", "type": "error"}})
        return

    try:
        # シンプルに応答
        prompt = f"System: あなたはシステム管理者です。\nUser: {command}"
        response = await asyncio.to_thread(model.generate_content, prompt)
        await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": response.text, "type": "gemini"}})
    except Exception as e:
        print(f"❌ AI Error: {e}")
        await manager.broadcast({"type": "LOG", "channelId": channel_id, "payload": {"msg": f"AI Error: {e}", "type": "error"}})

# --- WebSocket Endpoint ---
@app.websocket("/ws/{channel_id}")
async def websocket_endpoint(websocket: WebSocket, channel_id: str):
    await manager.connect(websocket)
    try:
        # 接続成功メッセージを送る
        await websocket.send_json({
            "type": "LOG", 
            "channelId": channel_id, 
            "payload": {"msg": "🟢 SERVER CONNECTED (Diagnostic Mode)", "type": "sys"}
        })
        
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            if payload.get("command"):
                asyncio.create_task(process_command(payload.get("command"), channel_id))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"❌ WS Error: {e}")
        manager.disconnect(websocket)

# --- Lifespan (Startup) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n🚀 STARTING SERVER in DIAGNOSTIC MODE...")
    
    # 1. データベース初期化
    init_db()
    
    # 2. ファイルスキャン実行（ログに出す）
    scan_directory()
    
    print("✅ Startup checks complete. Waiting for connections...\n")
    yield
    print("💤 Shutting down.")

app.router.lifespan_context = lifespan

# --- Entry Point ---
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"🔌 Binding to port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)