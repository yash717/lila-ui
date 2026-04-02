##
## Stage 1: Build the React app with Bun
##
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy dependency files first for better layer caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .

# Build-time env: override at `docker build --build-arg ...`
ARG VITE_NAKAMA_HOST=127.0.0.1
ARG VITE_NAKAMA_PORT=7350
ARG VITE_NAKAMA_SERVER_KEY=nebula-strike-dev-key
ARG VITE_NAKAMA_USE_SSL=false

ENV VITE_NAKAMA_HOST=$VITE_NAKAMA_HOST
ENV VITE_NAKAMA_PORT=$VITE_NAKAMA_PORT
ENV VITE_NAKAMA_SERVER_KEY=$VITE_NAKAMA_SERVER_KEY
ENV VITE_NAKAMA_USE_SSL=$VITE_NAKAMA_USE_SSL

RUN bun run build

##
## Stage 2: Serve with nginx
##
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# SPA-friendly nginx config
COPY <<'NGINX' /etc/nginx/conf.d/nebula-strike.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain application/javascript text/css application/json image/svg+xml;
    gzip_min_length 1024;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
