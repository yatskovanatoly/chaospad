# Chaos Pad — архитектура

Веб-приложение на **Next.js** (App Router): полноэкранная площадка для управления звуком по касанию/мыши, синхронизация указателей по **WebSocket**, режимы визуализации и отладочная спектрограмма с **общего** аудиовыхода.

## Стек

- **Next.js**, **React**, **TypeScript**, **Tailwind CSS**
- **Zustand** — глобальные сторы настроек и состояния пада
- **Web Audio API** — `AudioEngine` / `Voice`, один **`masterAnalyser`** на суммарный выход
- **ws** — отдельный процесс ретранслятора WebSocket

## Принцип

Синтез и состояние пада живут **вне React-цикла рендеринга**: в Zustand-сторах и singleton-контроллерах. Компоненты отвечают только за обработку DOM-событий и UI; никакой логики `useEffect`-цепочек, `useRef` для голосов и memo-гимнастики.

```mermaid
flowchart TB
  subgraph React [React tree - тонкий слой]
    Pad[PadInputContext pointer handlers]
    Controls[ChaosPadControls]
    Viz[Visualizations]
    Boot[ChaosBootstrap]
  end
  subgraph Stores [Zustand vanilla stores]
    settingsStore
    padEventStore[padEventStore: local, remotes, xyVersion, selfUser, wsSend]
  end
  subgraph Audio [src/audio - vanilla, без React]
    Engine[engine/audioEngineSingleton lazy]
    LocalCtl[controllers/localVoiceController]
    RemoteCtl[controllers/remoteVoicesController]
    VC[controllers/VoiceController]
    Sounds[sounds/* - sine, padWaveform, volumeLfoBuffer, pitchLfoBuffer]
  end
  Pad -->|publishGesture/Hover| padEventStore
  Controls -->|селекторы| settingsStore
  Boot -->|wsBind selfUser, wsSend| padEventStore
  Boot -->|attachAudioControllers| LocalCtl
  Boot -->|attachAudioControllers| RemoteCtl
  Boot -->|subscribe ws| padEventStore
  padEventStore -->|subscribe local + xyVersion| LocalCtl
  padEventStore -->|onRemote| RemoteCtl
  settingsStore -->|subscribe| LocalCtl
  settingsStore -->|subscribe| RemoteCtl
  LocalCtl --> VC
  RemoteCtl --> VC
  VC --> Engine
  VC -->|"getSoundMode(id).attach"| Sounds
  Viz -->|"селектор local.xyArray, xyVersion"| padEventStore
  Viz -->|селектор vizId| settingsStore
```

## Дерево компонентов (страница)

[`src/app/page.tsx`](src/app/page.tsx):

1. **`WebSocketProvider`** — соединение, `userId`, цвет, `send`, `subscribe`. Никакой бизнес-логики, только канал.
2. **`ChaosPad`** — рендерит [`ChaosBootstrap`](src/components/ChaosPad/ChaosBootstrap.tsx), [`Pad`](src/components/ChaosPad/Pad/Pad.tsx) и [`ChaosPadControls`](src/components/ChaosPad/ChaosPadControls.tsx).

## Слои данных

`src/state/` — UI-сторы (`padEventStore`, `settingsStore`) и хук `usePadEvents` для визуализаций. `src/audio/` — весь синтез: `engine/` (AudioEngine, Voice, singleton, helpers), `sounds/` (виды звуков на интерфейсе `SoundMode`), `controllers/` (мост сторов и движка через `VoiceController`), `padWaveform.ts` (буфер бинов).

### State stores ([`src/state/`](src/state/))

#### [`settingsStore`](src/state/settingsStore.ts)

Хранит `vizId`, `spectralDebugOpen`, `release`, `reverbLevel`, `volume`, `quantize`, `soundModeId` и сеттеры. Используется **через селекторы**: `useSettingsStore(s => s.volume)`.

#### [`padEventStore`](src/state/padEventStore.ts)

