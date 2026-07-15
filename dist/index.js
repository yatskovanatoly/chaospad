// src/types/config.ts
var DEFAULT_WS_URL = "ws://localhost:3003";
var DEFAULT_CHAOSPAD_CONFIG = {
  wsUrl: DEFAULT_WS_URL,
  volume: 1,
  reverbLevel: 0.5,
  release: 0.5,
  remoteRelease: 0.5,
  quantize: "chromatic",
  glowIntervalMs: 50,
  glowSize: 50
};
function resolveChaospadConfig(config) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  return {
    wsUrl: (_a = config == null ? void 0 : config.wsUrl) != null ? _a : DEFAULT_CHAOSPAD_CONFIG.wsUrl,
    volume: (_b = config == null ? void 0 : config.volume) != null ? _b : DEFAULT_CHAOSPAD_CONFIG.volume,
    reverbLevel: (_c = config == null ? void 0 : config.reverbLevel) != null ? _c : DEFAULT_CHAOSPAD_CONFIG.reverbLevel,
    release: (_d = config == null ? void 0 : config.release) != null ? _d : DEFAULT_CHAOSPAD_CONFIG.release,
    remoteRelease: (_e = config == null ? void 0 : config.remoteRelease) != null ? _e : DEFAULT_CHAOSPAD_CONFIG.remoteRelease,
    quantize: (_f = config == null ? void 0 : config.quantize) != null ? _f : DEFAULT_CHAOSPAD_CONFIG.quantize,
    userId: config == null ? void 0 : config.userId,
    glowIntervalMs: (_g = config == null ? void 0 : config.glowIntervalMs) != null ? _g : DEFAULT_CHAOSPAD_CONFIG.glowIntervalMs,
    glowSize: (_h = config == null ? void 0 : config.glowSize) != null ? _h : DEFAULT_CHAOSPAD_CONFIG.glowSize
  };
}
function resolveWebSocketUrl(url) {
  const t = url.trim();
  if (t.startsWith("ws://") || t.startsWith("wss://")) return t;
  return `ws://${t}`;
}

// src/context/ChaospadConfigContext.tsx
import { createContext, useContext, useMemo } from "react";
import { jsx } from "react/jsx-runtime";
var ChaospadConfigContext = createContext(
  null
);
function ChaospadConfigProvider({
  config,
  children
}) {
  const resolved = useMemo(() => resolveChaospadConfig(config), [config]);
  return /* @__PURE__ */ jsx(ChaospadConfigContext.Provider, { value: resolved, children });
}
function useChaospadConfig() {
  const ctx = useContext(ChaospadConfigContext);
  if (!ctx) {
    throw new Error(
      "useChaospadConfig must be used within ChaospadConfigProvider"
    );
  }
  return ctx;
}

// src/components/AudioEngineContext/helpers/createImpulseResponse.ts
var createImpulseResponse = (ctx, duration = 2, decay = 2) => {
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const impulse = ctx.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c++) {
    const channel = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
};

// src/components/AudioEngineContext/helpers/getSoundParams.ts
var getSoundParamsFromXY = (nx, ny) => {
  const minFreq = 256;
  const maxFreq = 512;
  const x = Math.min(1, Math.max(0, nx));
  const y = Math.min(1, Math.max(0, ny));
  const freq = minFreq * Math.pow(maxFreq / minFreq, x);
  const amp = 1 - y;
  return { freq, amp, x, y };
};

// src/components/AudioEngineContext/helpers/quantizeFreq.ts
var quantizeFreq = (freq, mode) => {
  if (mode === "none") return freq;
  return 440 * Math.pow(2, Math.round(12 * Math.log2(freq / 440)) / 12);
};

// src/components/AudioEngineContext/helpers/updateSoundFromPosition.ts
var SMOOTH_S = 0.03;
var updateSoundFromPosition = (clientX, clientY, ctx, osc, gain, quantize = "none") => {
  if (!ctx || !osc || !gain) return;
  const { freq: rawFreq, amp } = getSoundParamsFromXY(clientX, clientY);
  const freq = quantizeFreq(rawFreq, quantize);
  const now = ctx.currentTime;
  const end = now + SMOOTH_S;
  const targetGain = amp * 0.5;
  const currentFreq = osc.frequency.value;
  if (Math.abs(currentFreq - freq) > 0.1) {
    osc.frequency.cancelScheduledValues(now);
    osc.frequency.setValueAtTime(currentFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freq, 1e-6), end);
  }
  const g = gain.gain;
  const currentGain = g.value;
  if (Math.abs(currentGain - targetGain) > 0.01) {
    g.cancelScheduledValues(now);
    g.setValueAtTime(currentGain, now);
    g.linearRampToValueAtTime(targetGain, end);
  }
};

