#!/bin/bash
# Amazon Linux 2023 — Bun + build lila-ui + nginx static
# NAKAMA_PUBLIC_HOST / PORT must match server (port 80 if nginx proxies on server).

set -euo pipefail

NAKAMA_HOST="${NAKAMA_HOST:-54.160.155.191}"
NAKAMA_PORT="${NAKAMA_PORT:-80}"
NAKAMA_KEY="${NAKAMA_KEY:-nebula-strike-prod-key}"
PUBLIC_IP="${PUBLIC_IP:-3.91.83.65}"

echo "== Packages: git, nginx =="
sudo dnf -y update
sudo dnf install -y git nginx unzip

echo "== nginx base config (only conf.d servers; avoids duplicate listen 80) =="
sudo tee /etc/nginx/nginx.conf >/dev/null <<'MAIN'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;

include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    keepalive_timeout   65;
    types_hash_max_size 4096;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    include /etc/nginx/conf.d/*.conf;
}
MAIN

echo "== Bun =="
if [ ! -x "$HOME/.bun/bin/bun" ]; then
  curl -fsSL https://bun.sh/install | bash
fi
export PATH="$HOME/.bun/bin:$PATH"
grep -q '.bun/bin' ~/.bashrc 2>/dev/null || echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

echo "== git identity =="
git config --global user.name "yash717"
git config --global user.email "yash717@users.noreply.github.com"

echo "== Clone / update lila-ui =="
cd /home/ec2-user
if [ ! -d lila-ui ]; then
  git clone https://github.com/yash717/lila-ui.git
fi
cd lila-ui
git pull --ff-only

echo "== Production build (VITE_* = env at build time) =="
export VITE_NAKAMA_HOST="${NAKAMA_HOST}"
export VITE_NAKAMA_PORT="${NAKAMA_PORT}"
export VITE_NAKAMA_SERVER_KEY="${NAKAMA_KEY}"
export VITE_NAKAMA_USE_SSL=false

bun install
bun run build

echo "== nginx static site =="
sudo mkdir -p /var/www/lila-ui
sudo rm -rf /var/www/lila-ui/dist
sudo cp -r dist /var/www/lila-ui/
sudo chown -R nginx:nginx /var/www/lila-ui

sudo tee /etc/nginx/conf.d/lila-ui.conf >/dev/null <<'NGINX'
server {
    listen 80 default_server;
    server_name _;
    root /var/www/lila-ui/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

sudo rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "== Done. UI: http://${PUBLIC_IP}/"
echo "Ensure security group allows TCP 80 from the internet."