| Поле | Назначение |
|------|------------|
| `selfUser` | `{ userId, color }` локального клиента (заполняется в `ChaosBootstrap` через `wsBind`). |
| `wsSend` | Инжектируемый трансмиттер для WS-сообщений. |
| `local` | Снимок последнего локального жеста (`UserPadState`), включая собственный `xyArray` (256 бинов). На `wsBind` создаётся shell с `updatedAt: 0` и пустым `xyArray` — в этот же буфер пишет hover до жеста. |
| `remotes` | Карта последних снимков по `userId`; у каждого свой `xyArray`. |
| `xyVersion` | Глобальный счётчик инкрементируется при любом изменении бинов (hover / жест / remote). Используется визуализациями и контроллерами как сигнал «бины поменялись». |

Действия: `wsBind`, `publishGesture`, `publishHover`, `applyRemoteEvent`. Side-channel `onRemote(cb)` — низкоуровневая подписка на удалённые сообщения (используется `remoteVoicesController` чтобы реагировать **на каждое** WS-сообщение, без диффа).

#### [`audioEngineSingleton`](src/audio/engine/audioEngineSingleton.ts)

Ленивая инициализация `AudioEngine` через `getOrCreateEngine()`. Создаётся при первом жесте, чтобы соблюсти autoplay policy. `subscribeEngine(cb)` для UI, которому нужно реактивно узнавать о появлении/закрытии engine (например, [`SpectralDebugPanel`](src/components/ChaosPad/spectralDebug/SpectralDebugPanel.tsx)).

### Audio engine ([`src/audio/engine/`](src/audio/engine/))

- **`AudioEngine`** ([`AudioEngine.ts`](src/audio/engine/AudioEngine.ts)): master-цепочка `convolver` → `convolverGain` → `masterGain` → `tremoloGain` → **`masterAnalyser`** → `destination`. Импульс ревёрба — [`createImpulseResponse`](src/audio/engine/helpers/createImpulseResponse.ts); контекст с `latencyHint: 'playback'`. Метод `createVoice(position, quantize)` — фабрика голосов.
- **`Voice`** ([`Voice.ts`](src/audio/engine/Voice.ts)): `OscillatorNode` → собственный гейн → `masterGain` и `convolver`. Знает про позицию (`updatePosition`/`refreshPosition`), квантайз, `pitchLfoMul`. **Не знает о видах звуков**: предоставляет примитивы `setOscillatorType('sine')` / `setOscillatorWave(PeriodicWave)` / `setPitchLfoMul(m)`.

### Sound modes ([`src/audio/sounds/`](src/audio/sounds/))

Каждый вид звука — самодостаточный модуль, реализующий интерфейс `SoundMode` ([`types.ts`](src/audio/sounds/types.ts)):

```typescript
type SoundMode = {
  id: SoundModeId
  label: string
  attach(ctx: { engine, voice, getXyArray }): SoundAttachment
}

type SoundAttachment = {
  onXyUpdate?: () => void   // вызывается при смене бинов
  dispose: () => void
}
```

Реестр — [`registry.ts`](src/audio/sounds/registry.ts): массив `SOUND_MODES` + `getSoundMode(id)`. Добавление нового вида звука = создать `sounds/<id>/<id>Mode.ts` + добавить в реестр и в `SoundModeId`.

Текущие реализации:

- [`sine/sineMode.ts`](src/audio/sounds/sine/sineMode.ts) — `voice.setOscillatorType('sine')`.
- [`padWaveform/padWaveformMode.ts`](src/audio/sounds/padWaveform/padWaveformMode.ts) — `voice.setOscillatorWave(binsToPeriodicWave(...))`. `onXyUpdate` пересчитывает wave с **внутренним throttle 110ms** через [`shared/throttle.ts`](src/audio/sounds/shared/throttle.ts). На `dispose` возвращает `'sine'`.
- [`volumeLfoBuffer/volumeLfoBufferMode.ts`](src/audio/sounds/volumeLfoBuffer/volumeLfoBufferMode.ts) — rAF-цикл из [`shared/bufferLfoLoop.ts`](src/audio/sounds/shared/bufferLfoLoop.ts) пишет sample в `engine.tremoloGain.gain.value`.
- [`pitchLfoBuffer/pitchLfoBufferMode.ts`](src/audio/sounds/pitchLfoBuffer/pitchLfoBufferMode.ts) — тот же rAF-цикл, sample → `voice.setPitchLfoMul(...)`.