// src/components/AudioEngineContext/AudioEngine.ts
var ATTACK_S = 0.1;
var AudioEngine = class {
  constructor() {
    this.ctx = new AudioContext();
    const impulse = createImpulseResponse(this.ctx);
    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = impulse;
    this.convolverGain = this.ctx.createGain();
    this.masterGain = this.ctx.createGain();
    this.convolver.connect(this.convolverGain);
    this.convolverGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }
  setVolume(v) {
    this.masterGain.gain.value = v;
  }
  setReverbLevel(v) {
    this.convolverGain.gain.value = v;
  }
  createVoice(position, quantize = "none") {
    return new Voice(this, position, quantize);
  }
};
var Voice = class {
  constructor(engine, position, quantize = "none") {
    this.engine = engine;
    this.quantize = quantize;
    const ctx = engine.ctx;
    this.oscillator = ctx.createOscillator();
    this.gain = ctx.createGain();
    this.oscillator.type = "sine";
    const { freq: rawFreq, amp } = getSoundParamsFromXY(position.nx, position.ny);
    this.oscillator.frequency.value = quantizeFreq(rawFreq, quantize);
    const target = amp * 0.5;
    const now = ctx.currentTime;
    this.gain.gain.value = 0;
    this.gain.gain.setValueAtTime(0, now);
    this.gain.gain.linearRampToValueAtTime(target, now + ATTACK_S);
    this.oscillator.connect(this.gain);
    this.gain.connect(engine.masterGain);
    this.gain.connect(engine.convolver);
    this.oscillator.start(now);
  }
  updatePosition(nx, ny) {
    updateSoundFromPosition(
      nx,
      ny,
      this.engine.ctx,
      this.oscillator,
      this.gain,
      this.quantize
    );
  }
  stop(releaseSeconds) {
    const ctx = this.engine.ctx;
    const now = ctx.currentTime;
    const g = this.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + releaseSeconds);
    this.oscillator.stop(now + releaseSeconds + 0.05);
    if (this.releaseTimer) clearTimeout(this.releaseTimer);
    this.releaseTimer = setTimeout(() => {
      this.gain.disconnect();
      this.oscillator.disconnect();
    }, releaseSeconds * 1e3 + 100);
  }
};

// src/components/AudioEngineContext/AudioEngineProvider.tsx
import { useEffect, useState } from "react";

// src/components/AudioEngineContext/AudioEngineContext.ts
import { createContext as createContext2 } from "react";
var AudioEngineContext = createContext2(null);

// src/components/AudioEngineContext/AudioEngineProvider.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
function AudioEngineProvider({
  children
}) {
  const [engine, setEngine] = useState(null);
  useEffect(() => {
    const _engine = new AudioEngine();
    setEngine(_engine);
    return () => {
      _engine.ctx.close();
    };
  }, []);
  if (!engine) return null;
  return /* @__PURE__ */ jsx2(AudioEngineContext.Provider, { value: engine, children });
}

// src/components/AudioEngineContext/useAudioEngine.ts
import { useContext as useContext2 } from "react";
function useAudioEngine() {
  const engine = useContext2(AudioEngineContext);
  if (!engine) {
    throw new Error("useAudioEngine must be used within AudioEngineProvider");
  }
  return engine;
}

// src/components/ChaosPad/hooks/useChaosAudio.ts
import { useCallback, useEffect as useEffect2, useRef, useState as useState2 } from "react";

// src/components/WsContext/useWebSocket.ts
import { useContext as useContext3 } from "react";

// src/components/WsContext/WsContext.ts
import { createContext as createContext3 } from "react";
var WebSocketContext = createContext3(null);

// src/components/WsContext/useWebSocket.ts
var useWebSocket = () => {
  const ctx = useContext3(WebSocketContext);
  if (!ctx)
    throw new Error("useWebSocket must be used inside WebSocketProvider");
  return ctx;
};
var useWebSocket_default = useWebSocket;

