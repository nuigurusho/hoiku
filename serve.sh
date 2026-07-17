#!/bin/sh
# ゲームパックをローカルサーバーで起動します
cd "$(dirname "$0")"
echo "ブラウザで http://localhost:8765 を開いてください(Ctrl+Cで終了)"
python3 -m http.server 8765 2>/dev/null || python -m http.server 8765