`shared/bins.ts` — `EMPTY_EPS`, `maxBin`, `sampleBinsAtPhase` для всех потребителей бинов.

### Controllers (vanilla, без React) ([`src/audio/controllers/`](src/audio/controllers/))

#### [`VoiceController`](src/audio/controllers/VoiceController.ts)

Инкапсулирует один `Voice` + активный `SoundAttachment`. API:

- `setMode(id)` — `dispose` старого attachment → `attach` нового.
- `setPosition(nx, ny)`, `setQuantize(q)`, `notifyXyUpdate()`, `stop(release)`.

Контроллеры local/remote работают **только** через `VoiceController` — switch по `soundModeId` отсутствует.

#### [`localVoiceController`](src/audio/controllers/localVoiceController.ts)

Подписан на `padEventStore.local`, `padEventStore.xyVersion` и `settingsStore`:

- `local.type === 'start'` → `getOrCreateEngine()`, resume, `new VoiceController(...)` с текущим `soundModeId`.
- `local.type === 'move'` → `requestAnimationFrame`-троттлинг, `vc.setPosition(...)`.
- `local.type === 'stop'` → `vc.stop(release)`.
- `xyVersion` меняется → `vc.notifyXyUpdate()` (throttle/реакция — внутри активного режима).
- Изменение `volume`/`reverbLevel` → `engine.set*`; `quantize` → `vc.setQuantize`; `soundModeId` → `vc.setMode`.

#### [`remoteVoicesController`](src/audio/controllers/remoteVoicesController.ts)

Подписан на `padEventStore.onRemote` и `settingsStore`. Хранит `Map<userId, VoiceController>`. На `start` создаёт VC с `getXyArray = () => padEventStore.getState().remotes[userId]?.xyArray`; на `move` — `vc.setPosition` + `vc.notifyXyUpdate()`; на `stop` — `vc.stop()` + `delete`. На смену settings прокидывает `setQuantize` / `setMode` всем активным VC.

#### [`attachAudioControllers`](src/audio/controllers/index.ts)

Один публичный entry-point для бутстрапа: монтирует оба контроллера и возвращает `detach`.

### Bootstrap ([`ChaosBootstrap.tsx`](src/components/ChaosPad/ChaosBootstrap.tsx))

Единственный React-узел, связывающий WS с состоянием. В `useEffect`:

- `padEventStore.wsBind({ selfUser, wsSend })`,
- `attachAudioControllers()`,
- `subscribe(msg => padEventStore.applyRemoteEvent(msg))`.

Cleanup: detach контроллеров и `closeEngine()`.

### Публичный API модуля audio ([`src/audio/index.ts`](src/audio/index.ts))

Снаружи `src/audio/` доступны только: `attachAudioControllers`, `soundModes`, `defaultSoundModeId`, `SoundModeId`, `getEngine`, `subscribeEngine`. `AudioEngine`, `Voice`, `VoiceController` и сами `SoundMode`-объекты — внутренние.

### Pad waveform buffer ([`src/audio/padWaveform.ts`](src/audio/padWaveform.ts))

`PAD_WAVEFORM_BINS = 256`. Функции `applySample` / `applySegment` мутируют `Float32Array` бинов in-place; `padEventStore` использует их в `publishGesture` / `publishHover` / `applyRemoteEvent` поверх соответствующих `xyArray`.

## Pad UI

- [`Pad`](src/components/ChaosPad/Pad/Pad.tsx) → [`PadSurfaceProvider`](src/components/ChaosPad/Pad/PadSurfaceContext.tsx) (размеры) → [`PadInputProvider`](src/components/ChaosPad/Pad/PadInputContext.tsx) (pointer handlers, дёргают `padEventStore.publishGesture/publishHover`).
- [`PadLayer`](src/components/ChaosPad/Pad/PadLayer.tsx) рендерит активную визуализацию ([`ActiveViz`](src/components/ChaosPad/Pad/ActiveViz.tsx)) + [`WaveformBufferViz`](src/components/ChaosPad/Pad/visualizations/WaveformBufferViz.tsx) поверх + прозрачный capture-div.

