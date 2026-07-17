@echo off
cd /d %~dp0
echo ブラウザで http://localhost:8765 を開いてください(閉じるときはこの窓を閉じる)
start http://localhost:8765
py -m http.server 8765 || python -m http.server 8765
