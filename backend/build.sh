#!/usr/bin/env bash
# エラーが起きたら即停止する設定
set -o errexit

echo "--- 1. Frontend Build (Next.js) ---"
npm install
npm run build

echo "--- 2. Backend Setup (Python) ---"
pip install -r requirements.txt

echo "--- 3. Playwright Browser Install ---"
python -m playwright install chromium

echo "--- 4. Japanese Fonts Setup ---"
# 日本語フォント（Google Noto Sans CJK）をユーザー領域にダウンロード
mkdir -p ~/.fonts
wget -qO ~/.fonts/NotoSansCJKjp-Regular.otf https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf

# フォントキャッシュを更新してOSに認識させる
fc-cache -fv

echo "✅ All Build Steps Completed!"