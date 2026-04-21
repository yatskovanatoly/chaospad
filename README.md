# Chaos Pad

A full-screen pad for pointer-driven synthesis: **Web Audio**, gesture sync over **WebSocket**, several visualizations, and a **Buffer** mode (waveform shaped by drawing on the pad).

See **[`ARCHITECTURE.md`](ARCHITECTURE.md)** for how the code and data flow are structured.

## Run

```bash
npm install
```

Frontend only (Next.js):

```bash
npm run dev
```

Frontend + WebSocket relay (default port **3003**):

```bash
npm run dev:ws
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

- **`NEXT_PUBLIC_WS_URL`** — WebSocket URL (default `ws://localhost:3003`). See [`src/config.ts`](src/config.ts).

## Build

```bash
npm run build
npm start
```
