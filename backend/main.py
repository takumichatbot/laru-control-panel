import asyncio
import json
import httpx
import random
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai

# --- Configuration ---
# 社長の指定した名前で環境変数を読み込みます
API_KEY = "YOUR_GEMINI_API_KEY" # 実際は os.getenv("GEMINI_API_KEY") 推奨
genai.configure(api_key=API_KEY)

# 最新の 2.5-flash モデルを指定
model = genai.GenerativeModel('gemini-2.5-flash')

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

# --- Nexus API Connector ---
async def call_nexus_api(endpoint: str, method: str = "GET", payload: dict = None):
    """Next.js側の既存API(src/app/api/...)を叩く"""
    async with httpx.AsyncClient() as client:
        url = f"http://localhost:3000/api/{endpoint}"
        try:
            if method == "POST":
                res = await client.post(url, json=payload, timeout=60.0)
            else:
                res = await client.get(url, params=payload, timeout=10.0)
            return res.json()
        except Exception as e:
            return {"status": "error", "message": str(e)}

# --- Autonomous Agent Logic ---
async def process_command(command: str):
    """社長の指示をGemini 2.5 Flashで解析し実行する"""
    await manager.broadcast({"type": "LOG", "payload": {"msg": f"Thinking: 「{command}」の解析と実行戦略を策定中...", "type": "thinking"}})

    # システムプロンプト（エンジニアリング特化）
    system_prompt = f"""
    あなたは齋藤社長の専属AI『LaruNexus v5.0』です。
    Gemini 2.5 Flash の高速な推論能力を用いて、以下の資産を管理してください。
    - LARUbot_homepage (リポジトリ)
    - flastal (Webサービス)
    - laru-control-panel (このシステム)
    
    指示: {command}
    """

    try:
        # Gemini による思考
        response = await asyncio.to_thread(model.generate_content, system_prompt)
        ai_reply = response.text

        # もし特定のURL確認が含まれる場合、自動でBrowser APIを回す（自律動作の例）
        if "確認" in command or "見て" in command:
             # 例として flastal を確認
             await manager.broadcast({"type": "LOG", "payload": {"msg": "Action: Browser Agent を起動し、サイトの視覚データをスキャンします。", "type": "system"}})
             # 実際の api/browser/route.ts を叩く
             # result = await call_nexus_api("browser", "POST", {"url": "https://flastal.net", "action": "scrape"})

        await manager.broadcast({"type": "LOG", "payload": {"msg": ai_reply, "type": "ai"}})

    except Exception as e:
        await manager.broadcast({"type": "LOG", "payload": {"msg": f"Neural Error: {str(e)}", "type": "error"}})

# --- Real-time Systems Monitor ---
async def system_pulse():
    """1秒おきに実測値を監視しフロントエンドへ流す"""
    while True:
        if manager.active_connections:
            # KPIデータ送信
            await manager.broadcast({
                "type": "KPI_UPDATE",
                "data": {
                    "time": datetime.now().strftime("%H:%M:%S"),
                    "users": random.randint(45, 65),
                    "cost": round(random.uniform(12.0, 14.5), 2)
                }
            })
            
            # GitHub Monitor (api/monitor/route.ts を使用)
            status = await call_nexus_api("monitor", "POST", {"repository": "LARUbot_homepage"})
            if status.get("status") == "in_progress":
                await manager.broadcast({"type": "LOG", "payload": {"msg": f"GITHUB: {status.get('stepName')} 実行中...", "type": "system"}})

            # プロジェクトステータス (ランダム性を持たせた監視)
            await manager.broadcast({
                "type": "PROJECT_UPDATE",
                "data": [
                    {"id": "1", "name": "LARUbot_HP", "status": "online", "load": random.randint(30, 45), "repo": "LARUbot_homepage"},
                    {"id": "2", "name": "Flastal API", "status": "online", "load": random.randint(10, 25), "repo": "flastal-backend"},
                    {"id": "3", "name": "Control Panel", "status": "online", "load": random.randint(60, 80), "repo": "laru-control-panel"}
                ]
            })
        await asyncio.sleep(1)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            cmd_payload = json.loads(data)
            asyncio.create_task(process_command(cmd_payload.get("command", "")))
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(system_pulse())