import google.generativeai as genai

# パスを気にせず、実行時にキーを聞くスタイル
api_key = input("🔑 ここに GEMINI_API_KEY を貼り付けて Enter を押してください: ").strip()

if not api_key:
    print("❌ キーが入力されませんでした。")
else:
    print(f"\n📡 Googleサーバーに問い合わせ中...")
    try:
        genai.configure(api_key=api_key)
        print("\n✅ 【利用可能なモデル一覧】")
        found_stable = False
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
                if "gemini-1.5-flash" in m.name:
                    found_stable = True
        
        print("-" * 30)
        if found_stable:
            print("🎉 'gemini-1.5-flash' が見つかりました！これを使えば解決します。")
        else:
            print("⚠️ 1.5-flashが見当たりません。リストにあるモデルを選んでください。")
            
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        print("キーが正しいか、インターネットに繋がっているか確認してください。")
