var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
function resolveDefaultWsUrl(wsPort = DEFAULT_WS_PORT, opts) {
  var _a;
  const fromEnv = readEnvWsUrl();
  if (fromEnv) return fromEnv;
  const port = (_a = readEnvWsPort()) != null ? _a : wsPort;
  if ((opts == null ? void 0 : opts.ssr) || typeof window === "undefined") {
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
  visualMode: "webgl",
  pointerPassThrough: true
};
function resolveChaospadConfig(config, opts) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  const wsPort = (_b = (_a = config == null ? void 0 : config.wsPort) != null ? _a : readEnvWsPort()) != null ? _b : DEFAULT_WS_PORT;
  const wsUrl = ((_c = config == null ? void 0 : config.wsUrl) == null ? void 0 : _c.trim()) || resolveDefaultWsUrl(wsPort, opts);
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
    visualMode: (_k = config == null ? void 0 : config.visualMode) != null ? _k : DEFAULT_CHAOSPAD_CONFIG.visualMode,
    pointerPassThrough: (_l = config == null ? void 0 : config.pointerPassThrough) != null ? _l : DEFAULT_CHAOSPAD_CONFIG.pointerPassThrough
  };
}
function resolveWebSocketUrl(url) {
  const t = url.trim();
  if (!t) return resolveDefaultWsUrl();
  if (t.startsWith("ws://") || t.startsWith("wss://")) return t;
  return `ws://${t}`;
}

