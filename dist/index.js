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
  pointerPassThrough: true
};
function resolveChaospadConfig(config, opts) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
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
    pointerPassThrough: (_j = config == null ? void 0 : config.pointerPassThrough) != null ? _j : DEFAULT_CHAOSPAD_CONFIG.pointerPassThrough
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
  const impulse2 = ctx.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c++) {
    const channel = impulse2.getChannelData(c);
    for (let i = 0; i < length; i++) {
      channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse2;
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

// src/components/AudioEngineContext/helpers/padParams.ts
function getPadParams(nx, ny, quantize = "none") {
  const { freq: rawFreq, amp } = getSoundParamsFromXY(nx, ny);
  return {
    freq: quantizeFreq(rawFreq, quantize),
    amp: amp * 0.5,
    pan: nx * 2 - 1,
    reverbSend: ny * 0.75
  };
}

// src/components/AudioEngineContext/helpers/spatialChain.ts
var SMOOTH = 0.03;
function createSpatialChain(ctx) {
  const input = ctx.createGain();
  const panner = ctx.createStereoPanner();
  const dryOut = ctx.createGain();
  const wetOut = ctx.createGain();
  input.connect(panner);
  panner.connect(dryOut);
  panner.connect(wetOut);
  const setParams = (pan, reverbSend) => {
    const t = ctx.currentTime;
    panner.pan.setTargetAtTime(pan, t, SMOOTH);
    dryOut.gain.setTargetAtTime(1 - reverbSend * 0.65, t, SMOOTH);
    wetOut.gain.setTargetAtTime(reverbSend, t, SMOOTH);
  };
  return {
    input,
    dryOut,
    wetOut,
    setParams,
    dispose: () => {
      input.disconnect();
      panner.disconnect();
      dryOut.disconnect();
      wetOut.disconnect();
    }
  };
}

// src/components/WsContext/helpers/getUserParams.ts
var colors = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#eab308",
  "#a855f7"
];
function hashUserIndex(id, size) {
  if (!id || size <= 0) return 0;
  let hash2 = 0;
  for (let i = 0; i < id.length; i++) {
    hash2 = id.charCodeAt(i) + ((hash2 << 5) - hash2);
  }
  return Math.abs(hash2) % size;
}
var getColorForUser = (id) => {
  if (!id) return void 0;
  return colors[hashUserIndex(id, colors.length)];
};
var getUserId = () => {
  try {
    return crypto.randomUUID();
  } catch (_error) {
    console.log("Error: Insecure environment to use crypto.randomUUID");
    return Math.random().toFixed();
  }
};

// src/components/AudioEngineContext/presets/fmBell.ts
var SMOOTH2 = 0.03;
var MOD_RATIO = 4.07;
function createFmBell(ctx) {
  const output = ctx.createGain();
  const carrier = ctx.createOscillator();
  const mod = ctx.createOscillator();
  const modGain = ctx.createGain();
  const high = ctx.createBiquadFilter();
  carrier.type = "sine";
  mod.type = "sine";
  high.type = "highpass";
  high.frequency.value = 380;
  high.Q.value = 0.7;
  carrier.connect(output);
  carrier.connect(high);
  high.connect(output);
  mod.connect(modGain);
  modGain.connect(carrier.frequency);
  return {
    output,
    setParams(p) {
      const t = ctx.currentTime;
      carrier.frequency.setTargetAtTime(p.freq, t, SMOOTH2);
      mod.frequency.setTargetAtTime(p.freq * MOD_RATIO, t, SMOOTH2);
      modGain.gain.setTargetAtTime(600 + p.freq * 6.5, t, SMOOTH2);
      high.frequency.setTargetAtTime(280 + p.freq * 0.6, t, SMOOTH2);
      output.gain.setTargetAtTime(p.amp * 0.72, t, SMOOTH2);
    },
    start(when) {
      carrier.start(when);
      mod.start(when);
    },
    stop(release, when) {
      output.gain.cancelScheduledValues(when);
      output.gain.setValueAtTime(output.gain.value, when);
      output.gain.linearRampToValueAtTime(0, when + release);
      const end = when + release + 0.05;
      carrier.stop(end);
      mod.stop(end);
    },
    dispose() {
      carrier.disconnect();
      mod.disconnect();
      modGain.disconnect();
      high.disconnect();
      output.disconnect();
    }
  };
}

// src/components/AudioEngineContext/presets/filteredSaw.ts
var SMOOTH3 = 0.03;
function createFilteredSaw(ctx) {
  const output = ctx.createGain();
  const sine = ctx.createOscillator();
  const tri = ctx.createOscillator();
  const sineGain = ctx.createGain();
  const triGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  sine.type = "sine";
  tri.type = "triangle";
  sineGain.gain.value = 0.62;
  triGain.gain.value = 0.28;
  filter.type = "lowpass";
  filter.Q.value = 0.45;
  sine.connect(sineGain);
  tri.connect(triGain);
  sineGain.connect(filter);
  triGain.connect(filter);
  filter.connect(output);
  const vibrato = ctx.createOscillator();
  const vibratoDepth = ctx.createGain();
  vibrato.frequency.value = 2.8;
  vibratoDepth.gain.value = 5;
  vibrato.connect(vibratoDepth);
  vibratoDepth.connect(sine.detune);
  vibratoDepth.connect(tri.detune);
  return {
    output,
    setParams(p) {
      const t = ctx.currentTime;
      sine.frequency.setTargetAtTime(p.freq, t, SMOOTH3);
      tri.frequency.setTargetAtTime(p.freq, t, SMOOTH3);
      filter.frequency.setTargetAtTime(520 + p.freq * 1.6, t, SMOOTH3);
      output.gain.setTargetAtTime(p.amp * 0.88, t, SMOOTH3);
    },
    start(when) {
      sine.start(when);
      tri.start(when);
      vibrato.start(when);
    },
    stop(release, when) {
      output.gain.cancelScheduledValues(when);
      output.gain.setValueAtTime(output.gain.value, when);
      output.gain.linearRampToValueAtTime(0, when + release);
      const end = when + release + 0.05;
      sine.stop(end);
      tri.stop(end);
      vibrato.stop(end);
    },
    dispose() {
      sine.disconnect();
      tri.disconnect();
      sineGain.disconnect();
      triGain.disconnect();
      filter.disconnect();
      vibrato.disconnect();
      output.disconnect();
    }
  };
}

// src/components/AudioEngineContext/presets/noiseRes.ts
var SMOOTH4 = 0.03;
function createNoiseRes(ctx) {
  const output = ctx.createGain();
  const voices = [
    { detune: 0, level: 0.46 },
    { detune: -22, level: 0.27 },
    { detune: 22, level: 0.27 },
    { detune: -8, level: 0.14, octave: 0.5 },
    { detune: 5, level: 0.1, octave: 2 }
  ];
  const oscs = voices.map((v) => {
    var _a;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.detune.value = v.detune;
    gain.gain.value = v.level;
    osc.connect(gain);
    gain.connect(output);
    return { osc, gain, octave: (_a = v.octave) != null ? _a : 1 };
  });
  const vibrato = ctx.createOscillator();
  const vibratoDepth = ctx.createGain();
  vibrato.frequency.value = 3.1;
  vibratoDepth.gain.value = 14;
  vibrato.connect(vibratoDepth);
  oscs.forEach(({ osc }) => vibratoDepth.connect(osc.detune));
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 1600;
  tone.Q.value = 0.45;
  output.connect(tone);
  const out = ctx.createGain();
  tone.connect(out);
  return {
    output: out,
    setParams(p) {
      const t = ctx.currentTime;
      oscs.forEach(
        ({ osc, octave }) => osc.frequency.setTargetAtTime(p.freq * octave, t, SMOOTH4)
      );
      tone.frequency.setTargetAtTime(680 + p.freq * 2.1, t, SMOOTH4);
      out.gain.setTargetAtTime(p.amp * 0.92, t, SMOOTH4);
    },
    start(when) {
      oscs.forEach(({ osc }) => osc.start(when));
      vibrato.start(when);
    },
    stop(release, when) {
      out.gain.cancelScheduledValues(when);
      out.gain.setValueAtTime(out.gain.value, when);
      out.gain.linearRampToValueAtTime(0, when + release);
      const end = when + release + 0.05;
      oscs.forEach(({ osc }) => osc.stop(end));
      vibrato.stop(end);
    },
    dispose() {
      oscs.forEach(({ osc, gain }) => {
        osc.disconnect();
        gain.disconnect();
      });
      vibrato.disconnect();
      tone.disconnect();
      out.disconnect();
    }
  };
}

// src/components/AudioEngineContext/presets/sineChorus.ts
var SMOOTH5 = 0.03;
function createSineChorus(ctx) {
  const output = ctx.createGain();
  const voices = [
    { type: "triangle", detune: 0, level: 0.5 },
    { type: "triangle", detune: -14, level: 0.28 },
    { type: "triangle", detune: 14, level: 0.28 },
    { type: "sine", detune: 0, level: 0.12, octave: 2 }
  ];
  const oscs = voices.map((v) => {
    var _a;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = v.type;
    osc.detune.value = v.detune;
    gain.gain.value = v.level;
    osc.connect(gain);
    gain.connect(output);
    return { osc, gain, octave: (_a = v.octave) != null ? _a : 1 };
  });
  const vibrato = ctx.createOscillator();
  const vibratoDepth = ctx.createGain();
  vibrato.frequency.value = 5.2;
  vibratoDepth.gain.value = 10;
  vibrato.connect(vibratoDepth);
  oscs.forEach(({ osc }) => vibratoDepth.connect(osc.detune));
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 2200;
  tone.Q.value = 0.6;
  output.connect(tone);
  const out = ctx.createGain();
  tone.connect(out);
  return {
    output: out,
    setParams(p) {
      const t = ctx.currentTime;
      oscs.forEach(
        ({ osc, octave }) => osc.frequency.setTargetAtTime(p.freq * octave, t, SMOOTH5)
      );
      tone.frequency.setTargetAtTime(900 + p.freq * 2.8, t, SMOOTH5);
      out.gain.setTargetAtTime(p.amp * 0.95, t, SMOOTH5);
    },
    start(when) {
      oscs.forEach(({ osc }) => osc.start(when));
      vibrato.start(when);
    },
    stop(release, when) {
      out.gain.cancelScheduledValues(when);
      out.gain.setValueAtTime(out.gain.value, when);
      out.gain.linearRampToValueAtTime(0, when + release);
      const end = when + release + 0.05;
      oscs.forEach(({ osc }) => osc.stop(end));
      vibrato.stop(end);
    },
    dispose() {
      oscs.forEach(({ osc, gain }) => {
        osc.disconnect();
        gain.disconnect();
      });
      vibrato.disconnect();
      tone.disconnect();
      out.disconnect();
    }
  };
}

// src/components/AudioEngineContext/presets/catalog.ts
var PRESETS = [
  createSineChorus,
  createFmBell,
  createFilteredSaw,
  createNoiseRes
];
var PRESET_COUNT = PRESETS.length;
function getPresetForUser(userId) {
  const index = hashUserIndex(userId, PRESET_COUNT);
  return index;
}
function createPresetVoice(ctx, presetId) {
  return PRESETS[presetId](ctx);
}

// src/components/AudioEngineContext/Voice.ts
var ATTACK_S = 0.1;
var Voice = class {
  constructor(engine, position, quantize, presetId) {
    this.engine = engine;
    this.quantize = quantize;
    const ctx = engine.getContextForVoice();
    this.preset = createPresetVoice(ctx, presetId);
    this.spatial = createSpatialChain(ctx);
    this.preset.output.connect(this.spatial.input);
    engine.connectDry(this.spatial.dryOut);
    engine.connectWet(this.spatial.wetOut);
    const params = getPadParams(position.nx, position.ny, quantize);
    this.spatial.setParams(params.pan, params.reverbSend);
    const now = ctx.currentTime;
    this.preset.setParams({ freq: params.freq, amp: 0 });
    this.preset.output.gain.setValueAtTime(0, now);
    this.preset.output.gain.linearRampToValueAtTime(params.amp, now + ATTACK_S);
    this.preset.start(now + 1e-3);
  }
  updatePosition(nx, ny) {
    this.applyParams(getPadParams(nx, ny, this.quantize));
  }
  stop(releaseSeconds) {
    const ctx = this.engine.getContextForVoice();
    const now = ctx.currentTime;
    this.preset.stop(releaseSeconds, now);
    if (this.releaseTimer) clearTimeout(this.releaseTimer);
    this.releaseTimer = setTimeout(() => this.dispose(), releaseSeconds * 1e3 + 100);
  }
  applyParams(params) {
    this.preset.setParams({ freq: params.freq, amp: params.amp });
    this.spatial.setParams(params.pan, params.reverbSend);
  }
  dispose() {
    this.preset.dispose();
    this.spatial.dispose();
  }
};

// src/components/AudioEngineContext/AudioEngine.ts
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
  unlock() {
    if (!this.ctx) this.ctx = createAudioContext();
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
  setVolume(v) {
    this.volumeValue = v;
    if (this.masterGain) this.masterGain.gain.value = v;
  }
  setReverbLevel(v) {
    this.reverbLevelValue = v;
    if (this.convolverGain) this.convolverGain.gain.value = v;
  }
  createVoice(position, quantize = "none", presetId = 0) {
    this.unlock();
    return new Voice(this, position, quantize, presetId);
  }
  connectDry(node) {
    node.connect(this.masterGain);
  }
  connectWet(node) {
    if (this.convolver) node.connect(this.convolver);
  }
  getContextForVoice() {
    if (!this.ctx || !this.masterGain) {
      throw new Error("AudioEngine.unlock() must be called before playback");
    }
    return this.ctx;
  }
  initGraph() {
    const ctx = this.ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.volumeValue;
    this.masterGain.connect(ctx.destination);
    try {
      const impulse2 = createImpulseResponse(ctx);
      this.convolver = ctx.createConvolver();
      this.convolver.buffer = impulse2;
      this.convolverGain = ctx.createGain();
      this.convolverGain.gain.value = this.reverbLevelValue;
      this.convolver.connect(this.convolverGain);
      this.convolverGain.connect(this.masterGain);
    } catch (e) {
      this.convolver = null;
      this.convolverGain = null;
    }
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
  const { subscribeMotion, userId } = useWebSocket_default();
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
        voiceRef.current = engine.createVoice(
          position,
          quantize,
          getPresetForUser(userId)
        );
        isActiveRef.current = true;
      };
      try {
        engine.unlock();
      } finally {
        run();
      }
    },
    [engine, quantize, reverbLevel, userId, volume]
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
      if (type === "stop" && isActiveRef.current) stopAudio();
    });
  }, [startAudio, stopAudio, subscribeMotion]);
  return { isActive: isActiveRef.current };
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
  var _a, _b;
  engine.unlock();
  if (type === "start") {
    (_a = remoteUsersRef[userId]) == null ? void 0 : _a.stop(remoteRelease);
    remoteUsersRef[userId] = engine.createVoice(
      { nx, ny },
      quantize,
      getPresetForUser(userId)
    );
  }
  if (type === "move") {
    (_b = remoteUsersRef[userId]) == null ? void 0 : _b.updatePosition(nx, ny);
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

// src/components/ChaosPad/visual/constants.ts
var MOTION_SMOOTH = 0.11;
var MAX_TOUCH_SPEED = 2.2;
var IMPULSE_BYPASS = 0.32;

// src/components/ChaosPad/visual/motionTracker.ts
var samples = /* @__PURE__ */ new Map();
function impulse(prev, vx, vy) {
  if (!prev) return 0;
  const dvx = vx - prev.vx;
  const dvy = vy - prev.vy;
  const delta = Math.hypot(dvx, dvy);
  const prevMag = Math.hypot(prev.vx, prev.vy);
  const curMag = Math.hypot(vx, vy);
  let turn = 0;
  if (prevMag > 0.025 && curMag > 0.025) {
    const dot = (prev.vx * vx + prev.vy * vy) / (prevMag * curMag);
    turn = Math.min(1, Math.max(0, 1 - dot));
  }
  return Math.min(1, Math.min(delta / 1.1, 1) * 0.6 + turn * 0.4);
}
function trackMotion(nx, ny, key) {
  var _a, _b;
  const now = Date.now();
  const prev = samples.get(key);
  let vx = (_a = prev == null ? void 0 : prev.vx) != null ? _a : 0;
  let vy = (_b = prev == null ? void 0 : prev.vy) != null ? _b : 0;
  if (prev) {
    const dt = (now - prev.t) / 1e3;
    if (dt > 0 && dt < 0.35) {
      const rawVx = (nx - prev.nx) / dt;
      const rawVy = (ny - prev.ny) / dt;
      vx = prev.vx + MOTION_SMOOTH * (rawVx - prev.vx);
      vy = prev.vy + MOTION_SMOOTH * (rawVy - prev.vy);
      const mag = Math.hypot(vx, vy);
      if (mag > MAX_TOUCH_SPEED) {
        vx = vx / mag * MAX_TOUCH_SPEED;
        vy = vy / mag * MAX_TOUCH_SPEED;
      }
    }
  }
  const state = { vx, vy, impulse: impulse(prev, vx, vy) };
  samples.set(key, { nx, ny, t: now, vx, vy });
  return state;
}
function stopMotion(key) {
  var _a, _b;
  const prev = samples.get(key);
  const vx = (_a = prev == null ? void 0 : prev.vx) != null ? _a : 0;
  const vy = (_b = prev == null ? void 0 : prev.vy) != null ? _b : 0;
  samples.delete(key);
  return {
    vx,
    vy,
    impulse: Math.min(Math.hypot(vx, vy) / MAX_TOUCH_SPEED, 1)
  };
}
function resetMotionTracker() {
  samples.clear();
}

// src/components/ChaosPad/visual/bridge.ts
var handler = null;
function registerVisual(h) {
  handler = h;
}
function unregisterVisual() {
  handler = null;
  resetMotionTracker();
}
function emitSplat(nx, ny, color, key, opts) {
  var _a;
  if (!handler) return false;
  const motion = (opts == null ? void 0 : opts.stopped) ? stopMotion(key) : (_a = opts == null ? void 0 : opts.motion) != null ? _a : trackMotion(nx, ny, key);
  handler({
    x: nx,
    y: ny,
    dx: motion.vx,
    dy: motion.vy,
    color,
    key,
    impulse: motion.impulse,
    stopped: opts == null ? void 0 : opts.stopped
  });
  return true;
}

// src/components/ChaosPad/visual/throttledSpawn.ts
function createThrottledSpawn(intervalMs) {
  const lastAt = /* @__PURE__ */ new Map();
  return (nx, ny, color, _type, key, motion, opts) => {
    var _a, _b;
    const now = Date.now();
    const elapsed = now - ((_a = lastAt.get(key)) != null ? _a : 0);
    const force = ((_b = motion == null ? void 0 : motion.impulse) != null ? _b : 0) >= IMPULSE_BYPASS || (opts == null ? void 0 : opts.stopped);
    if (!force) {
      const wait = intervalMs * (0.75 + Math.random() * 0.55);
      if (elapsed < wait) return;
      if (elapsed < intervalMs * 1.8 && Math.random() < 0.15) return;
    }
    lastAt.set(key, now);
    emitSplat(nx, ny, color, key, __spreadValues({ motion }, opts));
  };
}

// src/components/ChaosPad/hooks/usePadVisual.ts
import { useEffect as useEffect5, useMemo, useRef as useRef4 } from "react";
var LOCAL_KEY = "__local__";
function usePadVisual() {
  const { color, message, subscribeMotion } = useWebSocket_default();
  const { glowIntervalMs } = useChaospadConfig();
  const colorRef = useRef4(color);
  colorRef.current = color;
  const spawn = useMemo(
    () => createThrottledSpawn(glowIntervalMs),
    [glowIntervalMs]
  );
  useEffect5(() => {
    return subscribeMotion(({ pos, type }) => {
      if (!pos) return;
      if (type === "stop") {
        emitSplat(pos.nx, pos.ny, colorRef.current, LOCAL_KEY, { stopped: true });
        return;
      }
      spawn(
        pos.nx,
        pos.ny,
        colorRef.current,
        type,
        LOCAL_KEY,
        trackMotion(pos.nx, pos.ny, LOCAL_KEY)
      );
    });
  }, [spawn, subscribeMotion]);
  useEffect5(() => {
    if (!(message == null ? void 0 : message.userId)) return;
    const { nx, ny, color: c, type, userId } = message;
    if (type === "stop") {
      emitSplat(nx, ny, c, userId, { stopped: true });
      return;
    }
    spawn(nx, ny, c, type, userId, trackMotion(nx, ny, userId));
  }, [message, spawn]);
}

// src/components/ChaosPad/webgl/constants.ts
var MAX_PARTICLES = 16e3;
var BURST_COUNT = 18;
var PARTICLE_STRIDE = 7;
var FLOW_LERP = 0.09;
var TRAIL_FADE = 0.972;

// src/components/ChaosPad/webgl/math.ts
var lerp = (a, b, t) => a + (b - a) * t;
var smoothLife = (life) => life * life * (3 - 2 * life);

// src/components/ChaosPad/webgl/drawParticles.ts
function drawParticles(res, particles, width, height) {
  const { gl, program, vao, buffer, cpuData } = res;
  const count = particles.length;
  if (count === 0) return 0;
  for (let i = 0; i < count; i++) {
    const p = particles[i];
    const o = i * PARTICLE_STRIDE;
    cpuData[o] = p.x;
    cpuData[o + 1] = p.y;
    cpuData[o + 2] = smoothLife(p.life);
    cpuData[o + 3] = p.r;
    cpuData[o + 4] = p.g;
    cpuData[o + 5] = p.b;
    cpuData[o + 6] = p.size;
  }
  gl.useProgram(program);
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, cpuData.subarray(0, count * PARTICLE_STRIDE));
  gl.uniform2f(gl.getUniformLocation(program, "uResolution"), width, height);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.drawArrays(gl.POINTS, 0, count);
  return count;
}

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