// src/components/ChaosPad/hooks/useChaosAudio.ts
function useChaosAudio() {
  const engine = useAudioEngine();
  const { volume, reverbLevel, release, quantize } = useChaospadConfig();
  const voiceRef = useRef(null);
  const oscillatorRef = useRef(null);
  const [isActive, setIsActive] = useState2(false);
  const { pos, type: motionType } = useWebSocket_default();
  useEffect2(() => {
    engine.setVolume(volume);
    engine.setReverbLevel(reverbLevel);
  }, [engine, volume, reverbLevel]);
  useEffect2(() => {
    if (voiceRef.current) voiceRef.current.quantize = quantize;
  }, [quantize]);
  const startAudio = useCallback(() => {
    engine.setVolume(volume);
    engine.setReverbLevel(reverbLevel);
    const run = () => {
      const voice = engine.createVoice(pos != null ? pos : { nx: 0, ny: 0 }, quantize);
      voiceRef.current = voice;
      oscillatorRef.current = voice.oscillator;
      setIsActive(true);
    };
    if (engine.ctx.state === "suspended") {
      void engine.ctx.resume().then(run);
    } else {
      run();
    }
  }, [engine, pos, quantize, reverbLevel, volume]);
  const stopAudio = useCallback(() => {
    if (voiceRef.current) {
      voiceRef.current.stop(release);
      voiceRef.current = null;
      oscillatorRef.current = null;
    }
    setIsActive(false);
  }, [release]);
  useEffect2(() => {
    var _a;
    if (motionType === "start" && !isActive) {
      startAudio();
    } else if (motionType === "move" && isActive && pos) {
      (_a = voiceRef.current) == null ? void 0 : _a.updatePosition(pos.nx, pos.ny);
    } else if (motionType === "stop" && isActive) {
      stopAudio();
    }
  }, [isActive, motionType, pos, startAudio, stopAudio]);
  return {
    isActive,
    oscillatorRef
  };
}

// src/components/ChaosPad/helpers/handleRemoteAudio.ts
var handleRemoteEvent = ({
  userId,
  type,
  nx,
  ny,
  engine,
  remoteUsersRef,
  quantize,
  remoteRelease
}) => {
  var _a;
  void engine.ctx.resume();
  if (type === "start") {
    const existing = remoteUsersRef[userId];
    if (existing) {
      existing.stop(remoteRelease);
    }
    remoteUsersRef[userId] = engine.createVoice({ nx, ny }, quantize);
  }
  if (type === "move") {
    (_a = remoteUsersRef[userId]) == null ? void 0 : _a.updatePosition(nx, ny);
  }
  if (type === "stop") {
    const user = remoteUsersRef[userId];
    if (user) {
      user.stop(remoteRelease);
      delete remoteUsersRef[userId];
    }
  }
};
var handleRemoteAudio_default = handleRemoteEvent;

// src/components/ChaosPad/hooks/useChaosWs.ts
import { useEffect as useEffect3, useRef as useRef2 } from "react";
function useChaosWebSocket() {
  const engine = useAudioEngine();
  const { quantize, remoteRelease } = useChaospadConfig();
  const { message } = useWebSocket_default();
  const remoteUsersRef = useRef2({});
  useEffect3(() => {
    for (const voice of Object.values(remoteUsersRef.current)) {
      voice.quantize = quantize;
    }
  }, [quantize]);
  useEffect3(() => {
    if (!message) return;
    const { userId, type, nx, ny } = message;
    handleRemoteAudio_default({
      userId,
      type,
      nx,
      ny,
      engine,
      remoteUsersRef: remoteUsersRef.current,
      quantize,
      remoteRelease
    });
  }, [engine, message, quantize, remoteRelease]);
}

// src/components/ChaosPad/helpers/spawnGlow.ts
var spawnGlow = (container, x, y, color, size) => {
  const half = size / 2;
  const glow = document.createElement("div");
  glow.className = "chaospad-glow";
  glow.style.left = `${x - half}px`;
  glow.style.top = `${y - half}px`;
  glow.style.width = `${size}px`;
  glow.style.height = `${size}px`;
  glow.style.borderColor = color;
  glow.style.animation = "glow-effect 0.5s ease-in-out";
  container.appendChild(glow);
  setTimeout(() => glow.remove(), 500);
};
var spawnGlow_default = spawnGlow;

// src/components/ChaosPad/helpers/throttledSpawn.ts
var createThrottledSpawn = (intervalMs, glowSize) => {
  let lastGlowTime = 0;
  return (container, x, y, color, _type) => {
    const now = Date.now();
    if (now - lastGlowTime < intervalMs) return;
    lastGlowTime = now;
    spawnGlow_default(container, x, y, color, glowSize);
  };
};
var throttledSpawn_default = createThrottledSpawn;

