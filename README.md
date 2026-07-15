# chaospad

A self-contained React touch pad with generative audio and cursor glow animation. Pointer events are synced over WebSocket.

## Installation

### From npm

```bash
npm install chaospad
```

Peer dependencies (install if not already present):

```bash
npm install react react-dom
```

Works with React 18+.

### From GitHub

```bash
npm install github:yatskovanatoly/chaospad
```

### Local development (link from this repo)

```bash
# in chaospad repo
npm run build
npm link

# in your app
npm link chaospad
```

Or install directly from a local path:

```bash
npm install /path/to/chaospad
```

## Usage

```tsx
import { Chaospad } from 'chaospad'

export function App() {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Chaospad
        config={{
          volume: 1,
          reverbLevel: 0.5,
          release: 0.5,
          remoteRelease: 0.5,
          quantize: 'chromatic',
        }}
      />
    </div>
  )
}
```

For a remote WebSocket relay, pass `wsUrl` explicitly:

```tsx
<Chaospad config={{ wsUrl: 'wss://ws.example.com' }} />
```

By default the client connects to `ws://localhost:3003`. Start the local relay from your app:

```bash
npx chaospad-ws
```

Or add a script to your app's `package.json`:

```json
{
  "scripts": {
    "dev:ws": "chaospad-ws"
  }
}
```

Then run in a separate terminal:

```bash
npm run dev:ws
```

Custom port:

```bash
PORT=3004 npx chaospad-ws
```

Point the client at it:

```tsx
<Chaospad config={{ wsUrl: 'ws://localhost:3004' }} />
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wsUrl` | `string` | `ws://localhost:3003` | WebSocket relay URL |
| `volume` | `number` | `1` | Master volume, 0–1 |
| `reverbLevel` | `number` | `0.5` | Reverb wet level, 0–1 |
| `release` | `number` | `0.5` | Local voice release time (seconds) |
| `remoteRelease` | `number` | `0.5` | Remote voices release time (seconds) |
| `quantize` | `'none' \| 'chromatic'` | `'chromatic'` | Frequency quantization |
| `userId` | `string` | auto | Session user id |
| `glowIntervalMs` | `number` | `50` | Glow spawn interval while held (ms) |
| `glowSize` | `number` | `50` | Glow circle diameter (px) |

`<Chaospad />` is fully self-contained: it mounts WebSocket, audio engine, glow animation (`glow-effect`), and injects its own styles. No external providers required.

Optional: `import 'chaospad/styles.css'` for SSR setups.

## Development (this repo)

```bash
npm run dev          # Next.js demo app
npm run dev:ws       # demo + local ws-server on :3003
npm run ws           # ws relay only
npm run build        # build npm package → dist/
npm run build:demo   # build demo app
```

## WebSocket server

The relay is included as the `chaospad-ws` CLI. It broadcasts pointer events between clients and is not bundled into the React component.
