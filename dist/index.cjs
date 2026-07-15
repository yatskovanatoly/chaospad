"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Chaospad: () => Chaospad,
  DEFAULT_CHAOSPAD_CONFIG: () => DEFAULT_CHAOSPAD_CONFIG,
  DEFAULT_WS_URL: () => DEFAULT_WS_URL,
  default: () => Chaospad_default,
  resolveChaospadConfig: () => resolveChaospadConfig,
  resolveWebSocketUrl: () => resolveWebSocketUrl
});
module.exports = __toCommonJS(index_exports);

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
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var ChaospadConfigContext = (0, import_react.createContext)(
  null
);
function ChaospadConfigProvider({
  config,
  children
}) {
  const resolved = (0, import_react.useMemo)(() => resolveChaospadConfig(config), [config]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChaospadConfigContext.Provider, { value: resolved, children });
}
function useChaospadConfig() {
  const ctx = (0, import_react.useContext)(ChaospadConfigContext);
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
var import_react3 = require("react");

// src/components/AudioEngineContext/AudioEngineContext.ts
var import_react2 = require("react");
var AudioEngineContext = (0, import_react2.createContext)(null);

// src/components/AudioEngineContext/AudioEngineProvider.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function AudioEngineProvider({
  children
}) {
  const [engine, setEngine] = (0, import_react3.useState)(null);
  (0, import_react3.useEffect)(() => {
    const _engine = new AudioEngine();
    setEngine(_engine);
    return () => {
      _engine.ctx.close();
    };
  }, []);
  if (!engine) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(AudioEngineContext.Provider, { value: engine, children });
}

// src/components/AudioEngineContext/useAudioEngine.ts
var import_react4 = require("react");
function useAudioEngine() {
  const engine = (0, import_react4.useContext)(AudioEngineContext);
  if (!engine) {
    throw new Error("useAudioEngine must be used within AudioEngineProvider");
  }
  return engine;
}

// src/components/ChaosPad/hooks/useChaosAudio.ts
var import_react7 = require("react");

// src/components/WsContext/useWebSocket.ts
var import_react6 = require("react");

// src/components/WsContext/WsContext.ts
var import_react5 = require("react");
var WebSocketContext = (0, import_react5.createContext)(null);

// src/components/WsContext/useWebSocket.ts
var useWebSocket = () => {
  const ctx = (0, import_react6.useContext)(WebSocketContext);
  if (!ctx)
    throw new Error("useWebSocket must be used inside WebSocketProvider");
  return ctx;
};
var useWebSocket_default = useWebSocket;