// src/context/ChaospadConfigContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import { jsx } from "react/jsx-runtime";
var ChaospadConfigContext = createContext(
  null
);
function ChaospadConfigProvider({
  config,
  children
}) {
  const [resolved, setResolved] = useState(
    () => resolveChaospadConfig(config, { ssr: true })
  );
  useEffect(() => {
    setResolved(resolveChaospadConfig(config));
  }, [config]);
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

// src/components/AudioEngineContext/helpers/unlockAudioContext.ts
var SILENT_WAV = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
var silentAudio = null;
function createAudioContext() {
  var _a;
  const w = window;
  const AC = (_a = window.AudioContext) != null ? _a : w.webkitAudioContext;
  if (!AC) throw new Error("Web Audio API unavailable");
  return new AC();
}
function setPlaybackAudioSession() {
  const nav = navigator;
  if (!nav.audioSession) return;
  try {
    nav.audioSession.type = "playback";
  } catch (e) {
  }
}
function primeDisposableContext() {
  try {
    const temp = createAudioContext();
    void temp.resume().finally(() => {
      void temp.close();
    });
  } catch (e) {
  }
}
function playSilentHtmlAudio() {
  if (typeof Audio === "undefined") return;
  if (!silentAudio) {
    silentAudio = new Audio(SILENT_WAV);
    silentAudio.preload = "auto";
    silentAudio.volume = 1e-3;
  }
  silentAudio.currentTime = 0;
  void silentAudio.play().catch(() => {
  });
}
function unlockAudioForGesture(ctx) {
  setPlaybackAudioSession();
  primeDisposableContext();
  playSilentHtmlAudio();
  if (!ctx) return;
  void ctx.resume();
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch (e) {
  }
}

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
    this.ctx = null;
    this.masterGain = null;
    this.convolver = null;
    this.convolverGain = null;
    this.graphReady = false;
    this.volumeValue = 1;
    this.reverbLevelValue = 0.5;
  }
  /** Create/resume AudioContext inside a user-gesture handler (required on iOS). */
  unlock() {
    if (!this.ctx) {
      this.ctx = createAudioContext();
    }
    if (!this.graphReady) {
      this.initGraph();
      this.graphReady = true;
    }
    unlockAudioForGesture(this.ctx);
    return this.ctx;
  }
  close() {
    if (!this.ctx) return;
    void this.ctx.close();
    this.ctx = null;
    this.masterGain = null;
    this.convolver = null;
    this.convolverGain = null;
    this.graphReady = false;
  }
  initGraph() {
    const ctx = this.ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.volumeValue;
    this.masterGain.connect(ctx.destination);
    try {
      const impulse = createImpulseResponse(ctx);
      this.convolver = ctx.createConvolver();
      this.convolver.buffer = impulse;
      this.convolverGain = ctx.createGain();
      this.convolverGain.gain.value = this.reverbLevelValue;
      this.convolver.connect(this.convolverGain);
      this.convolverGain.connect(this.masterGain);
    } catch (e) {
      this.convolver = null;
      this.convolverGain = null;
    }
  }
  getContext() {
    if (!this.ctx || !this.masterGain) {
      throw new Error("AudioEngine.unlock() must be called before playback");
    }
    return this.ctx;
  }
  setVolume(v) {
    this.volumeValue = v;
    if (this.masterGain) this.masterGain.gain.value = v;
  }
  setReverbLevel(v) {
    this.reverbLevelValue = v;
    if (this.convolverGain) this.convolverGain.gain.value = v;
  }
  createVoice(position, quantize = "none") {
    this.unlock();
    return new Voice(this, position, quantize);
  }
  connectVoiceOutput(gain) {
    gain.connect(this.masterGain);
    if (this.convolver) gain.connect(this.convolver);
  }
  getContextForVoice() {
    return this.getContext();
  }
};
var Voice = class {
  constructor(engine, position, quantize = "none") {
    this.engine = engine;
    this.quantize = quantize;
    const ctx = engine.getContextForVoice();
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
    engine.connectVoiceOutput(this.gain);
    this.oscillator.start(now + 1e-3);
  }
  updatePosition(nx, ny) {
    updateSoundFromPosition(
      nx,
      ny,
      this.engine.getContextForVoice(),
      this.oscillator,
      this.gain,
      this.quantize
    );
  }
  stop(releaseSeconds) {
    const ctx = this.engine.getContextForVoice();
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
import { useEffect as useEffect2, useState as useState2 } from "react";

// src/components/AudioEngineContext/AudioEngineContext.ts
import { createContext as createContext2 } from "react";
var AudioEngineContext = createContext2(null);

// src/components/AudioEngineContext/AudioEngineProvider.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
function AudioEngineProvider({
  children
}) {
  const [engine] = useState2(() => new AudioEngine());
  useEffect2(() => {
    return () => {
      engine.close();
    };
  }, [engine]);
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
import { useCallback, useEffect as useEffect3, useLayoutEffect, useRef } from "react";

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
  const { subscribeMotion } = useWebSocket_default();
  const voiceRef = useRef(null);
  const isActiveRef = useRef(false);
  const pendingStartRef = useRef(false);
  useEffect3(() => {
    engine.setVolume(volume);
    engine.setReverbLevel(reverbLevel);
  }, [engine, volume, reverbLevel]);
  useEffect3(() => {
    if (voiceRef.current) voiceRef.current.quantize = quantize;
  }, [quantize]);
  const startAudio = useCallback(
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
      try {
        engine.unlock();
      } finally {
        run();
      }
    },
    [engine, quantize, reverbLevel, volume]
  );
  const stopAudio = useCallback(() => {
    pendingStartRef.current = false;
    if (voiceRef.current) {
      voiceRef.current.stop(release);
      voiceRef.current = null;
    }
    isActiveRef.current = false;
  }, [release]);
  useLayoutEffect(() => {
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
  engine.unlock();
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
import { useEffect as useEffect4, useRef as useRef2 } from "react";
function useChaosWebSocket() {
  const engine = useAudioEngine();
  const { quantize, remoteRelease } = useChaospadConfig();
  const { message } = useWebSocket_default();
  const remoteUsersRef = useRef2({});
  useEffect4(() => {
    for (const voice of Object.values(remoteUsersRef.current)) {
      voice.quantize = quantize;
    }
  }, [quantize]);
  useEffect4(() => {
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
import { useLayoutEffect as useLayoutEffect2 } from "react";
var UNLOCK_OPTS = { capture: true, passive: true };
function useAudioUnlock() {
  const engine = useAudioEngine();
  useLayoutEffect2(() => {
    const unlock = () => {
      engine.unlock();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") unlock();
    };
    document.addEventListener("touchstart", unlock, UNLOCK_OPTS);
    document.addEventListener("touchend", unlock, UNLOCK_OPTS);
    document.addEventListener("pointerdown", unlock, UNLOCK_OPTS);
    document.addEventListener("pointerup", unlock, UNLOCK_OPTS);
    document.addEventListener("click", unlock, UNLOCK_OPTS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("touchstart", unlock, UNLOCK_OPTS);
      document.removeEventListener("touchend", unlock, UNLOCK_OPTS);
      document.removeEventListener("pointerdown", unlock, UNLOCK_OPTS);
      document.removeEventListener("pointerup", unlock, UNLOCK_OPTS);
      document.removeEventListener("click", unlock, UNLOCK_OPTS);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [engine]);
}

// src/components/ChaosPad/hooks/useGlobalPointerPad.ts
import { useLayoutEffect as useLayoutEffect3, useRef as useRef3 } from "react";
var DRAG_THRESHOLD_PX = 10;
var CLICK_SUPPRESS_MS = 400;
var PASSIVE_CAPTURE = { capture: true, passive: true };
var ACTIVE_CAPTURE = { capture: true, passive: false };
function useGlobalPointerPad(rootRef, surfaceRef, passThrough) {
  const { emitMotion } = useWebSocket_default();
  const engine = useAudioEngine();
  const { glowIntervalMs } = useChaospadConfig();
  const emitMotionRef = useRef3(emitMotion);
  const engineRef = useRef3(engine);
  const sessionsRef = useRef3(/* @__PURE__ */ new Map());
  const suppressClickUntilRef = useRef3(0);
  const holdIntervalRef = useRef3(null);
  emitMotionRef.current = emitMotion;
  engineRef.current = engine;
  useLayoutEffect3(() => {
    var _a;
    const stopHoldHeartbeat = () => {
      if (holdIntervalRef.current == null) return;
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    };
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
    const emitHoldMove = () => {
      const session = sessionsRef.current.values().next().value;
      if (!session) return;
      unlockAudio();
      emit(session.lastX, session.lastY, "move");
    };
    const startHoldHeartbeat = () => {
      if (holdIntervalRef.current != null) return;
      holdIntervalRef.current = setInterval(emitHoldMove, glowIntervalMs);
    };
    const endSession = (pointerId, clientX, clientY, event) => {
      const session = sessionsRef.current.get(pointerId);
      if (!session) return;
      sessionsRef.current.delete(pointerId);
      emit(clientX, clientY, "stop");
      if (sessionsRef.current.size === 0) stopHoldHeartbeat();
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
      stopHoldHeartbeat();
    };
    const unlockAudio = () => {
      engineRef.current.unlock();
    };
    const onTouchStart = () => {
      unlockAudio();
    };
    const onPointerDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      unlockAudio();
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
      startHoldHeartbeat();
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
      unlockAudio();
      endSession(e.pointerId, e.clientX, e.clientY, e);
    };
    const onPointerCancel = (e) => {
      endSession(e.pointerId, e.clientX, e.clientY, e);
    };
    const onTouchMove = (e) => {
      if (sessionsRef.current.size === 0) return;
      unlockAudio();
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
      unlockAudio();
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
    document.addEventListener("touchstart", onTouchStart, PASSIVE_CAPTURE);
    document.addEventListener("touchend", onTouchEnd, PASSIVE_CAPTURE);
    target.addEventListener("pointerdown", onPointerDown, PASSIVE_CAPTURE);
    target.addEventListener("pointermove", onPointerMove, ACTIVE_CAPTURE);
    target.addEventListener("pointerup", onPointerUp, PASSIVE_CAPTURE);
    target.addEventListener("pointercancel", onPointerCancel, PASSIVE_CAPTURE);
    document.addEventListener("touchmove", onTouchMove, ACTIVE_CAPTURE);
    document.addEventListener("touchcancel", onTouchCancel, PASSIVE_CAPTURE);
    document.addEventListener("visibilitychange", endAllSessions);
    window.addEventListener("blur", endAllSessions);
    if (passThrough) {
      document.addEventListener("click", onClickCapture, true);
      document.addEventListener("dragstart", onDragStart, ACTIVE_CAPTURE);
    }
    return () => {
      document.removeEventListener("touchstart", onTouchStart, PASSIVE_CAPTURE);
      document.removeEventListener("touchend", onTouchEnd, PASSIVE_CAPTURE);
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
      stopHoldHeartbeat();
    };
  }, [passThrough, rootRef, surfaceRef, glowIntervalMs]);
}

// src/components/ChaosPad/helpers/padVisualBridge.ts
var handler = null;
var motionByKey = /* @__PURE__ */ new Map();
var SMOOTH = 0.11;
var MAX_SPEED = 2.2;
function registerPadVisual(h) {
  handler = h;
}
function unregisterPadVisual() {
  handler = null;
  motionByKey.clear();
}
function computeImpulse(prev, vx, vy) {
  if (!prev) return 0;
  const dvx = vx - prev.vx;
  const dvy = vy - prev.vy;
  const deltaMag = Math.hypot(dvx, dvy);
  const prevMag = Math.hypot(prev.vx, prev.vy);
  const curMag = Math.hypot(vx, vy);
  let turn = 0;
  if (prevMag > 0.025 && curMag > 0.025) {
    const dot = (prev.vx * vx + prev.vy * vy) / (prevMag * curMag);
    turn = Math.min(1, Math.max(0, 1 - dot));
  }
  const deltaNorm = Math.min(deltaMag / 1.1, 1);
  return Math.min(1, deltaNorm * 0.6 + turn * 0.4);
}
function updateMotion(nx, ny, key) {
  var _a, _b;
  const now = Date.now();
  const prev = motionByKey.get(key);
  let vx = (_a = prev == null ? void 0 : prev.vx) != null ? _a : 0;
  let vy = (_b = prev == null ? void 0 : prev.vy) != null ? _b : 0;
  if (prev) {
    const dt = (now - prev.t) / 1e3;
    if (dt > 0 && dt < 0.35) {
      const rawVx = (nx - prev.nx) / dt;
      const rawVy = (ny - prev.ny) / dt;
      vx = prev.vx + SMOOTH * (rawVx - prev.vx);
      vy = prev.vy + SMOOTH * (rawVy - prev.vy);
      const mag = Math.hypot(vx, vy);
      if (mag > MAX_SPEED) {
        vx = vx / mag * MAX_SPEED;
        vy = vy / mag * MAX_SPEED;
      }
    }
  }
  const impulse = computeImpulse(prev, vx, vy);
  motionByKey.set(key, { nx, ny, t: now, vx, vy });
  return { vx, vy, impulse };
}
function readStopMotion(key) {
  var _a, _b;
  const prev = motionByKey.get(key);
  const vx = (_a = prev == null ? void 0 : prev.vx) != null ? _a : 0;
  const vy = (_b = prev == null ? void 0 : prev.vy) != null ? _b : 0;
  motionByKey.delete(key);
  return {
    vx,
    vy,
    impulse: Math.min(Math.hypot(vx, vy) / MAX_SPEED, 1)
  };
}
function trackPadMotion(nx, ny, key = "default") {
  return updateMotion(nx, ny, key);
}
function spawnVisualSplat(nx, ny, color, size, key = "default", opts) {
  var _a;
  if (!handler) return false;
  const motion = (opts == null ? void 0 : opts.stopped) ? readStopMotion(key) : (_a = opts == null ? void 0 : opts.motion) != null ? _a : updateMotion(nx, ny, key);
  handler({
    x: nx,
    y: ny,
    dx: motion.vx,
    dy: motion.vy,
    color,
    radius: size * 4e-3,
    key,
    impulse: motion.impulse,
    stopped: opts == null ? void 0 : opts.stopped
  });
  return true;
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

// src/components/ChaosPad/helpers/spawnVisual.ts
var spawnVisual = (container, nx, ny, color, size, key, opts) => {
  if (spawnVisualSplat(nx, ny, color, size, key, opts)) return;
  const { width, height } = container.getBoundingClientRect();
  spawnGlow_default(container, nx * width, ny * height, color, size);
};
var spawnVisual_default = spawnVisual;

// src/components/ChaosPad/helpers/throttledSpawn.ts
var IMPULSE_BYPASS = 0.32;
var createThrottledSpawn = (intervalMs, glowSize) => {
  const lastGlowTimeByKey = /* @__PURE__ */ new Map();
  return (container, nx, ny, color, _type, key = "default", motion) => {
    var _a, _b;
    const now = Date.now();
    const lastGlowTime = (_a = lastGlowTimeByKey.get(key)) != null ? _a : 0;
    const elapsed = now - lastGlowTime;
    const impulse = (_b = motion == null ? void 0 : motion.impulse) != null ? _b : 0;
    const forceSpawn = impulse >= IMPULSE_BYPASS;
    if (!forceSpawn) {
      const jittered = intervalMs * (0.75 + Math.random() * 0.55);
      if (elapsed < jittered) return;
      if (elapsed < intervalMs * 1.8 && Math.random() < 0.15) return;
    }
    lastGlowTimeByKey.set(key, now);
    const opts = motion ? { motion } : void 0;
    spawnVisual_default(container, nx, ny, color, glowSize, key, opts);
  };
};
var throttledSpawn_default = createThrottledSpawn;

// src/components/ChaosPad/GlowFx.tsx
import { useEffect as useEffect5, useMemo, useRef as useRef4 } from "react";
var LOCAL_GLOW_KEY = "__local__";
var GlowEffect = ({ containerRef }) => {
  const { color, message, subscribeMotion } = useWebSocket_default();
  const { glowIntervalMs, glowSize } = useChaospadConfig();
  const colorRef = useRef4(color);
  colorRef.current = color;
  const throttledSpawn = useMemo(
    () => throttledSpawn_default(glowIntervalMs, glowSize),
    [glowIntervalMs, glowSize]
  );
  useEffect5(() => {
    return subscribeMotion(({ pos, type }) => {
      const container = containerRef.current;
      if (!pos || !container) return;
      if (type === "stop") {
        spawnVisual_default(
          container,
          pos.nx,
          pos.ny,
          colorRef.current,
          glowSize,
          LOCAL_GLOW_KEY,
          { stopped: true }
        );
        return;
      }
      const motion = trackPadMotion(pos.nx, pos.ny, LOCAL_GLOW_KEY);
      throttledSpawn(
        container,
        pos.nx,
        pos.ny,
        colorRef.current,
        type,
        LOCAL_GLOW_KEY,
        motion
      );
    });
  }, [containerRef, glowSize, subscribeMotion, throttledSpawn]);
  useEffect5(() => {
    const container = containerRef.current;
    if (!message || !container || !message.userId) return;
    if (message.type === "stop") {
      spawnVisual_default(
        container,
        message.nx,
        message.ny,
        message.color,
        glowSize,
        message.userId,
        { stopped: true }
      );
      return;
    }
    const motion = trackPadMotion(message.nx, message.ny, message.userId);
    throttledSpawn(
      container,
      message.nx,
      message.ny,
      message.color,
      message.type,
      message.userId,
      motion
    );
  }, [message, containerRef, glowSize, throttledSpawn]);
  return null;
};
var GlowFx_default = GlowEffect;

// src/components/ChaosPad/webgl/glUtils.ts
function createShader(gl, type, source) {
  var _a;
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = (_a = gl.getShaderInfoLog(shader)) != null ? _a : "unknown";
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log}`);
  }
  return shader;
}
function createProgram(gl, vertexSource, fragmentSource) {
  var _a;
  const vs = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, "aPosition");
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = (_a = gl.getProgramInfoLog(program)) != null ? _a : "unknown";
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${log}`);
  }
  return program;
}
function parseHexColor(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

// src/components/ChaosPad/webgl/particleShaders.ts
var PARTICLE_VERTEX = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in float aLife;
layout(location = 2) in vec3 aColor;
layout(location = 3) in float aSize;

uniform vec2 uResolution;

out float vLife;
out vec3 vColor;

void main() {
	// aPosition.y: 0 = top, 1 = bottom (matches pointer ny)
	vec2 clip = vec2(aPosition.x * 2.0 - 1.0, 1.0 - aPosition.y * 2.0);
	gl_Position = vec4(clip, 0.0, 1.0);
	vLife = aLife;
	float lifeScale = 0.45 + 0.55 * vLife;
	gl_PointSize = max(aSize * lifeScale * uResolution.y * 0.0028, 2.0);
	vColor = aColor;
}
`;
var PARTICLE_FRAGMENT = `#version 300 es
precision highp float;

in float vLife;
in vec3 vColor;
out vec4 outColor;

void main() {
	vec2 uv = gl_PointCoord - 0.5;
	float d2 = dot(uv, uv);

	float core = exp(-d2 * 12.0);
	float halo = exp(-d2 * 4.5);

	float alpha = (core * 0.62 + halo * 0.28) * vLife;
	vec3 rgb = vColor * (0.55 + core * 0.45 + halo * 0.15);

	outColor = vec4(rgb, alpha);
}
`;
var FADE_VERTEX = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;

out vec2 vUv;

void main() {
	vUv = aPosition * 0.5 + 0.5;
	gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;
var FADE_FRAGMENT = `#version 300 es
precision highp float;

uniform sampler2D uTexture;
uniform float uFade;

in vec2 vUv;
out vec4 outColor;

void main() {
	vec4 c = texture(uTexture, vUv);
	outColor = c * uFade;
}
`;

// src/components/ChaosPad/webgl/ParticleSim.ts
var MAX_PARTICLES = 16e3;
var BURST_COUNT = 26;
var STRIDE = 7;
var FLOW_LERP = 0.09;
var TRAIL_FADE = 0.968;
var hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
var noise2 = (x, y) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
};
var fbm = (x, y) => {
  let v = 0;
  let a = 0.5;
  let px = x;
  let py = y;
  for (let i = 0; i < 4; i++) {
    v += a * noise2(px, py);
    px *= 2.03;
    py *= 2.03;
    a *= 0.5;
  }
  return v;
};
var sampleFlow = (x, y, t, seed) => {
  const s = seed * 19.17;
  const sc = 5.5 + seed % 1 * 4;
  const tx = t * (0.06 + seed % 0.07);
  const ty = t * (0.055 + seed % 0.06);
  const px = x * sc + s + tx;
  const py = y * sc + s * 0.7 + ty;
  const eps = 0.04;
  const n = fbm(px, py);
  const nx = fbm(px + eps, py) - fbm(px - eps, py);
  const ny = fbm(px, py + eps) - fbm(px, py - eps);
  const px2 = x * (sc * 2.1) + s * 2.3 + tx * 0.6;
  const py2 = y * (sc * 2.1) + s * 1.1 + ty * 0.7;
  const nx2 = fbm(px2 + eps, py2) - fbm(px2 - eps, py2);
  const ny2 = fbm(px2, py2 + eps) - fbm(px2, py2 - eps);
  return {
    curlX: (ny + ny2 * 0.45) * 0.011,
    curlY: -(nx + nx2 * 0.45) * 0.011,
    boost: (n - 0.5) * 5e-3
  };
};
var lerp = (a, b, t) => a + (b - a) * t;
var QUAD_VERTS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
var ParticleSim = class {
  constructor(canvas) {
    this.particles = [];
    this.count = 0;
    this.displayWidth = 1;
    this.displayHeight = 1;
    this.time = 0;
    this.pending = [];
    this.flowByKey = /* @__PURE__ */ new Map();
    this.lastFrame = 0;
    this.fbWidth = 0;
    this.fbHeight = 0;
    this.readIdx = 0;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false
    });
    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;
    this.program = createProgram(gl, PARTICLE_VERTEX, PARTICLE_FRAGMENT);
    this.fadeProgram = createProgram(gl, FADE_VERTEX, FADE_FRAGMENT);
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    if (!vao || !buffer) throw new Error("Failed to create GPU buffers");
    this.vao = vao;
    this.buffer = buffer;
    this.cpuData = new Float32Array(MAX_PARTICLES * STRIDE);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.cpuData.byteLength, gl.DYNAMIC_DRAW);
    const stride = STRIDE * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 8);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 12);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 24);
    gl.bindVertexArray(null);
    const quadVao = gl.createVertexArray();
    const quadBuffer = gl.createBuffer();
    if (!quadVao || !quadBuffer) throw new Error("Failed to create quad buffers");
    this.quadVao = quadVao;
    this.quadBuffer = quadBuffer;
    gl.bindVertexArray(quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTS, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.bindVertexArray(null);
    this.fbos = [gl.createFramebuffer(), gl.createFramebuffer()];
    this.textures = [gl.createTexture(), gl.createTexture()];
    this.lastFrame = performance.now();
  }
  resize(displayWidth, displayHeight) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.displayWidth = Math.max(1, Math.floor(displayWidth * dpr));
    this.displayHeight = Math.max(1, Math.floor(displayHeight * dpr));
    if (this.displayWidth !== this.fbWidth || this.displayHeight !== this.fbHeight) {
      this.fbWidth = this.displayWidth;
      this.fbHeight = this.displayHeight;
      this.initFramebuffers();
    }
  }
  pushSplat(s) {
    this.pending.push(s);
  }
  step() {
    const now = performance.now();
    const dt = Math.min(0.04, Math.max(8e-3, (now - this.lastFrame) / 1e3));
    this.lastFrame = now;
    this.time += dt;
    for (const s of this.pending) this.spawnBurst(s);
    this.pending.length = 0;
    this.update(dt);
    this.draw();
  }
  destroy() {
    const gl = this.gl;
    gl.deleteBuffer(this.buffer);
    gl.deleteBuffer(this.quadBuffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteVertexArray(this.quadVao);
    gl.deleteProgram(this.program);
    gl.deleteProgram(this.fadeProgram);
    for (const fb of this.fbos) gl.deleteFramebuffer(fb);
    for (const tex of this.textures) gl.deleteTexture(tex);
  }
  initFramebuffers() {
    const gl = this.gl;
    const { fbWidth: w, fbHeight: h } = this;
    for (let i = 0; i < 2; i++) {
      gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[i]);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        this.textures[i],
        0
      );
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  smoothFlow(key, dx, dy) {
    var _a;
    const speed = Math.hypot(dx, dy);
    const prev = (_a = this.flowByKey.get(key)) != null ? _a : { x: 0, y: 0, speed: 0 };
    let tx = prev.x;
    let ty = prev.y;
    if (speed > 0.02) {
      tx = dx / speed;
      ty = dy / speed;
    }
    const flow = {
      x: lerp(prev.x, tx, FLOW_LERP),
      y: lerp(prev.y, ty, FLOW_LERP),
      speed: lerp(prev.speed, Math.min(speed, 2.2), FLOW_LERP)
    };
    const mag = Math.hypot(flow.x, flow.y);
    if (mag > 1e-3) {
      flow.x /= mag;
      flow.y /= mag;
    }
    this.flowByKey.set(key, flow);
    return flow;
  }
  spawnBurst(s) {
    var _a, _b;
    const [cr, cg, cb] = parseHexColor(s.color);
    const key = (_a = s.key) != null ? _a : "__local__";
    const stopped = s.stopped === true;
    const impulse = (_b = s.impulse) != null ? _b : 0;
    const touchSpeed = Math.hypot(s.dx, s.dy);
    const hasInertia = touchSpeed > 0.015 || stopped || impulse > 0.08;
    const touchDirX = touchSpeed > 1e-4 ? s.dx / touchSpeed : 0;
    const touchDirY = touchSpeed > 1e-4 ? s.dy / touchSpeed : 0;
    const speedNorm = Math.min(touchSpeed / MAX_SPEED, 1);
    const motionBoost = Math.min(
      speedNorm * 0.7 + impulse * 0.45 + (stopped ? speedNorm * 0.25 : 0),
      1
    );
    const flow = this.smoothFlow(key, s.dx, s.dy);
    const isSwipe = hasInertia && (touchSpeed > 0.022 || impulse > 0.14 || stopped);
    let dirX = touchDirX || flow.x;
    let dirY = touchDirY || flow.y;
    if (!isSwipe) {
      dirX = 0;
      dirY = 0;
    }
    const perpX = -dirY;
    const perpY = dirX;
    const swipe = Math.min(Math.max(touchSpeed, flow.speed) * 0.45, 1);
    const radiusJitter = 0.92 + Math.random() * 0.16;
    const baseRadius = (stopped ? 0.042 + speedNorm * 0.035 : isSwipe ? 0.046 + swipe * 0.08 : 0.044) * radiusJitter;
    const stretch = isSwipe ? 1 + swipe * (0.18 + motionBoost * 0.14 + Math.random() * 0.08) : 1;
    const burstCount = Math.round(
      (stopped ? BURST_COUNT * (0.75 + speedNorm * 0.35) : isSwipe ? BURST_COUNT + swipe * 10 + impulse * 4 : BURST_COUNT) * (0.88 + Math.random() * 0.22)
    );
    const inertiaBase = Math.min(
      touchSpeed * 0.022 + impulse * 0.06 + (stopped ? speedNorm * 0.035 : 0),
      0.11
    );
    const inheritScale = 6e-3 + speedNorm * 9e-3 + impulse * 0.012 + (stopped ? speedNorm * 0.014 : 0);
    const burstSeed = Math.random() * 1e3;
    for (let i = 0; i < burstCount; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }
      const pSeed = burstSeed + i * 1.618 + Math.random() * 7;
      const angle = Math.random() * Math.PI * 2;
      const gauss = (Math.random() + Math.random() + Math.random()) / 3;
      const ring = Math.sqrt(Math.random());
      const dist = (gauss * gauss * 0.62 + ring * 0.38) * baseRadius;
      let ox = Math.cos(angle) * dist;
      let oy = Math.sin(angle) * dist;
      if (isSwipe) {
        const along = ox * dirX + oy * dirY;
        const perp = ox * perpX + oy * perpY;
        const perpScale = stopped || impulse > 0.35 ? 0.72 + Math.random() * 0.2 : 0.88 + Math.random() * 0.12;
        ox = dirX * along * stretch + perpX * perp * perpScale;
        oy = dirY * along * stretch + perpY * perp * perpScale;
      }
      const n = fbm(s.x * 14 + ox * 22 + pSeed, s.y * 14 + oy * 22 + pSeed * 0.7);
      ox += (n - 0.5) * baseRadius * 0.18;
      oy += (fbm(s.y * 14 + pSeed, s.x * 14 + pSeed) - 0.5) * baseRadius * 0.18;
      const omag = Math.hypot(ox, oy) || 1e-4;
      const outX = ox / omag;
      const outY = oy / omag;
      const spd = 0.012 + Math.random() * 0.018 + swipe * (0.022 + Math.random() * 0.018) + dist * (0.12 + Math.random() * 0.1);
      const flowMix = isSwipe ? 0.22 + motionBoost * 0.28 + Math.random() * 0.08 : 0;
      let vx = (outX * (1 - flowMix) + dirX * flowMix) * spd + (Math.random() - 0.5) * 5e-3;
      let vy = (outY * (1 - flowMix) + dirY * flowMix) * spd + (Math.random() - 0.5) * 5e-3;
      if (hasInertia) {
        const alongBias = 0.65 + Math.random() * 0.35;
        vx += touchDirX * inertiaBase * alongBias;
        vy += touchDirY * inertiaBase * alongBias;
        if (touchSpeed > 0.012 || stopped) {
          const inherit = inheritScale * (0.75 + Math.random() * 0.35);
          vx += s.dx * inherit;
          vy += s.dy * inherit;
        }
      }
      this.particles.push({
        x: s.x + ox,
        y: s.y + oy,
        vx,
        vy,
        life: 1,
        maxLife: 1.2 + motionBoost * 0.45 + (stopped ? 0.35 : 0) + Math.random() * 1,
        r: cr + (Math.random() - 0.5) * 0.04,
        g: cg + (Math.random() - 0.5) * 0.04,
        b: cb + (Math.random() - 0.5) * 0.04,
        size: 0.78 + Math.random() * 0.72,
        flowX: dirX || flow.x,
        flowY: dirY || flow.y,
        seed: pSeed,
        drag: 0.975 + Math.random() * 0.012
      });
    }
  }
  update(dt) {
    const alive = [];
    const t = this.time;
    const subSteps = 2;
    const subDt = dt / subSteps;
    for (const p of this.particles) {
      for (let s = 0; s < subSteps; s++) {
        const field = sampleFlow(p.x, p.y, t + s * subDt * 0.5, p.seed);
        const vmag = Math.hypot(p.vx, p.vy);
        if (vmag > 4e-4) {
          const blend = Math.min(subDt * 1.1, 0.015);
          p.flowX = lerp(p.flowX, p.vx / vmag, blend);
          p.flowY = lerp(p.flowY, p.vy / vmag, blend);
        }
        p.vx += field.curlX + p.flowX * field.boost;
        p.vy += field.curlY + p.flowY * field.boost;
        p.x += p.vx * subDt;
        p.y += p.vy * subDt;
        const lifeDrag = 1 - p.life;
        p.vx *= p.drag - lifeDrag * 15e-4;
        p.vy *= p.drag - lifeDrag * 15e-4;
      }
      p.life -= dt / p.maxLife;
      if (p.life > 0 && p.x > -0.08 && p.x < 1.08 && p.y > -0.08 && p.y < 1.08) {
        alive.push(p);
      }
    }
    this.particles = alive;
  }
  draw() {
    const gl = this.gl;
    const { displayWidth: w, displayHeight: h } = this;
    gl.viewport(0, 0, w, h);
    const writeIdx = 1 - this.readIdx;
    const readTex = this.textures[this.readIdx];
    const writeFbo = this.fbos[writeIdx];
    gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.useProgram(this.fadeProgram);
    gl.bindVertexArray(this.quadVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, readTex);
    gl.uniform1i(gl.getUniformLocation(this.fadeProgram, "uTexture"), 0);
    gl.uniform1f(
      gl.getUniformLocation(this.fadeProgram, "uFade"),
      TRAIL_FADE
    );
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.count = this.particles.length;
    if (this.count > 0) {
      const data = this.cpuData;
      for (let i = 0; i < this.count; i++) {
        const p = this.particles[i];
        const o = i * STRIDE;
        const t = p.life;
        const fade = t * t * (3 - 2 * t);
        data[o] = p.x;
        data[o + 1] = p.y;
        data[o + 2] = fade;
        data[o + 3] = p.r;
        data[o + 4] = p.g;
        data[o + 5] = p.b;
        data[o + 6] = p.size;
      }
      gl.useProgram(this.program);
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        0,
        data.subarray(0, this.count * STRIDE)
      );
      gl.uniform2f(
        gl.getUniformLocation(this.program, "uResolution"),
        w,
        h
      );
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.drawArrays(gl.POINTS, 0, this.count);
    }
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.useProgram(this.fadeProgram);
    gl.bindVertexArray(this.quadVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[writeIdx]);
    gl.uniform1i(gl.getUniformLocation(this.fadeProgram, "uTexture"), 0);
    gl.uniform1f(gl.getUniformLocation(this.fadeProgram, "uFade"), 1);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
    this.readIdx = writeIdx;
  }
};

// src/components/ChaosPad/PadGlCanvas.tsx
import { useEffect as useEffect6, useRef as useRef5 } from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
function PadGlCanvas({ containerRef }) {
  const canvasRef = useRef5(null);
  const simRef = useRef5(null);
  const rafRef = useRef5(0);
  useEffect6(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    let sim;
    try {
      sim = new ParticleSim(canvas);
    } catch (err) {
      console.warn(
        "[chaospad] webgl particles init failed, falling back to css",
        err
      );
      return;
    }
    simRef.current = sim;
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      sim.resize(width, height);
    };
    registerPadVisual((splat) => sim.pushSplat(splat));
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    const loop = () => {
      sim.step();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      unregisterPadVisual();
      ro.disconnect();
      sim.destroy();
      simRef.current = null;
    };
  }, [containerRef]);
  return /* @__PURE__ */ jsx3(
    "canvas",
    {
      ref: canvasRef,
      className: "chaospad-gl-canvas",
      "aria-hidden": "true"
    }
  );
}

// src/components/ChaosPad/ChaosPad.tsx
import { useRef as useRef6 } from "react";
import { jsx as jsx4, jsxs } from "react/jsx-runtime";
function ChaosPad({ className, style }) {
  const { pointerPassThrough, visualMode } = useChaospadConfig();
  const rootRef = useRef6(null);
  const surfaceRef = useRef6(null);
  const glowContainerRef = useRef6(null);
  useAudioUnlock();
  useChaosAudio();
  useChaosWebSocket();
  useGlobalPointerPad(rootRef, surfaceRef, pointerPassThrough);
  const rootClass = [
    "chaospad-root",
    pointerPassThrough && "chaospad-pass-through",
    className
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxs("div", { ref: rootRef, className: rootClass, style, children: [
    /* @__PURE__ */ jsx4("div", { ref: surfaceRef, className: "chaospad-surface", "aria-hidden": "true" }),
    /* @__PURE__ */ jsx4("div", { ref: glowContainerRef, className: "chaospad-glow-layer", children: visualMode === "webgl" && /* @__PURE__ */ jsx4(PadGlCanvas, { containerRef: glowContainerRef }) }),
    /* @__PURE__ */ jsx4(GlowFx_default, { containerRef: glowContainerRef })
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
  let hash2 = 0;
  for (let i = 0; i < id.length; i++) {
    hash2 = id.charCodeAt(i) + ((hash2 << 5) - hash2);
  }
  const index = Math.abs(hash2) % colors.length;
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
import { useCallback as useCallback2, useEffect as useEffect7, useRef as useRef7, useState as useState3 } from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
var RECONNECT_MS = 1500;
var WebSocketProvider = ({ children }) => {
  const { wsUrl, userId: configUserId } = useChaospadConfig();
  const [pos, setPos] = useState3(void 0);
  const [type, setType] = useState3("stop");
  const wsRef = useRef7(null);
  const userIdRef = useRef7(configUserId != null ? configUserId : getUserId());
  const userId = userIdRef.current;
  const color = getColorForUser(userId) || colors[0];
  const [message, setMessage] = useState3(void 0);
  const messageSeqRef = useRef7(0);
  const typeRef = useRef7(type);
  const posRef = useRef7(pos);
  const colorRef = useRef7(color);
  typeRef.current = type;
  posRef.current = pos;
  colorRef.current = color;
  const motionListenersRef = useRef7(/* @__PURE__ */ new Set());
  const pendingPayloadRef = useRef7(null);
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
  const sendNowRef = useRef7(sendNow);
  sendNowRef.current = sendNow;
  const emitMotion = useCallback2((nextPos, nextType) => {
    posRef.current = nextPos;
    typeRef.current = nextType;
    setPos(nextPos);
    setType(nextType);
    sendNowRef.current();
    for (const listener of motionListenersRef.current) {
      listener({ pos: nextPos, type: nextType });
    }
  }, []);
  const subscribeMotion = useCallback2((listener) => {
    motionListenersRef.current.add(listener);
    return () => {
      motionListenersRef.current.delete(listener);
    };
  }, []);
  useEffect7(() => {
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
  return /* @__PURE__ */ jsx5(
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
	overflow: hidden;
	pointer-events: none;
	z-index: 1;
}

.chaospad-gl-canvas {
	position: absolute;
	inset: 0;
	display: block;
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
import { useEffect as useEffect8 } from "react";
import { jsx as jsx6 } from "react/jsx-runtime";
function Chaospad({ config, className, style }) {
  useEffect8(() => {
    injectChaospadStyles();
  }, []);
  return /* @__PURE__ */ jsx6(ChaospadConfigProvider, { config, children: /* @__PURE__ */ jsx6(WsContextProvider_default, { children: /* @__PURE__ */ jsx6(AudioEngineProvider, { children: /* @__PURE__ */ jsx6(ChaosPad, { className, style }) }) }) });
}
var Chaospad_default = Chaospad;
export {
  Chaospad,
  DEFAULT_CHAOSPAD_CONFIG,
  DEFAULT_WS_PORT,
  DEFAULT_WS_URL,
  Chaospad_default as default,
  resolveChaospadConfig,
  resolveDefaultWsUrl,
  resolveWebSocketUrl
};
//# sourceMappingURL=index.js.map