// src/components/ChaosPad/GlowFx.tsx
import { useEffect as useEffect4, useMemo as useMemo2, useRef as useRef3 } from "react";
var toPixel = (container, pos) => {
  const { width, height } = container.getBoundingClientRect();
  return {
    x: pos.nx * width,
    y: pos.ny * height
  };
};
var GlowEffect = ({ containerRef }) => {
  const { color, pos, type, message } = useWebSocket_default();
  const { glowIntervalMs, glowSize } = useChaospadConfig();
  const posRef = useRef3(pos);
  const typeRef = useRef3(type);
  const colorRef = useRef3(color);
  posRef.current = pos;
  typeRef.current = type;
  colorRef.current = color;
  const throttledSpawn = useMemo2(
    () => throttledSpawn_default(glowIntervalMs, glowSize),
    [glowIntervalMs, glowSize]
  );
  const isPointerActive = type !== "stop" && pos != null;
  useEffect4(() => {
    if (!isPointerActive) return;
    const tick = () => {
      const p = posRef.current;
      const t = typeRef.current;
      const c = colorRef.current;
      const container = containerRef.current;
      if (!p || t === "stop" || !container) return;
      const pixel = toPixel(container, p);
      throttledSpawn(container, pixel.x, pixel.y, c, t);
    };
    tick();
    const id = window.setInterval(tick, glowIntervalMs);
    return () => window.clearInterval(id);
  }, [isPointerActive, containerRef, throttledSpawn, glowIntervalMs]);
  useEffect4(() => {
    if (!message) return;
    const container = containerRef.current;
    if (!container) return;
    const { nx, ny, color: color2, type: type2 } = message;
    const { width, height } = container.getBoundingClientRect();
    throttledSpawn(container, nx * width, ny * height, color2, type2);
  }, [message, containerRef, throttledSpawn]);
  return null;
};
var GlowFx_default = GlowEffect;

// src/components/ChaosPad/ChaosPad.tsx
import { useRef as useRef4 } from "react";
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
function ChaosPad({ className, style }) {
  const rootRef = useRef4(null);
  const glowContainerRef = useRef4(null);
  useChaosAudio();
  useChaosWebSocket();
  const { setType, setPos } = useWebSocket_default();
  const emitPointer = (e, type) => {
    var _a;
    const rect = (_a = rootRef.current) == null ? void 0 : _a.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    setPos({
      nx: (e.clientX - rect.left) / rect.width,
      ny: (e.clientY - rect.top) / rect.height
    });
    setType(type);
  };
  const handlePointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    emitPointer(e, "start");
  };
  const handlePointerMove = (e) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    emitPointer(e, "move");
  };
  const releaseCaptureIfHeld = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };
  const handlePointerUp = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    releaseCaptureIfHeld(e);
    emitPointer(e, "stop");
  };
  const handlePointerCancel = (e) => {
    releaseCaptureIfHeld(e);
    emitPointer(e, "stop");
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: rootRef,
      className: ["chaospad-root", className].filter(Boolean).join(" "),
      style,
      children: [
        /* @__PURE__ */ jsx3(
          "div",
          {
            className: "chaospad-surface",
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerCancel: handlePointerCancel
          }
        ),
        /* @__PURE__ */ jsx3("div", { ref: glowContainerRef, className: "chaospad-glow-layer" }),
        /* @__PURE__ */ jsx3(GlowFx_default, { containerRef: glowContainerRef })
      ]
    }
  );
}

