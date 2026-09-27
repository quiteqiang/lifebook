#!/bin/bash
# 启动语音识别后端（默认 8000 端口）
# 用法: ./server/start.sh [端口]
set -e
PORT="${1:-8000}"
VENV="${WHISPER_VENV:-$HOME/.venvs/whisper}"

if [ ! -d "$VENV" ]; then
  echo "未找到虚拟环境 $VENV，正在创建..."
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -r "$(dirname "$0")/requirements.txt"
fi

exec "$VENV/bin/uvicorn" main:app --host 127.0.0.1 --port "$PORT" \
  --app-dir "$(dirname "$0")"