## Визуализации ([`src/components/ChaosPad/Pad/visualizations/`](src/components/ChaosPad/Pad/visualizations/))

- **Glow** / **Squares** — частицы через [`useParticles`](src/components/ChaosPad/Pad/visualizations/useParticles.ts), подписка через [`usePadEvents`](src/state/hooks/usePadEvents.ts) (троттлинг локального тика).
- **WebGL** — pixel shader, читает позицию из `padEventStore.local`/`remotes`.
- **WaveformBufferViz** — линия + заливка по `padEventStore(s => s.local?.xyArray)`, перерисовка по `s.xyVersion`.

## Поток: жест → звук и буфер

1. Pointer event → `PadInputContext` → `padEventStore.publishGesture`/`publishHover` → обновляет `local`, мутирует `local.xyArray`, инкрементит `xyVersion`, шлёт в WS через `wsSend`.
2. `padEventStore.subscribe(local)` → `localVoiceController` создаёт/обновляет голос через `VoiceController`; rAF-троттлинг для `move`.
3. `padEventStore.subscribe(xyVersion)` → `vc.notifyXyUpdate()` → активный `SoundAttachment.onXyUpdate?.()` (например, `padWaveformMode` пересчитает `PeriodicWave` с внутренним throttle).
4. WS приём → `ChaosBootstrap` → `padEventStore.applyRemoteEvent` → обновляет `remotes[uid]` и его `xyArray`, инкрементит `xyVersion`, эмит `onRemote`.
5. `padEventStore.onRemote` → `remoteVoicesController` создаёт/обновляет remote `VoiceController`.
6. Изменения `settingsStore` (volume/reverb/quantize/soundMode) → контроллеры реагируют через `subscribe` с диффом, без перерендера React.

## Дисциплина селекторов

В компонентах **всегда** использовать узкие селекторы: `useStore(s => s.field)` (или `useShallow` если нужен объект). Это и даёт основной выигрыш Zustand — без него получится тот же провайдер по перерендеру.

## Сервер WebSocket

[`src/ws-server.mjs`](src/ws-server.mjs) — broadcast входящих сообщений всем остальным клиентам. Порт по умолчанию **3003**. Клиентский URL — [`getPublicWebSocketUrl`](src/config.ts) из `NEXT_PUBLIC_WS_URL`. Скрипт `npm run dev:ws` поднимает Next и WS параллельно ([`package.json`](package.json)).

## Структура каталогов (сокращённо)

```
src/
  app/
  audio/                       # весь non-React аудио-слой
    index.ts                   # публичный API: attachAudioControllers, soundModes, getEngine
    engine/                    # AudioEngine, Voice, audioEngineSingleton, helpers
      helpers/                 # binsToPeriodicWave, createImpulseResponse, quantizeFreq,
                               # updateSoundFromPosition, getSoundParams
    sounds/                    # виды звуков (strategy pattern)
      types.ts                 # SoundMode, SoundContext, SoundAttachment, SoundModeId
      registry.ts              # SOUND_MODES + getSoundMode(id)
      sine/                    # sineMode
      padWaveform/             # padWaveformMode (внутренний throttle)
      volumeLfoBuffer/         # volumeLfoBufferMode
      pitchLfoBuffer/          # pitchLfoBufferMode
      shared/                  # bins, bufferLfoLoop, throttle
    controllers/               # local + remote + общий VoiceController
    padWaveform.ts             # буфер бинов (applySample, applySegment)
  components/
    WsContext/                 # тонкий канал ws (без бизнес-логики)
    ChaosPad/
      ChaosPad.tsx
      ChaosBootstrap.tsx       # WS bridge + attachAudioControllers
      ChaosPadControls.tsx
      padEvents.types.ts       # UserPadState (с xyArray), VisEvent, RemotePadEvent
      Pad/                     # PadSurface, PadInput, PadLayer, ActiveViz, visualizations/
      spectralDebug/           # спектрограмма с masterAnalyser
      helpers/
  state/
    padEventStore.ts           # local + remotes + xyVersion + onRemote
    settingsStore.ts
    hooks/usePadEvents.ts
  config.ts
  type.ts
  ws-server.mjs
```