// src/components/WsContext/helpers/getUserParams.ts
var colors = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#eab308",
  "#a855f7"
];
var getColorForUser = (id) => {
  if (!id) return void 0;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
var getUserId = () => {
  try {
    return crypto.randomUUID();
  } catch (_error) {
    console.log("Error: Insecure environment to use crypto.randomUUID");
    return Math.random().toFixed();
  }
};

// src/components/WsContext/helpers/wsMessage.ts
function parseWsMessage(raw) {
  if (!raw || typeof raw !== "object") return void 0;
  const data = raw;
  if (!data.userId || !data.type || !data.color) return void 0;
  let nx;
  let ny;
  if (typeof data.nx === "number" && typeof data.ny === "number") {
    nx = data.nx;
    ny = data.ny;
  } else if (typeof data.x === "number" && typeof data.y === "number") {
    nx = data.x / window.innerWidth;
    ny = data.y / window.innerHeight;
  }
  if (nx == null || ny == null || !Number.isFinite(nx) || !Number.isFinite(ny)) {
    return void 0;
  }
  return {
    userId: data.userId,
    type: data.type,
    color: data.color,
    nx: Math.min(1, Math.max(0, nx)),
    ny: Math.min(1, Math.max(0, ny))
  };
}
function buildWsPayload({
  userId,
  type,
  pos,
  color
}) {
  return JSON.stringify({
    userId,
    type,
    nx: pos == null ? void 0 : pos.nx,
    ny: pos == null ? void 0 : pos.ny,
    color
  });
}

// src/components/WsContext/WsContextProvider.tsx
import { useEffect as useEffect5, useRef as useRef5, useState as useState3 } from "react";
import { jsx as jsx4 } from "react/jsx-runtime";
var WebSocketProvider = ({ children }) => {
  const { wsUrl, userId: configUserId } = useChaospadConfig();
  const [pos, setPos] = useState3(void 0);
  const [type, setType] = useState3("stop");
  const wsRef = useRef5(null);
  const userIdRef = useRef5(configUserId != null ? configUserId : getUserId());
  const userId = userIdRef.current;
  const color = getColorForUser(userId) || colors[0];
  const [message, setMessage] = useState3(void 0);
  const typeRef = useRef5(type);
  const posRef = useRef5(pos);
  const colorRef = useRef5(color);
  typeRef.current = type;
  posRef.current = pos;
  colorRef.current = color;
  const pendingPayloadRef = useRef5(null);
  const sendNow = () => {
    const ws = wsRef.current;
    if (!ws) return;
    const payload = buildWsPayload({
      userId: userIdRef.current,
      type: typeRef.current,
      pos: posRef.current,
      color: colorRef.current
    });
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
      pendingPayloadRef.current = null;
      return;
    }
    if (ws.readyState === WebSocket.CONNECTING) {
      pendingPayloadRef.current = payload;
    }
  };
  const sendNowRef = useRef5(sendNow);
  sendNowRef.current = sendNow;
  useEffect5(() => {
    const ws = new WebSocket(resolveWebSocketUrl(wsUrl));
    wsRef.current = ws;
    ws.onopen = () => {
      if (pendingPayloadRef.current) {
        ws.send(pendingPayloadRef.current);
        pendingPayloadRef.current = null;
      }
      sendNowRef.current();
    };
    ws.onmessage = (event) => {
      const parsed = parseWsMessage(JSON.parse(event.data));
      if (!parsed) return;
      setMessage((currentMessage) => {
        if (parsed.userId === userIdRef.current) return currentMessage;
        const isSame = currentMessage && currentMessage.userId === parsed.userId && currentMessage.type === parsed.type && currentMessage.nx === parsed.nx && currentMessage.ny === parsed.ny && currentMessage.color === parsed.color;
        return isSame ? currentMessage : parsed;
      });
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [wsUrl]);
  useEffect5(() => {
    sendNow();
  }, [pos, type, color]);
  return /* @__PURE__ */ jsx4(
    WebSocketContext.Provider,
    {
      value: { wsRef, type, setType, userId, color, pos, setPos, message },
      children
    }
  );
};
var WsContextProvider_default = WebSocketProvider;

// src/injectStyles.ts
var STYLE_ID = "chaospad-styles";
var CHAOSPAD_CSS = `
@keyframes glow-effect {
	0% {
		transform: scale(0);
		opacity: 1;
	}
	50% {
		transform: scale(1.5);
		opacity: 0.6;
	}
	100% {
		transform: scale(3);
		opacity: 0;
	}
}

.chaospad-glow {
	position: absolute;
	border-radius: 50%;
	border-width: 4px;
	border-style: solid;
	opacity: 0.6;
	pointer-events: none;
	transform-origin: center;
	animation: glow-effect 0.5s ease-in-out;
	filter: blur(2px);
}

.chaospad-root {
	position: relative;
	width: 100%;
	height: 100%;
	min-height: 100%;
	overflow: hidden;
	touch-action: none;
	user-select: none;
	-webkit-user-select: none;
}

.chaospad-surface {
	position: absolute;
	inset: 0;
	touch-action: none;
}

.chaospad-glow-layer {
	position: absolute;
	inset: 0;
	overflow: visible;
	pointer-events: none;
}
`;
function injectChaospadStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CHAOSPAD_CSS;
  document.head.appendChild(style);
}

// src/Chaospad.tsx
import { useEffect as useEffect6 } from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
function Chaospad({ config, className, style }) {
  useEffect6(() => {
    injectChaospadStyles();
  }, []);
  return /* @__PURE__ */ jsx5(ChaospadConfigProvider, { config, children: /* @__PURE__ */ jsx5(WsContextProvider_default, { children: /* @__PURE__ */ jsx5(AudioEngineProvider, { children: /* @__PURE__ */ jsx5(ChaosPad, { className, style }) }) }) });
}
var Chaospad_default = Chaospad;
export {
  Chaospad,
  DEFAULT_CHAOSPAD_CONFIG,
  DEFAULT_WS_URL,
  Chaospad_default as default,
  resolveChaospadConfig,
  resolveWebSocketUrl
};
//# sourceMappingURL=index.js.map