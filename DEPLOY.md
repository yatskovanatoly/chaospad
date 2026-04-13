# Deploying chaospad + WebSocket server

The Next.js app and the WebSocket relay run as **two separate deployments**. The app reads `NEXT_PUBLIC_WS_URL` at **build time** and must point at the public URL of the WS service (`wss://` when the site is served over HTTPS).

## 1. WebSocket server (`chaospad-ws-server`)

### Build and run with Docker

From the `chaospad-ws-server` repository:

```bash
docker build -t chaospad-ws:latest .
docker run -d --name chaospad-ws -p 3003:3003 \
  -e PORT=3003 \
  chaospad-ws:latest
```

Expose the container on a hostname your users can reach (for example behind a TCP load balancer, or with TLS termination that forwards WebSocket upgrades to this port).

### TLS / `wss://`

Browsers require `wss://` when the page is served over HTTPS. Options:

- Terminate TLS at a reverse proxy (nginx, Caddy, Traefik, cloud load balancer) and forward WebSocket traffic to the container on `PORT`.
- Point DNS (e.g. `ws.yourdomain.com`) at that proxy and use `NEXT_PUBLIC_WS_URL=wss://ws.yourdomain.com` when building the app.

### Environment variables (WS server)

| Variable   | Default     | Description        |
| ---------- | ----------- | ------------------ |
| `PORT`     | `3003`      | Listen port        |
| `WS_PORT`  | (unused if `PORT` set) | Same as `PORT` |
| `HOST`     | `0.0.0.0`   | Bind address       |

## 2. chaospad (Next.js app)

### Environment

| Variable               | When to set    | Description                                      |
| ---------------------- | -------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_WS_URL` | **Before** `next build` | Full URL, e.g. `wss://ws.example.com` or `ws://host:3003` |

Local development example (`.env.local`):

```bash
NEXT_PUBLIC_WS_URL=ws://localhost:3003
```

Production: configure the same variable in your hosting provider’s **build** settings (Vercel, Netlify, GitHub Actions, etc.) so the value is present when `next build` runs.

### Build and run

```bash
npm ci
npm run build
npm start
```

For local dev with the in-repo relay:

```bash
npm run dev
```

(`dev` still runs Next.js and `src/ws-server.mjs` together; production should use the containerized server and `NEXT_PUBLIC_WS_URL` pointing at it.)

## 3. Checklist

1. Deploy **chaospad-ws-server** and confirm you can open a WebSocket to its public URL (with correct `ws` / `wss`).
2. Set **`NEXT_PUBLIC_WS_URL`** to that exact public URL.
3. **Rebuild** and deploy **chaospad** (changing `NEXT_PUBLIC_*` requires a new build).

## 4. Firewalls and platforms

- Allow **outbound** WebSockets from users’ browsers to your WS host (and **inbound** to the WS service from the internet or your proxy).
- Some PaaS products only support HTTP services; you may need a VM, container host, or a platform that supports raw TCP/WebSocket services for the relay.
