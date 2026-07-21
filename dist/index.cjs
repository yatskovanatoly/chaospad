"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
  DEFAULT_WS_PORT: () => DEFAULT_WS_PORT,
  DEFAULT_WS_URL: () => DEFAULT_WS_URL,
  default: () => Chaospad_default,
  resolveChaospadConfig: () => resolveChaospadConfig,
  resolveDefaultWsUrl: () => resolveDefaultWsUrl,
  resolveWebSocketUrl: () => resolveWebSocketUrl
});
module.exports = __toCommonJS(index_exports);

// src/types/config.ts
var DEFAULT_WS_PORT = 3003;
var DEFAULT_WS_URL = `ws://localhost:${DEFAULT_WS_PORT}`;
var readEnv = (key) => {
  if (typeof process === "undefined") return void 0;
  return process.env[key];
};
var readEnvWsUrl = () => {
  var _a, _b;
  const raw = (_b = (_a = readEnv("NEXT_PUBLIC_CHAOSPAD_WS_URL")) != null ? _a : readEnv("CHAOSPAD_WS_URL")) != null ? _b : readEnv("NEXT_PUBLIC_WS_URL");
  const trimmed = raw == null ? void 0 : raw.trim();
  return trimmed || void 0;
};
var readEnvWsPort = () => {
  var _a;
  const raw = (_a = readEnv("NEXT_PUBLIC_CHAOSPAD_WS_PORT")) != null ? _a : readEnv("CHAOSPAD_WS_PORT");
  if (!raw) return void 0;
  const port = Number(raw);
  return Number.isFinite(port) ? port : void 0;
};
function resolveDefaultWsUrl(wsPort = DEFAULT_WS_PORT) {
  var _a;
  const fromEnv = readEnvWsUrl();
  if (fromEnv) return fromEnv;
  const port = (_a = readEnvWsPort()) != null ? _a : wsPort;
  if (typeof window === "undefined") {
    return `ws://localhost:${port}`;
  }
  const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProto}//${window.location.hostname}:${port}`;
}
var DEFAULT_CHAOSPAD_CONFIG = {
  wsUrl: DEFAULT_WS_URL,
  wsPort: DEFAULT_WS_PORT,
  volume: 1,
  reverbLevel: 0.5,
  release: 0.5,
  remoteRelease: 0.5,
  quantize: "chromatic",
  glowIntervalMs: 50,
  glowSize: 50,
  pointerPassThrough: true
};
function resolveChaospadConfig(config) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const wsPort = (_b = (_a = config == null ? void 0 : config.wsPort) != null ? _a : readEnvWsPort()) != null ? _b : DEFAULT_WS_PORT;
  const wsUrl = ((_c = config == null ? void 0 : config.wsUrl) == null ? void 0 : _c.trim()) || resolveDefaultWsUrl(wsPort);
  return {
    wsUrl,
    wsPort,
    volume: (_d = config == null ? void 0 : config.volume) != null ? _d : DEFAULT_CHAOSPAD_CONFIG.volume,
    reverbLevel: (_e = config == null ? void 0 : config.reverbLevel) != null ? _e : DEFAULT_CHAOSPAD_CONFIG.reverbLevel,
    release: (_f = config == null ? void 0 : config.release) != null ? _f : DEFAULT_CHAOSPAD_CONFIG.release,
    remoteRelease: (_g = config == null ? void 0 : config.remoteRelease) != null ? _g : DEFAULT_CHAOSPAD_CONFIG.remoteRelease,
    quantize: (_h = config == null ? void 0 : config.quantize) != null ? _h : DEFAULT_CHAOSPAD_CONFIG.quantize,
    userId: config == null ? void 0 : config.userId,
    glowIntervalMs: (_i = config == null ? void 0 : config.glowIntervalMs) != null ? _i : DEFAULT_CHAOSPAD_CONFIG.glowIntervalMs,
    glowSize: (_j = config == null ? void 0 : config.glowSize) != null ? _j : DEFAULT_CHAOSPAD_CONFIG.glowSize,
    pointerPassThrough: (_k = config == null ? void 0 : config.pointerPassThrough) != null ? _k : DEFAULT_CHAOSPAD_CONFIG.pointerPassThrough
  };
}
function resolveWebSocketUrl(url) {
  const t = url.trim();
  if (!t) return resolveDefaultWsUrl();
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
  const [resolved, setResolved] = (0, import_react.useState)(() => resolveChaospadConfig(config));
  (0, import_react.useEffect)(() => {
    setResolved(resolveChaospadConfig(config));
  }, [config]);
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
  const { subscribeMotion } = useWebSocket_default();
  const voiceRef = (0, import_react7.useRef)(null);
  const isActiveRef = (0, import_react7.useRef)(false);
  const pendingStartRef = (0, import_react7.useRef)(false);
  (0, import_react7.useEffect)(() => {
    engine.setVolume(volume);
    engine.setReverbLevel(reverbLevel);
  }, [engine, volume, reverbLevel]);
  (0, import_react7.useEffect)(() => {
    if (voiceRef.current) voiceRef.current.quantize = quantize;
  }, [quantize]);
  const startAudio = (0, import_react7.useCallback)(
    (position) => {
      pendingStartRef.current = true;
      engine.setVolume(volume);
      engine.setReverbLevel(reverbLevel);
      const run = () => {
        if (!pendingStartRef.current) return;
        const voice = engine.createVoice(position, quantize);
        voiceRef.current = voice;
        isActiveRef.current = true;
      };
      if (engine.ctx.state === "suspended") {
        void engine.ctx.resume().then(run);
      } else {
        run();
      }
    },
    [engine, quantize, reverbLevel, volume]
  );
  const stopAudio = (0, import_react7.useCallback)(() => {
    pendingStartRef.current = false;
    if (voiceRef.current) {
      voiceRef.current.stop(release);
      voiceRef.current = null;
    }
    isActiveRef.current = false;
  }, [release]);
  (0, import_react7.useEffect)(() => {
    return subscribeMotion(({ pos, type }) => {
      var _a;
      if (type === "start" && pos) {
        if (!isActiveRef.current) startAudio(pos);
        return;
      }
      if (type === "move" && isActiveRef.current && pos) {
        (_a = voiceRef.current) == null ? void 0 : _a.updatePosition(pos.nx, pos.ny);
        return;
      }
      if (type === "stop" && isActiveRef.current) {
        stopAudio();
      }
    });
  }, [startAudio, stopAudio, subscribeMotion]);
  return {
    isActive: isActiveRef.current
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

// src/components/ChaosPad/hooks/useAudioUnlock.ts
var import_react9 = require("react");
var UNLOCK_OPTS = { capture: true, passive: true };
function useAudioUnlock() {
  const engine = useAudioEngine();
  (0, import_react9.useEffect)(() => {
    const unlock = () => {
      if (engine.ctx.state === "suspended") {
        void engine.ctx.resume();
      }
    };
    document.addEventListener("touchstart", unlock, UNLOCK_OPTS);
    document.addEventListener("pointerdown", unlock, UNLOCK_OPTS);
    document.addEventListener("click", unlock, UNLOCK_OPTS);
    return () => {
      document.removeEventListener("touchstart", unlock, UNLOCK_OPTS);
      document.removeEventListener("pointerdown", unlock, UNLOCK_OPTS);
      document.removeEventListener("click", unlock, UNLOCK_OPTS);
    };
  }, [engine]);
}

// src/components/ChaosPad/hooks/useGlobalPointerPad.ts
var import_react10 = require("react");
var DRAG_THRESHOLD_PX = 10;
var CLICK_SUPPRESS_MS = 400;
var PASSIVE_CAPTURE = { capture: true, passive: true };
var ACTIVE_CAPTURE = { capture: true, passive: false };
function useGlobalPointerPad(rootRef, surfaceRef, passThrough) {
  const { emitMotion } = useWebSocket_default();
  const emitMotionRef = (0, import_react10.useRef)(emitMotion);
  const sessionsRef = (0, import_react10.useRef)(/* @__PURE__ */ new Map());
  const suppressClickUntilRef = (0, import_react10.useRef)(0);
  emitMotionRef.current = emitMotion;
  (0, import_react10.useEffect)(() => {
    var _a;
    const emit = (clientX, clientY, type) => {
      var _a2;
      const rect = (_a2 = rootRef.current) == null ? void 0 : _a2.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const pos = {
        nx: (clientX - rect.left) / rect.width,
        ny: (clientY - rect.top) / rect.height
      };
      emitMotionRef.current(pos, type);
    };
    const endSession = (pointerId, clientX, clientY, event) => {
      const session = sessionsRef.current.get(pointerId);
      if (!session) return;
      sessionsRef.current.delete(pointerId);
      emit(clientX, clientY, "stop");
      if (passThrough && session.isDrag) {
        suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS;
        event == null ? void 0 : event.preventDefault();
        event == null ? void 0 : event.stopPropagation();
      }
    };
    const endAllSessions = (event) => {
      for (const [pointerId, session] of sessionsRef.current) {
        emit(session.lastX, session.lastY, "stop");
        if (passThrough && session.isDrag) {
          suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS;
          event == null ? void 0 : event.preventDefault();
        }
      }
      sessionsRef.current.clear();
    };
    const onPointerDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      sessionsRef.current.set(e.pointerId, {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        isDrag: !passThrough
      });
      if (!passThrough) {
        e.preventDefault();
        const surface = surfaceRef.current;
        if ((surface == null ? void 0 : surface.hasPointerCapture) && !surface.hasPointerCapture(e.pointerId)) {
          surface.setPointerCapture(e.pointerId);
        }
      }
      emit(e.clientX, e.clientY, "start");
    };
    const onPointerMove = (e) => {
      const session = sessionsRef.current.get(e.pointerId);
      if (!session) return;
      session.lastX = e.clientX;
      session.lastY = e.clientY;
      if (passThrough && !session.isDrag) {
        const dx = e.clientX - session.startX;
        const dy = e.clientY - session.startY;
        if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
          session.isDrag = true;
        }
      }
      if (!passThrough || session.isDrag) {
        e.preventDefault();
        emit(e.clientX, e.clientY, "move");
      }
    };
    const onPointerUp = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      endSession(e.pointerId, e.clientX, e.clientY, e);
    };
    const onPointerCancel = (e) => {
      endSession(e.pointerId, e.clientX, e.clientY, e);
    };
    const onTouchMove = (e) => {
      if (sessionsRef.current.size === 0) return;
      const touch = e.touches[0];
      if (!touch) return;
      const firstEntry = sessionsRef.current.entries().next();
      if (firstEntry.done) return;
      const [, session] = firstEntry.value;
      session.lastX = touch.clientX;
      session.lastY = touch.clientY;
      if (passThrough && !session.isDrag) {
        const dx = touch.clientX - session.startX;
        const dy = touch.clientY - session.startY;
        if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
          session.isDrag = true;
        }
      }
      if (!passThrough || session.isDrag) {
        e.preventDefault();
        emit(touch.clientX, touch.clientY, "move");
      }
    };
    const onTouchEnd = (e) => {
      if (sessionsRef.current.size === 0) return;
      if (e.touches.length > 0) return;
      endAllSessions(e);
    };
    const onTouchCancel = (e) => {
      if (sessionsRef.current.size === 0) return;
      endAllSessions(e);
    };
    const onClickCapture = (e) => {
      if (Date.now() < suppressClickUntilRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onDragStart = (e) => {
      if (passThrough && sessionsRef.current.size > 0) {
        e.preventDefault();
      }
    };
    const target = passThrough ? document : (_a = surfaceRef.current) != null ? _a : document;
    target.addEventListener("pointerdown", onPointerDown, PASSIVE_CAPTURE);
    target.addEventListener("pointermove", onPointerMove, ACTIVE_CAPTURE);
    target.addEventListener("pointerup", onPointerUp, PASSIVE_CAPTURE);
    target.addEventListener("pointercancel", onPointerCancel, PASSIVE_CAPTURE);
    document.addEventListener("touchmove", onTouchMove, ACTIVE_CAPTURE);
    document.addEventListener("touchend", onTouchEnd, PASSIVE_CAPTURE);
    document.addEventListener("touchcancel", onTouchCancel, PASSIVE_CAPTURE);
    document.addEventListener("visibilitychange", endAllSessions);
    window.addEventListener("blur", endAllSessions);
    if (passThrough) {
      document.addEventListener("click", onClickCapture, true);
      document.addEventListener("dragstart", onDragStart, ACTIVE_CAPTURE);
    }
    return () => {
      target.removeEventListener("pointerdown", onPointerDown, PASSIVE_CAPTURE);
      target.removeEventListener("pointermove", onPointerMove, ACTIVE_CAPTURE);
      target.removeEventListener("pointerup", onPointerUp, PASSIVE_CAPTURE);
      target.removeEventListener("pointercancel", onPointerCancel, PASSIVE_CAPTURE);
      document.removeEventListener("touchmove", onTouchMove, ACTIVE_CAPTURE);
      document.removeEventListener("touchend", onTouchEnd, PASSIVE_CAPTURE);
      document.removeEventListener("touchcancel", onTouchCancel, PASSIVE_CAPTURE);
      document.removeEventListener("visibilitychange", endAllSessions);
      window.removeEventListener("blur", endAllSessions);
      document.removeEventListener("click", onClickCapture, true);
      document.removeEventListener("dragstart", onDragStart, ACTIVE_CAPTURE);
      sessionsRef.current.clear();
    };
  }, [passThrough, rootRef, surfaceRef]);
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
var import_react11 = require("react");
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
  const posRef = (0, import_react11.useRef)(pos);
  const typeRef = (0, import_react11.useRef)(type);
  const colorRef = (0, import_react11.useRef)(color);
  posRef.current = pos;
  typeRef.current = type;
  colorRef.current = color;
  const throttledSpawn = (0, import_react11.useMemo)(
    () => throttledSpawn_default(glowIntervalMs, glowSize),
    [glowIntervalMs, glowSize]
  );
  const isPointerActive = type !== "stop" && pos != null;
  (0, import_react11.useEffect)(() => {
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
  (0, import_react11.useEffect)(() => {
    if (!message || message.type === "stop") return;
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
var import_react12 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
function ChaosPad({ className, style }) {
  const { pointerPassThrough } = useChaospadConfig();
  const rootRef = (0, import_react12.useRef)(null);
  const surfaceRef = (0, import_react12.useRef)(null);
  const glowContainerRef = (0, import_react12.useRef)(null);
  useAudioUnlock();
  useChaosAudio();
  useChaosWebSocket();
  useGlobalPointerPad(rootRef, surfaceRef, pointerPassThrough);
  const rootClass = [
    "chaospad-root",
    pointerPassThrough && "chaospad-pass-through",
    className
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { ref: rootRef, className: rootClass, style, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { ref: surfaceRef, className: "chaospad-surface", "aria-hidden": "true" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { ref: glowContainerRef, className: "chaospad-glow-layer" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(GlowFx_default, { containerRef: glowContainerRef })
  ] });
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
var clamp01 = (n) => Math.min(1, Math.max(0, n));
var resolveCoords = (data) => {
  if (typeof data.nx === "number" && typeof data.ny === "number") {
    return { nx: data.nx, ny: data.ny };
  }
  if (typeof data.x === "number" && typeof data.y === "number") {
    return {
      nx: data.x / window.innerWidth,
      ny: data.y / window.innerHeight
    };
  }
  return null;
};
function parseWsMessage(raw) {
  if (!raw || typeof raw !== "object") return void 0;
  const data = raw;
  if (!data.userId || !data.type || !data.color) return void 0;
  if (data.type === "stop") {
    const coords2 = resolveCoords(data);
    return {
      userId: data.userId,
      type: "stop",
      color: data.color,
      nx: coords2 ? clamp01(coords2.nx) : 0,
      ny: coords2 ? clamp01(coords2.ny) : 0
    };
  }
  const coords = resolveCoords(data);
  if (!coords || !Number.isFinite(coords.nx) || !Number.isFinite(coords.ny)) {
    return void 0;
  }
  return {
    userId: data.userId,
    type: data.type,
    color: data.color,
    nx: clamp01(coords.nx),
    ny: clamp01(coords.ny)
  };
}
function buildWsPayload({
  userId,
  type,
  pos,
  color
}) {
  const payload = {
    userId,
    type,
    color
  };
  if (pos && Number.isFinite(pos.nx) && Number.isFinite(pos.ny)) {
    payload.nx = pos.nx;
    payload.ny = pos.ny;
  }
  return JSON.stringify(payload);
}

// src/components/WsContext/WsContextProvider.tsx
var import_react13 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var RECONNECT_MS = 1500;
var WebSocketProvider = ({ children }) => {
  const { wsUrl, userId: configUserId } = useChaospadConfig();
  const [pos, setPos] = (0, import_react13.useState)(void 0);
  const [type, setType] = (0, import_react13.useState)("stop");
  const wsRef = (0, import_react13.useRef)(null);
  const userIdRef = (0, import_react13.useRef)(configUserId != null ? configUserId : getUserId());
  const userId = userIdRef.current;
  const color = getColorForUser(userId) || colors[0];
  const [message, setMessage] = (0, import_react13.useState)(void 0);
  const messageSeqRef = (0, import_react13.useRef)(0);
  const typeRef = (0, import_react13.useRef)(type);
  const posRef = (0, import_react13.useRef)(pos);
  const colorRef = (0, import_react13.useRef)(color);
  typeRef.current = type;
  posRef.current = pos;
  colorRef.current = color;
  const motionListenersRef = (0, import_react13.useRef)(/* @__PURE__ */ new Set());
  const pendingPayloadRef = (0, import_react13.useRef)(null);
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
  const sendNowRef = (0, import_react13.useRef)(sendNow);
  sendNowRef.current = sendNow;
  const emitMotion = (0, import_react13.useCallback)((nextPos, nextType) => {
    posRef.current = nextPos;
    typeRef.current = nextType;
    setPos(nextPos);
    setType(nextType);
    sendNowRef.current();
    for (const listener of motionListenersRef.current) {
      listener({ pos: nextPos, type: nextType });
    }
  }, []);
  const subscribeMotion = (0, import_react13.useCallback)((listener) => {
    motionListenersRef.current.add(listener);
    return () => {
      motionListenersRef.current.delete(listener);
    };
  }, []);
  (0, import_react13.useEffect)(() => {
    let alive = true;
    let reconnectTimer;
    let ws = null;
    const connect = () => {
      if (!alive) return;
      const url = resolveWebSocketUrl(wsUrl);
      ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => {
        if (pendingPayloadRef.current) {
          ws == null ? void 0 : ws.send(pendingPayloadRef.current);
          pendingPayloadRef.current = null;
        }
        sendNowRef.current();
      };
      ws.onmessage = (event) => {
        try {
          const parsed = parseWsMessage(JSON.parse(event.data));
          if (!parsed || parsed.userId === userIdRef.current) return;
          messageSeqRef.current += 1;
          setMessage(__spreadProps(__spreadValues({}, parsed), { seq: messageSeqRef.current }));
        } catch (error) {
          console.warn("[chaospad] failed to parse ws message", error);
        }
      };
      ws.onerror = () => {
        console.warn(`[chaospad] ws error (${url})`);
      };
      ws.onclose = () => {
        wsRef.current = null;
        if (!alive) return;
        reconnectTimer = setTimeout(connect, RECONNECT_MS);
      };
    };
    connect();
    return () => {
      alive = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws == null ? void 0 : ws.close();
      wsRef.current = null;
    };
  }, [wsUrl]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    WebSocketContext.Provider,
    {
      value: {
        wsRef,
        type,
        setType,
        userId,
        color,
        pos,
        setPos,
        message,
        emitMotion,
        subscribeMotion
      },
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
	position: fixed;
	inset: 0;
	z-index: 0;
	width: 100%;
	height: 100%;
	overflow: hidden;
	touch-action: none;
	user-select: none;
	-webkit-user-select: none;
}

.chaospad-root.chaospad-pass-through {
	pointer-events: none;
	touch-action: auto;
	user-select: auto;
	-webkit-user-select: auto;
}

.chaospad-pass-through .chaospad-surface {
	pointer-events: none;
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
var import_react14 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
function Chaospad({ config, className, style }) {
  (0, import_react14.useEffect)(() => {
    injectChaospadStyles();
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ChaospadConfigProvider, { config, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(WsContextProvider_default, { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(AudioEngineProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ChaosPad, { className, style }) }) }) });
}
var Chaospad_default = Chaospad;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Chaospad,
  DEFAULT_CHAOSPAD_CONFIG,
  DEFAULT_WS_PORT,
  DEFAULT_WS_URL,
  resolveChaospadConfig,
  resolveDefaultWsUrl,
  resolveWebSocketUrl
});
//# sourceMappingURL=index.cjs.map