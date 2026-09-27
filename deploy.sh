#!/bin/bash
# 一键部署脚本：同步源码到服务器并构建
# 使用方法：
#   chmod +x deploy.sh
#   ./deploy.sh

set -e

SERVER_USER="ubuntu"
SERVER_IP="43.165.4.66"
REMOTE_DIR="/home/ubuntu/lifebook"
DEPLOY_LOG="deploy_log"

# 部署失败时记录日志
trap 'echo "[$(date "+%Y-%m-%d %H:%M:%S")] 部署完成：失败" >> "$DEPLOY_LOG"' ERR

echo "📁 确保远程目录存在..."
ssh "${SERVER_USER}@${SERVER_IP}" "mkdir -p ${REMOTE_DIR}"

echo "📤 同步源码到服务器..."
rsync -avz \
  --exclude=.git \
  --exclude=node_modules \
  --exclude=dist \
  ./ "${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/"

echo "📦 安装前端依赖..."
ssh "${SERVER_USER}@${SERVER_IP}" "cd ${REMOTE_DIR} && npm install"

echo "🔨 在服务器上构建前端..."
ssh "${SERVER_USER}@${SERVER_IP}" "cd ${REMOTE_DIR} && npm run build"

echo "📂 复制构建产物到 Nginx 目录..."
ssh "${SERVER_USER}@${SERVER_IP}" "sudo mkdir -p /var/www/lifebook && sudo rsync -avz --delete ${REMOTE_DIR}/dist/ /var/www/lifebook/"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 部署完成：成功" >> "$DEPLOY_LOG"
