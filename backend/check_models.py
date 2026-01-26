import google.generativeai as genai
import os
from dotenv import load_dotenv

# ★ここを修正: backendフォルダの中にある.envを指定して読み込む
load_dotenv(dotenv_path="backend/.env")

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    # まだ見つからない場合のデバッグ用
    print(f"❌ GEMINI_API_KEY が見つかりません。")
    print(f"現在の場所: {os.getcwd()}")
    print("backend/.env ファイルが存在するか確認してください。")
else:
    print(f"✅ APIキーを読み込みました")
    genai.configure(api_key=api_key)
    print("📋 利用可能なモデル一覧:")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
    except Exception as e:
        print(f"エラー: {e}")