// src/components/ChaosPad/hooks/useChaosAudio.ts
function useChaosAudio() {
  const engine = useAudioEngine();
  const { volume, reverbLevel, release, quantize } = useChaospadConfig();
  const voiceRef = (0, import_react7.useRef)(null);
  const oscillatorRef = (0, import_react7.useRef)(null);
  const [isActive, setIsActive] = (0, import_react7.useState)(false);
  const { pos, type: motionType } = useWebSocket_default();
  (0, import_react7.useEffect)(() => {
    engine.setVolume(volume);
    engine.setReverbLevel(reverbLevel);
  }, [engine, volume, reverbLevel]);
  (0, import_react7.useEffect)(() => {
    if (voiceRef.current) voiceRef.current.quantize = quantize;
  }, [quantize]);
  const startAudio = (0, import_react7.useCallback)(() => {
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
  const stopAudio = (0, import_react7.useCallback)(() => {
    if (voiceRef.current) {
      voiceRef.current.stop(release);
      voiceRef.current = null;
      oscillatorRef.current = null;
    }
    setIsActive(false);
  }, [release]);
  (0, import_react7.useEffect)(() => {
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
var import_react8 = require("react");
function useChaosWebSocket() {
  const engine = useAudioEngine();
  const { quantize, remoteRelease } = useChaospadConfig();
  const { message } = useWebSocket_default();
  const remoteUsersRef = (0, import_react8.useRef)({});
  (0, import_react8.useEffect)(() => {
    for (const voice of Object.values(remoteUsersRef.current)) {
      voice.quantize = quantize;
    }
  }, [quantize]);
  (0, import_react8.useEffect)(() => {
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
var import_react9 = require("react");
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
  const posRef = (0, import_react9.useRef)(pos);
  const typeRef = (0, import_react9.useRef)(type);
  const colorRef = (0, import_react9.useRef)(color);
  posRef.current = pos;
  typeRef.current = type;
  colorRef.current = color;
  const throttledSpawn = (0, import_react9.useMemo)(
    () => throttledSpawn_default(glowIntervalMs, glowSize),
    [glowIntervalMs, glowSize]
  );
  (0, import_react9.useEffect)(() => {
    const container = containerRef.current;
    if (!container || !pos || type === "stop") return;
    const { x, y } = toPixel(container, pos);
    throttledSpawn(container, x, y, color, type);
    const id = window.setInterval(() => {
      const p = posRef.current;
      const t = typeRef.current;
      const c = colorRef.current;
      if (!p || t === "stop" || !containerRef.current) return;
      const pixel = toPixel(containerRef.current, p);
      throttledSpawn(containerRef.current, pixel.x, pixel.y, c, t);
    }, glowIntervalMs);
    return () => window.clearInterval(id);
  }, [pos, type, color, containerRef, throttledSpawn, glowIntervalMs]);
  (0, import_react9.useEffect)(() => {
    const container = containerRef.current;
    if (!container || !message) return;
    const { nx, ny, color: color2, type: type2 } = message;
    const { width, height } = container.getBoundingClientRect();
    throttledSpawn(container, nx * width, ny * height, color2, type2);
  }, [message, containerRef, throttledSpawn]);
  return null;
};
var GlowFx_default = GlowEffect;

// src/components/ChaosPad/ChaosPad.tsx
var import_react10 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
function ChaosPad({ className, style }) {
  const rootRef = (0, import_react10.useRef)(null);
  const glowContainerRef = (0, import_react10.useRef)(null);
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
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      ref: rootRef,
      className: ["chaospad-root", className].filter(Boolean).join(" "),
      style,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "div",
          {
            className: "chaospad-surface",
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerCancel: handlePointerCancel
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { ref: glowContainerRef, className: "chaospad-glow-layer" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(GlowFx_default, { containerRef: glowContainerRef })
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

// src/components/WsContext/WsContextProvider.tsx
var import_react11 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var WebSocketProvider = ({ children }) => {
  const { wsUrl, userId: configUserId } = useChaospadConfig();
  const [pos, setPos] = (0, import_react11.useState)(void 0);
  const [type, setType] = (0, import_react11.useState)("stop");
  const wsRef = (0, import_react11.useRef)(null);
  const userIdRef = (0, import_react11.useRef)(configUserId != null ? configUserId : getUserId());
  const userId = userIdRef.current;
  const color = getColorForUser(userId) || colors[0];
  const [message, setMessage] = (0, import_react11.useState)(void 0);
  (0, import_react11.useEffect)(() => {
    const ws = new WebSocket(resolveWebSocketUrl(wsUrl));
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);
      if (!parsedData) return;
      setMessage((currentMessage) => {
        if (parsedData.userId !== userIdRef.current) {
          return JSON.stringify(parsedData) === JSON.stringify(currentMessage) ? currentMessage : parsedData;
        }
        return currentMessage;
      });
    };
    return () => ws.close();
  }, [wsUrl]);
  (0, import_react11.useEffect)(() => {
    var _a, _b;
    if (((_a = wsRef.current) == null ? void 0 : _a.readyState) === WebSocket.OPEN) {
      (_b = wsRef.current) == null ? void 0 : _b.send(
        JSON.stringify({ userId, type, nx: pos == null ? void 0 : pos.nx, ny: pos == null ? void 0 : pos.ny, color })
      );
    }
  }, [pos, type, userId, color]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
var import_react12 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
function Chaospad({ config, className, style }) {
  (0, import_react12.useEffect)(() => {
    injectChaospadStyles();
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ChaospadConfigProvider, { config, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(WsContextProvider_default, { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(AudioEngineProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ChaosPad, { className, style }) }) }) });
}
var Chaospad_default = Chaospad;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Chaospad,
  DEFAULT_CHAOSPAD_CONFIG,
  DEFAULT_WS_URL,
  resolveChaospadConfig,
  resolveWebSocketUrl
});
//# sourceMappingURL=index.cjs.map