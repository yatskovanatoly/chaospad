# Chaos Pad

Полноэкранный «пад» для управления синтезом по указателю: **Web Audio**, синхронизация жестов по **WebSocket**, несколько визуализаций и режим **Buffer** (форма волны из рисунка по паду).

Подробно устройство кода и потоков данных — в **[`ARCHITECTURE.md`](ARCHITECTURE.md)**.

## Запуск

```bash
npm install
```

Только фронт (Next.js):

```bash
npm run dev
```

Фронт + ретранслятор WebSocket (по умолчанию порт **3003**):

```bash
npm run dev:ws
```

Открыть [http://localhost:3000](http://localhost:3000).

## Переменные окружения

- **`NEXT_PUBLIC_WS_URL`** — URL WebSocket (по умолчанию `ws://localhost:3003`). См. [`src/config.ts`](src/config.ts).

## Сборка

```bash
npm run build
npm start
```