// src/components/ChaosPad/webgl/shaders.ts
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
	vec2 clip = vec2(aPosition.x * 2.0 - 1.0, 1.0 - aPosition.y * 2.0);
	gl_Position = vec4(clip, 0.0, 1.0);
	vLife = aLife;
	float lifeScale = 0.6 + 0.4 * vLife;
	gl_PointSize = max(aSize * lifeScale * uResolution.y * 0.0075, 6.0);
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
	float core = exp(-d2 * 16.0);
	float halo = exp(-d2 * 5.5);
	float energy = (core * 0.9 + halo * 0.1) * pow(vLife, 0.82);
	float luma = dot(vColor, vec3(0.299, 0.587, 0.114));
	vec3 col = mix(vec3(luma), vColor, 1.35);
	float alpha = energy * 0.88;
	vec3 rgb = col * energy * 0.92;
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
	outColor = texture(uTexture, vUv) * uFade;
}
`;

// src/components/ChaosPad/webgl/glResources.ts
var QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
function createGlResources(canvas) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    depth: false
  });
  if (!gl) throw new Error("WebGL2 not supported");
  const program = createProgram(gl, PARTICLE_VERTEX, PARTICLE_FRAGMENT);
  const fadeProgram = createProgram(gl, FADE_VERTEX, FADE_FRAGMENT);
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  const quadVao = gl.createVertexArray();
  const quadBuffer = gl.createBuffer();
  if (!vao || !buffer || !quadVao || !quadBuffer) {
    throw new Error("Failed to create GPU buffers");
  }
  const cpuData = new Float32Array(PARTICLE_STRIDE * 16e3);
  const stride = PARTICLE_STRIDE * 4;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, cpuData.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 8);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 12);
  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 24);
  gl.bindVertexArray(quadVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
  gl.bindVertexArray(null);
  return { gl, program, fadeProgram, vao, quadVao, buffer, quadBuffer, cpuData };
}
function destroyGlResources(r) {
  const { gl } = r;
  gl.deleteBuffer(r.buffer);
  gl.deleteBuffer(r.quadBuffer);
  gl.deleteVertexArray(r.vao);
  gl.deleteVertexArray(r.quadVao);
  gl.deleteProgram(r.program);
  gl.deleteProgram(r.fadeProgram);
}

// src/components/ChaosPad/webgl/burstMetrics.ts
function burstMetrics(s, flow) {
  var _a;
  const stopped = s.stopped === true;
  const impulse2 = (_a = s.impulse) != null ? _a : 0;
  const touchSpeed = Math.hypot(s.dx, s.dy);
  const speedNorm = Math.min(touchSpeed / MAX_TOUCH_SPEED, 1);
  const motionBoost = Math.min(
    speedNorm * 0.7 + impulse2 * 0.45 + (stopped ? speedNorm * 0.25 : 0),
    1
  );
  const isSwipe = (touchSpeed > 0.015 || stopped || impulse2 > 0.08) && (touchSpeed > 0.022 || impulse2 > 0.14 || stopped);
  let dirX = touchSpeed > 1e-4 ? s.dx / touchSpeed : flow.x;
  let dirY = touchSpeed > 1e-4 ? s.dy / touchSpeed : flow.y;
  if (!isSwipe) {
    dirX = 0;
    dirY = 0;
  }
  const swipe = Math.min(Math.max(touchSpeed, flow.speed) * 0.45, 1);
  const baseRadius = (stopped ? 0.062 + speedNorm * 0.05 : isSwipe ? 0.068 + swipe * 0.12 : 0.065) * (0.9 + Math.random() * 0.22);
  return {
    stopped,
    impulse: impulse2,
    touchSpeed,
    speedNorm,
    motionBoost,
    isSwipe,
    dirX,
    dirY,
    perpX: -dirY,
    perpY: dirX,
    swipe,
    baseRadius,
    stretch: isSwipe ? 1 + swipe * (0.18 + motionBoost * 0.14 + Math.random() * 0.08) : 1,
    burstCount: Math.round(
      (stopped ? BURST_COUNT * (0.7 + speedNorm * 0.3) : isSwipe ? BURST_COUNT + swipe * 6 + impulse2 * 2 : BURST_COUNT) * (0.82 + Math.random() * 0.28)
    ),
    inertiaBase: Math.min(
      touchSpeed * 0.022 + impulse2 * 0.06 + (stopped ? speedNorm * 0.035 : 0),
      0.11
    ),
    inheritScale: 6e-3 + speedNorm * 9e-3 + impulse2 * 0.012 + (stopped ? speedNorm * 0.014 : 0)
  };
}

// src/components/ChaosPad/webgl/flowSmooth.ts
function smoothFlow(cache, key, dx, dy) {
  var _a;
  const speed = Math.hypot(dx, dy);
  const prev = (_a = cache.get(key)) != null ? _a : { x: 0, y: 0, speed: 0 };
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
  cache.set(key, flow);
  return flow;
}

// src/components/ChaosPad/webgl/flowField.ts
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

// src/components/ChaosPad/webgl/makeParticle.ts
function makeParticle({ s, m, flow, rgb, seed, i }) {
  const [cr, cg, cb] = rgb;
  const pSeed = seed + i * 1.618 + Math.random() * 7;
  const gauss = (Math.random() + Math.random() + Math.random()) / 3;
  const dist = (gauss * gauss * 0.42 + Math.sqrt(Math.random()) * 0.58) * m.baseRadius;
  const angle = Math.random() * Math.PI * 2;
  let ox = Math.cos(angle) * dist;
  let oy = Math.sin(angle) * dist;
  if (m.isSwipe) {
    const along = ox * m.dirX + oy * m.dirY;
    const perp = ox * m.perpX + oy * m.perpY;
    const perpScale = m.stopped || m.impulse > 0.35 ? 0.72 + Math.random() * 0.2 : 0.88 + Math.random() * 0.12;
    ox = m.dirX * along * m.stretch + m.perpX * perp * perpScale;
    oy = m.dirY * along * m.stretch + m.perpY * perp * perpScale;
  }
  ox += (fbm(s.x * 14 + ox * 22 + pSeed, s.y * 14 + oy * 22 + pSeed * 0.7) - 0.5) * m.baseRadius * 0.28;
  oy += (fbm(s.y * 14 + pSeed, s.x * 14 + pSeed) - 0.5) * m.baseRadius * 0.28;
  const omag = Math.hypot(ox, oy) || 1e-4;
  const outX = ox / omag;
  const outY = oy / omag;
  const spd = 0.012 + Math.random() * 0.018 + m.swipe * (0.022 + Math.random() * 0.018) + dist * (0.12 + Math.random() * 0.1);
  const mix = m.isSwipe ? 0.22 + m.motionBoost * 0.28 + Math.random() * 0.08 : 0;
  const jitter = (Math.random() - 0.5) * 5e-3;
  let vx = (outX * (1 - mix) + m.dirX * mix) * spd + jitter;
  let vy = (outY * (1 - mix) + m.dirY * mix) * spd + jitter;
  if (m.touchSpeed > 0.015 || m.stopped || m.impulse > 0.08) {
    const bias = 0.65 + Math.random() * 0.35;
    const tdx = m.touchSpeed > 1e-4 ? s.dx / m.touchSpeed : 0;
    const tdy = m.touchSpeed > 1e-4 ? s.dy / m.touchSpeed : 0;
    vx += tdx * m.inertiaBase * bias;
    vy += tdy * m.inertiaBase * bias;
    if (m.touchSpeed > 0.012 || m.stopped) {
      const inherit = m.inheritScale * (0.75 + Math.random() * 0.35);
      vx += s.dx * inherit;
      vy += s.dy * inherit;
    }
  }
  return {
    x: s.x + ox,
    y: s.y + oy,
    vx,
    vy,
    life: 1,
    maxLife: 1.2 + m.motionBoost * 0.45 + (m.stopped ? 0.35 : 0) + Math.random(),
    r: cr * (0.96 + Math.random() * 0.08),
    g: cg * (0.96 + Math.random() * 0.08),
    b: cb * (0.96 + Math.random() * 0.08),
    size: 1.8 + Math.random() * 1.4,
    flowX: m.dirX || flow.x,
    flowY: m.dirY || flow.y,
    seed: pSeed,
    drag: 0.975 + Math.random() * 0.012
  };
}
function splatColor(s) {
  return parseHexColor(s.color);
}

// src/components/ChaosPad/webgl/spawnBurst.ts
function spawnBurst(particles, flowByKey, s) {
  var _a;
  const key = (_a = s.key) != null ? _a : "__local__";
  const flow = smoothFlow(flowByKey, key, s.dx, s.dy);
  const m = burstMetrics(s, flow);
  const rgb = splatColor(s);
  const seed = Math.random() * 1e3;
  for (let i = 0; i < m.burstCount; i++) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    particles.push(makeParticle({ s, m, flow, rgb, seed, i }));
  }
}

// src/components/ChaosPad/webgl/trailBuffer.ts
function createTrailBuffer(gl, width, height) {
  const trail = {
    fbos: [gl.createFramebuffer(), gl.createFramebuffer()],
    textures: [gl.createTexture(), gl.createTexture()],
    readIdx: 0,
    width,
    height
  };
  resizeTrailBuffer(gl, trail, width, height);
  return trail;
}
function resizeTrailBuffer(gl, trail, width, height) {
  trail.width = width;
  trail.height = height;
  for (let i = 0; i < 2; i++) {
    gl.bindTexture(gl.TEXTURE_2D, trail.textures[i]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, trail.fbos[i]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, trail.textures[i], 0);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
}
function destroyTrailBuffer(gl, trail) {
  for (const fb of trail.fbos) gl.deleteFramebuffer(fb);
  for (const tex of trail.textures) gl.deleteTexture(tex);
}
function blitTexture(gl, program, quadVao, texture, fade) {
  gl.useProgram(program);
  gl.bindVertexArray(quadVao);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);
  gl.uniform1f(gl.getUniformLocation(program, "uFade"), fade);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// src/components/ChaosPad/webgl/updateParticles.ts
function updateParticles(particles, dt, time) {
  const alive = [];
  const subDt = dt * 0.5;
  for (const p of particles) {
    for (let s = 0; s < 2; s++) {
      const field = sampleFlow(p.x, p.y, time + s * subDt * 0.5, p.seed);
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
      const drag = p.drag - (1 - p.life) * 15e-4;
      p.vx *= drag;
      p.vy *= drag;
    }
    p.life -= dt / p.maxLife;
    if (p.life > 0 && p.x > -0.08 && p.x < 1.08 && p.y > -0.08 && p.y < 1.08) {
      alive.push(p);
    }
  }
  return alive;
}

// src/components/ChaosPad/webgl/ParticleSim.ts
var ParticleSim = class {
  constructor(canvas) {
    this.particles = [];
    this.pending = [];
    this.flowByKey = /* @__PURE__ */ new Map();
    this.time = 0;
    this.lastFrame = 0;
    this.width = 1;
    this.height = 1;
    this.res = createGlResources(canvas);
    this.trail = createTrailBuffer(this.res.gl, 1, 1);
    this.lastFrame = performance.now();
  }
  resize(displayWidth, displayHeight) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(displayWidth * dpr));
    const h = Math.max(1, Math.floor(displayHeight * dpr));
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    resizeTrailBuffer(this.res.gl, this.trail, w, h);
  }
  pushSplat(s) {
    this.pending.push(s);
  }
  step() {
    const now = performance.now();
    const dt = Math.min(0.04, Math.max(8e-3, (now - this.lastFrame) / 1e3));
    this.lastFrame = now;
    this.time += dt;
    for (const s of this.pending) spawnBurst(this.particles, this.flowByKey, s);
    this.pending.length = 0;
    this.particles = updateParticles(this.particles, dt, this.time);
    this.render();
  }
  destroy() {
    destroyTrailBuffer(this.res.gl, this.trail);
    destroyGlResources(this.res);
  }
  render() {
    const { gl, fadeProgram, quadVao } = this.res;
    const { width: w, height: h } = this;
    const writeIdx = 1 - this.trail.readIdx;
    const readTex = this.trail.textures[this.trail.readIdx];
    const writeFbo = this.trail.fbos[writeIdx];
    gl.viewport(0, 0, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    blitTexture(gl, fadeProgram, quadVao, readTex, TRAIL_FADE);
    drawParticles(this.res, this.particles, w, h);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    blitTexture(gl, fadeProgram, quadVao, this.trail.textures[writeIdx], 1);
    gl.disable(gl.BLEND);
    this.trail.readIdx = writeIdx;
  }
};

// src/components/ChaosPad/PadGlCanvas.tsx
import { useEffect as useEffect6, useRef as useRef5 } from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
function PadGlCanvas({ containerRef }) {
  const canvasRef = useRef5(null);
  const rafRef = useRef5(0);
  useEffect6(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    let sim;
    try {
      sim = new ParticleSim(canvas);
    } catch (err) {
      console.warn("[chaospad] webgl init failed", err);
      return;
    }
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      sim.resize(width, height);
    };
    registerVisual((splat) => sim.pushSplat(splat));
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
      unregisterVisual();
      ro.disconnect();
      sim.destroy();
    };
  }, [containerRef]);
  return /* @__PURE__ */ jsx3("canvas", { ref: canvasRef, className: "chaospad-gl-canvas", "aria-hidden": "true" });
}

// src/components/ChaosPad/ChaosPad.tsx
import { useRef as useRef6 } from "react";
import { jsx as jsx4, jsxs } from "react/jsx-runtime";
function ChaosPad({ className, style }) {
  const { pointerPassThrough } = useChaospadConfig();
  const rootRef = useRef6(null);
  const surfaceRef = useRef6(null);
  const visualRef = useRef6(null);
  useAudioUnlock();
  useChaosAudio();
  useChaosWebSocket();
  useGlobalPointerPad(rootRef, surfaceRef, pointerPassThrough);
  usePadVisual();
  const rootClass = [
    "chaospad-root",
    pointerPassThrough && "chaospad-pass-through",
    className
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxs("div", { ref: rootRef, className: rootClass, style, children: [
    /* @__PURE__ */ jsx4("div", { ref: surfaceRef, className: "chaospad-surface", "aria-hidden": "true" }),
    /* @__PURE__ */ jsx4("div", { ref: visualRef, className: "chaospad-glow-layer", children: /* @__PURE__ */ jsx4(PadGlCanvas, { containerRef: visualRef }) })
  ] });
}

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