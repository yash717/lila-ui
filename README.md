# Nebula Strike (client)

React + Vite front end for the Nebula Strike multiplayer Tic-Tac-Toe game. It talks to a **Nakama** server over HTTP and WebSockets.

## Configuration (environment)

All runtime connection settings use **Vite env vars** (prefixed with `VITE_`). They are baked in at **build time** for production static builds.

| Variable | Description |
|----------|-------------|
| `VITE_NAKAMA_HOST` | Nakama HTTP/WS host (e.g. `127.0.0.1` locally, or your EC2 public hostname / ALB) |
| `VITE_NAKAMA_PORT` | Nakama client port (default `7350`) |
| `VITE_NAKAMA_SERVER_KEY` | Must match Nakama `socket.server_key` / `NAKAMA_SERVER_KEY` on the server |
| `VITE_NAKAMA_USE_SSL` | `true` if the browser uses `https`/`wss` to Nakama (e.g. TLS-terminated reverse proxy) |

Copy `.env.example` to `.env` for local development. For production builds on EC2:

```bash
# Example: build with env from the shell or a .env.production file (not committed)
export VITE_NAKAMA_HOST=your-ec2-or-domain
export VITE_NAKAMA_PORT=7350
export VITE_NAKAMA_SERVER_KEY=your-production-key
export VITE_NAKAMA_USE_SSL=false
bun install
bun run build
```

Serve the `dist/` folder with any static file server (nginx, Caddy, `vite preview`, etc.). Point the same env values at wherever Nakama is reachable from the browser.

**EC2 bootstrap:** `deploy/ec2-ui-setup.sh` installs git, nginx, Bun, clones `yash717/lila-ui`, builds with `VITE_*` pointing at your Nakama host (e.g. server public IP and port **80** if nginx fronts Nakama), and serves `dist/` on port 80. Open the **security group** for TCP **80**.

## Scripts

| Command | Purpose |
|---------|---------|
| `bun run dev` | Dev server (port 3000, host `0.0.0.0`) |
| `bun run build` | Production bundle to `dist/` |
| `bun run preview` | Preview the production build |
| `bun run lint` | Typecheck |
| `bun run lint:eslint` | ESLint |

## Repository layout

This folder is intended to be the root of the **`lila-ui`** GitHub repo (UI only). Backend lives in the sibling **`nebula-server`** project (`lila-server` repo).

## Security

- Never commit real API keys or database URLs.
- If a `VITE_*` or server key was ever exposed, rotate it in Nakama and rebuild the client.
