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
  reverbLevel: 0.72,
  release: 1.1,
  remoteRelease: 1.1,
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
var cache = /* @__PURE__ */ new Map();
var createImpulseResponse = (ctx, duration = 5, decay = 3.2) => {
  const key = `${ctx.sampleRate}:${duration}:${decay}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const rate = ctx.sampleRate;
  const length = rate * duration;
  const impulse2 = ctx.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c++) {
    const channel = impulse2.getChannelData(c);
    for (let i = 0; i < length; i++) {
      channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  cache.set(key, impulse2);
  return impulse2;
};

// src/components/AudioEngineContext/helpers/unlockAudioContext.ts
var SILENT_WAV = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
var silentAudio = null;
var gestureRitualDone = false;
function createAudioContext() {
  var _a;
  const w = window;
  const AC = (_a = window.AudioContext) != null ? _a : w.webkitAudioContext;
  if (!AC) throw new Error("Web Audio API unavailable");
  return new AC({ latencyHint: "interactive" });
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
    void temp.resume().catch(() => {
    }).finally(() => {
      void temp.close().catch(() => {
      });
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
function primeSilentBuffer(ctx) {
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch (e) {
  }
}
function unlockAudioForGesture(ctx) {
  if (!gestureRitualDone) {
    gestureRitualDone = true;
    setPlaybackAudioSession();
    primeDisposableContext();
    playSilentHtmlAudio();
    if (ctx) primeSilentBuffer(ctx);
  }
  if (ctx && ctx.state !== "running") void ctx.resume().catch(() => {
  });
}
function resetGestureUnlock() {
  gestureRitualDone = false;
}

// src/components/AudioEngineContext/helpers/getSoundParams.ts
var VOLUME_PER_HEIGHT = 2.5;
var getSoundParamsFromXY = (nx, ny) => {
  const minFreq = 174;
  const maxFreq = 349;
  const x = Math.min(1, Math.max(0, nx));
  const y = Math.min(1, Math.max(0, ny));
  const freq = minFreq * Math.pow(maxFreq / minFreq, x);
  const amp = Math.min(1, (1 - y) * VOLUME_PER_HEIGHT);
  return { freq, amp, x, y };
};

// src/components/AudioEngineContext/helpers/quantizeFreq.ts
var quantizeFreq = (freq, mode) => {
  if (mode === "none") return freq;
  return 440 * Math.pow(2, Math.round(12 * Math.log2(freq / 440)) / 12);
};

// src/components/AudioEngineContext/helpers/padParams.ts
var MAX_AMP = 0.56;
var REVERB_BY_PRESET = {
  0: { base: 0.68, range: 0.3 },
  1: { base: 0.48, range: 0.24 }
};
function getPadParams(nx, ny, quantize = "none", presetId = 0) {
  const { freq: rawFreq, amp } = getSoundParamsFromXY(nx, ny);
  const reverb = REVERB_BY_PRESET[presetId];
  return {
    freq: quantizeFreq(rawFreq, quantize),
    amp: amp * MAX_AMP,
    pan: (nx - 0.5) * 1.2,
    reverbSend: reverb.base + ny * reverb.range
  };
}

// src/components/AudioEngineContext/helpers/spatialChain.ts
var SMOOTH = 0.03;
function createSpatialChain(ctx, dryTarget, sendTarget) {
  const input = ctx.createGain();
  const panner = ctx.createStereoPanner();
  const sendGain = ctx.createGain();
  input.connect(panner);
  panner.connect(dryTarget);
  panner.connect(sendGain);
  sendGain.connect(sendTarget);
  const setParams = (pan, reverbSend) => {
    const t = ctx.currentTime;
    panner.pan.setTargetAtTime(pan, t, SMOOTH);
    sendGain.gain.setTargetAtTime(reverbSend, t, SMOOTH);
  };
  return {
    input,
    setParams,
    dispose: () => {
      input.disconnect();
      panner.disconnect();
      sendGain.disconnect();
    }
  };
}

// src/helpers/color.ts
var PARTICLE_LIGHTNESS = 0.68;
var PARTICLE_CHROMA = 0.17;
var FALLBACK_HUE = 45;
var clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
var toLinear = (v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
var toGamma = (v) => v <= 31308e-7 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
function oklabToLinear(l, a, b) {
  const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sc = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc
  ];
}
function linearToOklab(r, g, b) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
}
var inGamut = ([r, g, b]) => r >= -1e-4 && r <= 1.0001 && g >= -1e-4 && g <= 1.0001 && b >= -1e-4 && b <= 1.0001;
function oklchToRgb(l, chroma, hue) {
  const rad = hue * Math.PI / 180;
  let c = chroma;
  for (let i = 0; i < 24; i++) {
    const linear = oklabToLinear(l, c * Math.cos(rad), c * Math.sin(rad));
    if (inGamut(linear) || c <= 0) {
      return [
        clamp01(toGamma(clamp01(linear[0]))),
        clamp01(toGamma(clamp01(linear[1]))),
        clamp01(toGamma(clamp01(linear[2])))
      ];
    }
    c -= chroma / 24;
  }
  return [l, l, l];
}
function parseCssRgb(css) {
  if (!css) return null;
  const hex = css.trim().replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  if (full.length !== 6 || !/^[\da-f]{6}$/i.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255
  ];
}
function hueOfCss(css) {
  const rgb = parseCssRgb(css);
  if (!rgb) return FALLBACK_HUE;
  const [, a, b] = linearToOklab(
    toLinear(rgb[0]),
    toLinear(rgb[1]),
    toLinear(rgb[2])
  );
  if (Math.hypot(a, b) < 1e-4) return FALLBACK_HUE;
  const deg = Math.atan2(b, a) * 180 / Math.PI;
  return deg < 0 ? deg + 360 : deg;
}
function hueToCss(hue) {
  const rgb = oklchToRgb(PARTICLE_LIGHTNESS, PARTICLE_CHROMA, hue);
  const hex = rgb.map(
    (v) => Math.round(v * 255).toString(16).padStart(2, "0")
  ).join("");
  return `#${hex}`;
}
function normalizeParticleRgb(css) {
  return oklchToRgb(PARTICLE_LIGHTNESS, PARTICLE_CHROMA, hueOfCss(css));
}

// src/components/WsContext/helpers/getUserParams.ts
var HUE_STEP = 137.508;
var FALLBACK_COLOR = hueToCss(45);
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
  return hueToCss(hashUserIndex(id, 997) * HUE_STEP % 360);
};
var getUserId = () => {
  try {
    return crypto.randomUUID();
  } catch (_error) {
    console.log("Error: Insecure environment to use crypto.randomUUID");
    return Math.random().toFixed();
  }
};

// src/components/AudioEngineContext/presets/padShared.ts
var PAD_SMOOTH = 0.11;
var grainBuffers = /* @__PURE__ */ new Map();
function getGrainBuffer(ctx, seconds = 2.4) {
  const key = `${ctx.sampleRate}:${seconds}`;
  const cached = grainBuffers.get(key);
  if (cached) return cached;
  const buffer = createGrainBuffer(ctx, seconds);
  grainBuffers.set(key, buffer);
  return buffer;
}
function createGrainBuffer(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.91 + white * 0.09;
    if (Math.random() < 18e-4) last += (Math.random() - 0.5) * 0.35;
    data[i] = last;
  }
  return buf;
}
function connectChorusLfo(ctx, lfoRate, depthCents, targets) {
  const lfo = ctx.createOscillator();
  const depth = ctx.createGain();
  lfo.frequency.value = lfoRate;
  depth.gain.value = depthCents;
  lfo.connect(depth);
  targets.forEach((osc) => depth.connect(osc.detune));
  return lfo;
}
function addGrainLayer(ctx, source, out, filter, level) {
  const node = ctx.createBufferSource();
  node.buffer = source;
  node.loop = true;
  node.loopEnd = source.duration;
  const gain = ctx.createGain();
  gain.gain.value = level;
  node.connect(filter);
  filter.connect(gain);
  gain.connect(out);
  return { node, gain, filter };
}
var BASE_VOICES = [
  { detune: 0, level: 0.26, octave: 1 },
  { detune: -8, level: 0.18, octave: 1 },
  { detune: 8, level: 0.18, octave: 1 },
  { detune: -16, level: 0.1, octave: 1 },
  { detune: 16, level: 0.1, octave: 1 }
];
var HARMONIC_VOICES = [
  { detune: 2, level: 0.048, octave: 2 },
  { detune: -3, level: 0.032, octave: 3 },
  { detune: 1, level: 0.02, octave: 4 },
  { detune: -5, level: 0.014, octave: 5 }
];
function createPadVoice(ctx, opts) {
  var _a, _b;
  const out = ctx.createGain();
  out.gain.value = 1;
  const padBus = ctx.createGain();
  const voices = [...BASE_VOICES, ...HARMONIC_VOICES];
  const oscs = voices.map((v) => {
    var _a2;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.detune.value = v.detune;
    gain.gain.value = v.level;
    osc.connect(gain);
    gain.connect(padBus);
    return { osc, gain, octave: (_a2 = v.octave) != null ? _a2 : 1 };
  });
  const chorusA = connectChorusLfo(
    ctx,
    0.06,
    6.5,
    oscs.slice(0, 3).map(({ osc }) => osc)
  );
  const chorusB = connectChorusLfo(
    ctx,
    0.11,
    5,
    oscs.slice(3, 5).map(({ osc }) => osc)
  );
  const breath = ctx.createOscillator();
  const breathDepth = ctx.createGain();
  breath.frequency.value = 0.05;
  breathDepth.gain.value = 0.075;
  breath.connect(breathDepth);
  breathDepth.connect(padBus.gain);
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = opts.toneHz;
  tone.Q.value = opts.toneQ;
  const warmth = ctx.createBiquadFilter();
  warmth.type = "lowpass";
  warmth.frequency.value = opts.warmthHz;
  warmth.Q.value = opts.warmthQ;
  padBus.connect(tone);
  tone.connect(warmth);
  let tail = warmth;
  if (opts.resonanceHz != null && opts.resonanceQ != null && opts.resonanceGain != null) {
    const peak = ctx.createBiquadFilter();
    peak.type = "peaking";
    peak.frequency.value = opts.resonanceHz;
    peak.Q.value = opts.resonanceQ;
    peak.gain.value = opts.resonanceGain;
    warmth.connect(peak);
    tail = peak;
  }
  tail.connect(out);
  const grainBuffer = getGrainBuffer(ctx);
  const grainBus = ctx.createGain();
  grainBus.connect(out);
  const bodyFilter = ctx.createBiquadFilter();
  bodyFilter.type = "lowpass";
  bodyFilter.frequency.value = 460;
  bodyFilter.Q.value = 0.35;
  const brightFilter = ctx.createBiquadFilter();
  brightFilter.type = "bandpass";
  brightFilter.frequency.value = 1180;
  brightFilter.Q.value = 0.65;
  const bodyGrain = addGrainLayer(
    ctx,
    grainBuffer,
    grainBus,
    bodyFilter,
    opts.grainLevel
  );
  const brightGrain = addGrainLayer(
    ctx,
    grainBuffer,
    grainBus,
    brightFilter,
    (_a = opts.grainBrightLevel) != null ? _a : opts.grainLevel * 0.55
  );
  const grainDrift = ctx.createOscillator();
  const grainDriftDepth = ctx.createGain();
  grainDrift.frequency.value = 0.35;
  grainDriftDepth.gain.value = opts.grainLevel * 0.55;
  grainDrift.connect(grainDriftDepth);
  grainDriftDepth.connect(bodyGrain.gain.gain);
  const grainShimmer = ctx.createOscillator();
  const grainShimmerDepth = ctx.createGain();
  grainShimmer.frequency.value = 6.2;
  grainShimmerDepth.gain.value = ((_b = opts.grainBrightLevel) != null ? _b : opts.grainLevel * 0.55) * 0.35;
  grainShimmer.connect(grainShimmerDepth);
  grainShimmerDepth.connect(brightGrain.gain.gain);
  const lfos = [chorusA, chorusB, breath, grainDrift, grainShimmer];
  const grains = [bodyGrain, brightGrain];
  return {
    output: out,
    setParams(p) {
      var _a2;
      const t = ctx.currentTime;
      const bright = 0.3 + p.amp * 0.55;
      oscs.forEach(
        ({ osc, octave }) => osc.frequency.setTargetAtTime(p.freq * octave, t, PAD_SMOOTH)
      );
      tone.frequency.setTargetAtTime(
        opts.toneHz * 0.65 + p.freq * bright * 1.2,
        t,
        PAD_SMOOTH
      );
      warmth.frequency.setTargetAtTime(
        opts.warmthHz * 0.68 + p.freq * bright * 0.48,
        t,
        PAD_SMOOTH
      );
      if (tail instanceof BiquadFilterNode && tail.type === "peaking") {
        tail.frequency.setTargetAtTime(p.freq * 1.01, t, PAD_SMOOTH);
      }
      bodyFilter.frequency.setTargetAtTime(360 + p.freq * 0.85, t, PAD_SMOOTH);
      brightFilter.frequency.setTargetAtTime(860 + p.freq * 1.6, t, PAD_SMOOTH);
      bodyGrain.gain.gain.setTargetAtTime(
        opts.grainLevel * (0.82 + p.amp * 0.55),
        t,
        PAD_SMOOTH
      );
      brightGrain.gain.gain.setTargetAtTime(
        ((_a2 = opts.grainBrightLevel) != null ? _a2 : opts.grainLevel * 0.55) * (0.78 + p.amp * 0.62),
        t,
        PAD_SMOOTH
      );
    },
    start(when) {
      oscs.forEach(({ osc }) => osc.start(when));
      lfos.forEach((lfo) => lfo.start(when));
      grains.forEach(
        ({ node }) => node.start(when, Math.random() * grainBuffer.duration)
      );
    },
    stop(_release, when) {
      const end = when + _release + 0.08;
      oscs.forEach(({ osc }) => osc.stop(end));
      lfos.forEach((lfo) => lfo.stop(end));
      grains.forEach(({ node }) => node.stop(end));
    },
    dispose() {
      oscs.forEach(({ osc, gain }) => {
        osc.disconnect();
        gain.disconnect();
      });
      lfos.forEach((lfo) => lfo.disconnect());
      breathDepth.disconnect();
      grainDriftDepth.disconnect();
      grainShimmerDepth.disconnect();
      grains.forEach(({ node, gain, filter }) => {
        node.disconnect();
        gain.disconnect();
        filter.disconnect();
      });
      grainBus.disconnect();
      tone.disconnect();
      warmth.disconnect();
      if (tail !== warmth) tail.disconnect();
      padBus.disconnect();
      out.disconnect();
    }
  };
}

// src/components/AudioEngineContext/presets/ambientPad.ts
function createAmbientPad(ctx) {
  return createPadVoice(ctx, {
    toneHz: 760,
    toneQ: 0.28,
    warmthHz: 460,
    warmthQ: 0.22,
    grainLevel: 0.042,
    grainBrightLevel: 0.024
  });
}

// src/components/AudioEngineContext/presets/resonantPad.ts
function createResonantPad(ctx) {
  return createPadVoice(ctx, {
    toneHz: 940,
    toneQ: 0.42,
    warmthHz: 580,
    warmthQ: 0.34,
    resonanceHz: 220,
    resonanceQ: 2.1,
    resonanceGain: 3.6,
    grainLevel: 0.036,
    grainBrightLevel: 0.021
  });
}

// src/components/AudioEngineContext/presets/catalog.ts
var PRESETS = [createAmbientPad, createResonantPad];
var PRESET_COUNT = PRESETS.length;
function getPresetForUser(userId) {
  return hashUserIndex(userId, PRESET_COUNT);
}
function createPresetVoice(ctx, presetId) {
  return PRESETS[presetId](ctx);
}

// src/components/AudioEngineContext/Voice.ts
var ATTACK_S = 0.72;
var AMP_SMOOTH = 0.08;
var Voice = class {
  constructor(engine, position, quantize, presetId) {
    this.engine = engine;
    this.quantize = quantize;
    this.presetId = presetId;
    const ctx = engine.getContextForVoice();
    this.route = engine.createVoiceRoute();
    this.preset = createPresetVoice(ctx, presetId);
    this.spatial = createSpatialChain(ctx, this.route.dry, this.route.send);
    this.preset.output.connect(this.spatial.input);
    const params = getPadParams(position.nx, position.ny, quantize, presetId);
    this.spatial.setParams(params.pan, params.reverbSend);
    const now = ctx.currentTime;
    this.attackEndsAt = now + ATTACK_S;
    this.preset.setParams({ freq: params.freq, amp: 0 });
    this.preset.output.gain.setValueAtTime(0, now);
    this.preset.output.gain.linearRampToValueAtTime(params.amp, this.attackEndsAt);
    this.preset.start(now + 1e-3);
  }
  updatePosition(nx, ny) {
    this.applyParams(getPadParams(nx, ny, this.quantize, this.presetId));
  }
  stop(releaseSeconds) {
    const ctx = this.engine.getContextForVoice();
    const now = ctx.currentTime;
    this.preset.output.gain.cancelScheduledValues(now);
    this.preset.output.gain.setValueAtTime(this.preset.output.gain.value, now);
    this.preset.output.gain.linearRampToValueAtTime(0, now + releaseSeconds);
    this.preset.stop(releaseSeconds, now);
    if (this.releaseTimer) clearTimeout(this.releaseTimer);
    this.releaseTimer = setTimeout(() => this.dispose(), releaseSeconds * 1e3 + 100);
  }
  applyParams(params) {
    this.preset.setParams({ freq: params.freq, amp: params.amp });
    this.spatial.setParams(params.pan, params.reverbSend);
    this.setAmp(params.amp);
  }
  setAmp(amp) {
    const ctx = this.engine.getContextForVoice();
    const gain = this.preset.output.gain;
    const now = ctx.currentTime;
    if (now < this.attackEndsAt) {
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
      gain.linearRampToValueAtTime(amp, this.attackEndsAt);
      return;
    }
    gain.setTargetAtTime(amp, now, AMP_SMOOTH);
  }
  dispose() {
    this.preset.dispose();
    this.spatial.dispose();
    this.engine.releaseVoiceRoute(this.route);
  }
};

// src/components/AudioEngineContext/AudioEngine.ts
var AudioEngine = class {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.limiter = null;
    this.drySum = null;
    this.reverbSendSum = null;
    this.reverbSendTrim = null;
    this.convolver = null;
    this.convolverGain = null;
    this.graphReady = false;
    this.volumeValue = 1;
    this.reverbLevelValue = 0.5;
    this.voiceRoutes = [];
  }
  unlock() {
    const ctx = this.ensureReady();
    unlockAudioForGesture(ctx);
    return ctx;
  }
  ensureReady() {
    if (!this.ctx) this.ctx = createAudioContext();
    if (!this.graphReady) {
      this.initGraph();
      this.graphReady = true;
    }
    return this.ctx;
  }
  prewarm() {
    try {
      this.ensureReady();
    } catch (e) {
    }
  }
  resumeIfSuspended() {
    if (!this.ctx || this.ctx.state === "running") return;
    resetGestureUnlock();
    void this.ctx.resume().catch(() => {
    });
  }
  close() {
    if (!this.ctx) return;
    resetGestureUnlock();
    void this.ctx.close();
    this.ctx = null;
    this.masterGain = null;
    this.limiter = null;
    this.drySum = null;
    this.reverbSendSum = null;
    this.reverbSendTrim = null;
    this.convolver = null;
    this.convolverGain = null;
    this.voiceRoutes = [];
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
    this.ensureReady();
    return new Voice(this, position, quantize, presetId);
  }
  createVoiceRoute() {
    const ctx = this.getContextForVoice();
    const dry = ctx.createGain();
    const send = ctx.createGain();
    dry.connect(this.drySum);
    send.connect(this.reverbSendSum);
    const route = { dry, send };
    this.voiceRoutes.push(route);
    this.rebalanceVoices(ctx);
    return route;
  }
  releaseVoiceRoute(route) {
    const idx = this.voiceRoutes.indexOf(route);
    if (idx === -1) return;
    this.voiceRoutes.splice(idx, 1);
    route.dry.disconnect();
    route.send.disconnect();
    if (this.ctx) this.rebalanceVoices(this.ctx);
  }
  getContextForVoice() {
    if (!this.ctx || !this.masterGain) {
      throw new Error("AudioEngine.unlock() must be called before playback");
    }
    return this.ctx;
  }
  rebalanceVoices(ctx) {
    const n = Math.max(1, this.voiceRoutes.length);
    const scale = 1 / Math.sqrt(n);
    const t = ctx.currentTime;
    for (const route of this.voiceRoutes) {
      route.dry.gain.setTargetAtTime(scale, t, 0.06);
      route.send.gain.setTargetAtTime(scale, t, 0.06);
    }
  }
  initGraph() {
    const ctx = this.ctx;
    this.drySum = ctx.createGain();
    this.reverbSendSum = ctx.createGain();
    this.reverbSendTrim = ctx.createGain();
    this.reverbSendTrim.gain.value = 0.72;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.volumeValue;
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -14;
    this.limiter.knee.value = 12;
    this.limiter.ratio.value = 4;
    this.limiter.attack.value = 4e-3;
    this.limiter.release.value = 0.22;
    this.drySum.connect(this.masterGain);
    try {
      const impulse2 = createImpulseResponse(ctx);
      this.convolver = ctx.createConvolver();
      this.convolver.buffer = impulse2;
      this.convolverGain = ctx.createGain();
      this.convolverGain.gain.value = this.reverbLevelValue;
      this.reverbSendSum.connect(this.reverbSendTrim);
      this.reverbSendTrim.connect(this.convolver);
      this.convolver.connect(this.convolverGain);
      this.convolverGain.connect(this.masterGain);
    } catch (e) {
      this.convolver = null;
      this.convolverGain = null;
    }
    this.masterGain.connect(this.limiter);
    this.limiter.connect(ctx.destination);
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
    var _a;
    const w = window;
    const prewarm = () => engine.prewarm();
    const idle = (_a = w.requestIdleCallback) == null ? void 0 : _a.call(w, prewarm);
    const timer = idle == null ? setTimeout(prewarm, 400) : void 0;
    return () => {
      var _a2;
      if (idle != null) (_a2 = w.cancelIdleCallback) == null ? void 0 : _a2.call(w, idle);
      if (timer) clearTimeout(timer);
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
  engine.ensureReady();
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
      if (document.visibilityState === "visible") engine.resumeIfSuspended();
    };
    document.addEventListener("touchstart", unlock, UNLOCK_OPTS);
    document.addEventListener("pointerdown", unlock, UNLOCK_OPTS);
    document.addEventListener("click", unlock, UNLOCK_OPTS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("touchstart", unlock, UNLOCK_OPTS);
      document.removeEventListener("pointerdown", unlock, UNLOCK_OPTS);
      document.removeEventListener("click", unlock, UNLOCK_OPTS);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [engine]);
}

// src/components/ChaosPad/helpers/scrollTarget.ts
var SCROLL_EPS = 2;
var SCROLLS = /auto|scroll|overlay/;
var CLIPS = /hidden|clip/;
function scrollsY(el, style) {
  return SCROLLS.test(style.overflowY) && el.scrollHeight > el.clientHeight + SCROLL_EPS;
}
function scrollsX(el, style) {
  return SCROLLS.test(style.overflowX) && el.scrollWidth > el.clientWidth + SCROLL_EPS;
}
function pageScroller() {
  var _a;
  const html = document.documentElement;
  const htmlStyle = getComputedStyle(html);
  const bodyStyle = document.body ? getComputedStyle(document.body) : htmlStyle;
  const clippedY = CLIPS.test(htmlStyle.overflowY) || CLIPS.test(bodyStyle.overflowY);
  const clippedX = CLIPS.test(htmlStyle.overflowX) || CLIPS.test(bodyStyle.overflowX);
  const scroller = (_a = document.scrollingElement) != null ? _a : html;
  const canY = !clippedY && scroller.scrollHeight > scroller.clientHeight + SCROLL_EPS;
  const canX = !clippedX && scroller.scrollWidth > scroller.clientWidth + SCROLL_EPS;
  return canY || canX ? scroller : null;
}
function findScrollTarget(clientX, clientY) {
  if (typeof document === "undefined") return null;
  let node = document.elementFromPoint(clientX, clientY);
  while (node && node !== document.body && node !== document.documentElement) {
    const style = getComputedStyle(node);
    if (scrollsY(node, style) || scrollsX(node, style)) return node;
    node = node.parentElement;
  }
  return pageScroller();
}
var instantScroll = null;
function applyScroll(el, axis, value) {
  if (instantScroll !== false) {
    try {
      el.scrollTo({
        [axis === "scrollTop" ? "top" : "left"]: value,
        behavior: "instant"
      });
      instantScroll = true;
      return;
    } catch (e) {
      instantScroll = false;
    }
  }
  el[axis] = value;
}
function scrollAxis(el, axis, delta) {
  const before = el[axis];
  applyScroll(el, axis, before + delta);
  return el[axis] - before;
}
function canScrollAxis(el, axis, delta) {
  if (delta === 0) return false;
  const pos = el[axis];
  const max = axis === "scrollTop" ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
  return delta < 0 ? pos > 0.5 : pos < max - 0.5;
}
function scrollWithChaining(el, dx, dy) {
  const page = document.scrollingElement;
  const chain = (axis, delta) => !page || page === el || canScrollAxis(el, axis, delta) ? el : page;
  return {
    dx: dx !== 0 ? scrollAxis(chain("scrollLeft", dx), "scrollLeft", dx) : 0,
    dy: dy !== 0 ? scrollAxis(chain("scrollTop", dy), "scrollTop", dy) : 0
  };
}

// src/components/ChaosPad/hooks/useGlobalPointerPad.ts
import { useLayoutEffect as useLayoutEffect3, useRef as useRef3 } from "react";
var DRAG_THRESHOLD_PX = 10;
var CLICK_SUPPRESS_MS = 400;
var VELOCITY_SMOOTH = 0.5;
var MOMENTUM_DECAY_PER_MS = 0.998;
var MOMENTUM_MIN_SPEED = 0.02;
var MOMENTUM_MAX_SPEED = 4;
var MOMENTUM_MAX_STEP_MS = 64;
var MOMENTUM_STALE_MS = 100;
var SUBPIXEL_CARRY_PX = 1;
var PASSIVE_CAPTURE = { capture: true, passive: true };
var ACTIVE_CAPTURE = { capture: true, passive: false };
function useGlobalPointerPad(rootRef, surfaceRef, passThrough) {
  const { emitMotion } = useWebSocket_default();
  const { glowIntervalMs } = useChaospadConfig();
  const emitMotionRef = useRef3(emitMotion);
  const sessionsRef = useRef3(/* @__PURE__ */ new Map());
  const suppressClickUntilRef = useRef3(0);
  const holdIntervalRef = useRef3(null);
  emitMotionRef.current = emitMotion;
  useLayoutEffect3(() => {
    var _a;
    let scroll = null;
    let momentumRaf = 0;
    let scrollRaf = 0;
    let pendingX = 0;
    let pendingY = 0;
    const stopHoldHeartbeat = () => {
      if (holdIntervalRef.current == null) return;
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    };
    const stopMomentum = () => {
      if (!momentumRaf) return;
      cancelAnimationFrame(momentumRaf);
      momentumRaf = 0;
    };
    const carry = (requested, applied) => Math.abs(requested - applied) < SUBPIXEL_CARRY_PX ? requested - applied : 0;
    const flushScroll = () => {
      scrollRaf = 0;
      const dx = pendingX;
      const dy = pendingY;
      pendingX = 0;
      pendingY = 0;
      if (!scroll || dx === 0 && dy === 0) return;
      const applied = scrollWithChaining(scroll.el, dx, dy);
      pendingX += carry(dx, applied.dx);
      pendingY += carry(dy, applied.dy);
    };
    const queueScroll = (dx, dy) => {
      pendingX += dx;
      pendingY += dy;
      if (!scrollRaf) scrollRaf = requestAnimationFrame(flushScroll);
    };
    const stopScrollGesture = () => {
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = 0;
      pendingX = 0;
      pendingY = 0;
      scroll = null;
    };
    const startMomentum = (el, vx, vy) => {
      stopMomentum();
      const speed = Math.hypot(vx, vy);
      if (speed < MOMENTUM_MIN_SPEED) return;
      const scale = speed > MOMENTUM_MAX_SPEED ? MOMENTUM_MAX_SPEED / speed : 1;
      let mx = vx * scale;
      let my = vy * scale;
      let restX = 0;
      let restY = 0;
      let last = performance.now();
      const step = (now) => {
        const dt = Math.min(Math.max(now - last, 1), MOMENTUM_MAX_STEP_MS);
        last = now;
        const wantX = mx * dt + restX;
        const wantY = my * dt + restY;
        const applied = scrollWithChaining(el, wantX, wantY);
        restX = carry(wantX, applied.dx);
        restY = carry(wantY, applied.dy);
        const decay = MOMENTUM_DECAY_PER_MS ** dt;
        mx *= decay;
        my *= decay;
        const stalled = applied.dx === 0 && applied.dy === 0 && restX === 0 && restY === 0;
        if (stalled || Math.hypot(mx, my) < MOMENTUM_MIN_SPEED) {
          momentumRaf = 0;
          return;
        }
        momentumRaf = requestAnimationFrame(step);
      };
      momentumRaf = requestAnimationFrame(step);
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
      emit(session.lastX, session.lastY, "move");
    };
    const startHoldHeartbeat = () => {
      if (holdIntervalRef.current != null) return;
      holdIntervalRef.current = setInterval(emitHoldMove, glowIntervalMs);
    };
    const suppressesClick = (session) => passThrough && session.isDrag && !session.isTouch;
    const endSession = (pointerId, clientX, clientY, event) => {
      const session = sessionsRef.current.get(pointerId);
      if (!session) return;
      sessionsRef.current.delete(pointerId);
      emit(clientX, clientY, "stop");
      if (sessionsRef.current.size === 0) stopHoldHeartbeat();
      if (suppressesClick(session)) {
        suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS;
        event == null ? void 0 : event.preventDefault();
        event == null ? void 0 : event.stopPropagation();
      }
    };
    const endAllSessions = (event) => {
      for (const [, session] of sessionsRef.current) {
        emit(session.lastX, session.lastY, "stop");
        if (suppressesClick(session)) {
          suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS;
          event == null ? void 0 : event.preventDefault();
        }
      }
      sessionsRef.current.clear();
      stopHoldHeartbeat();
    };
    const onTouchStart = (e) => {
      stopMomentum();
      stopScrollGesture();
      if (!passThrough) return;
      const touch = e.touches[0];
      if (!touch || e.touches.length > 1) return;
      const el = findScrollTarget(touch.clientX, touch.clientY);
      if (!el) return;
      scroll = {
        el,
        lastX: touch.clientX,
        lastY: touch.clientY,
        lastAt: e.timeStamp,
        vx: 0,
        vy: 0
      };
    };
    const driveScroll = (touch, at) => {
      if (!scroll) return;
      const dx = scroll.lastX - touch.clientX;
      const dy = scroll.lastY - touch.clientY;
      const dt = Math.max(at - scroll.lastAt, 1);
      scroll.lastX = touch.clientX;
      scroll.lastY = touch.clientY;
      scroll.lastAt = at;
      queueScroll(dx, dy);
      scroll.vx += (dx / dt - scroll.vx) * VELOCITY_SMOOTH;
      scroll.vy += (dy / dt - scroll.vy) * VELOCITY_SMOOTH;
    };
    const onPointerDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      sessionsRef.current.set(e.pointerId, {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        isDrag: !passThrough,
        isTouch: e.pointerType !== "mouse"
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
        if (!passThrough || !session.isTouch) e.preventDefault();
        emit(e.clientX, e.clientY, "move");
      }
    };
    const onPointerUp = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      endSession(e.pointerId, e.clientX, e.clientY, e);
    };
    const onPointerCancel = (e) => {
      const session = sessionsRef.current.get(e.pointerId);
      if (!session) return;
      if (passThrough && session.isTouch) return;
      endSession(e.pointerId, e.clientX, e.clientY, e);
    };
    const onTouchMove = (e) => {
      if (sessionsRef.current.size === 0) return;
      const touch = e.touches[0];
      if (!touch) return;
      if (e.touches.length > 1) {
        stopScrollGesture();
        return;
      }
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
      e.preventDefault();
      if (passThrough) driveScroll(touch, e.timeStamp);
      if (!passThrough || session.isDrag) {
        emit(touch.clientX, touch.clientY, "move");
      }
    };
    const onTouchEnd = (e) => {
      if (scroll && e.touches.length === 0) {
        const { el, vx, vy } = scroll;
        const stale = e.timeStamp - scroll.lastAt > MOMENTUM_STALE_MS;
        flushScroll();
        stopScrollGesture();
        if (!stale) startMomentum(el, vx, vy);
      }
      if (sessionsRef.current.size === 0) return;
      if (e.touches.length > 0) return;
      endAllSessions(e);
    };
    const onTouchCancel = (e) => {
      stopScrollGesture();
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
    const unbinds = [];
    const bind = (el, type, fn, opts) => {
      const listener = fn;
      el.addEventListener(type, listener, opts);
      unbinds.push(() => el.removeEventListener(type, listener, opts));
    };
    bind(document, "touchstart", onTouchStart, PASSIVE_CAPTURE);
    bind(document, "touchend", onTouchEnd, PASSIVE_CAPTURE);
    bind(target, "pointerdown", onPointerDown, PASSIVE_CAPTURE);
    bind(target, "pointermove", onPointerMove, ACTIVE_CAPTURE);
    bind(target, "pointerup", onPointerUp, ACTIVE_CAPTURE);
    bind(target, "pointercancel", onPointerCancel, PASSIVE_CAPTURE);
    bind(document, "touchmove", onTouchMove, ACTIVE_CAPTURE);
    bind(document, "touchcancel", onTouchCancel, PASSIVE_CAPTURE);
    bind(document, "visibilitychange", endAllSessions, false);
    bind(window, "blur", endAllSessions, false);
    if (passThrough) {
      bind(document, "click", onClickCapture, true);
      bind(document, "dragstart", onDragStart, ACTIVE_CAPTURE);
    }
    return () => {
      for (const unbind of unbinds) unbind();
      sessionsRef.current.clear();
      stopHoldHeartbeat();
      stopMomentum();
      stopScrollGesture();
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
	float energy = (core * 0.72 + halo * 0.28) * pow(vLife, 0.85);
	float alpha = energy * 0.62;
	vec3 rgb = vColor * (0.78 + 0.22 * core);
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
  const baseRadius = (stopped ? 0.03 + speedNorm * 0.02 : isSwipe ? 0.032 + swipe * 0.045 : 0.046) * (0.9 + Math.random() * 0.22);
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
    stretch: isSwipe ? 1 + swipe * (0.22 + motionBoost * 0.18 + Math.random() * 0.08) : 1,
    burstCount: Math.round(
      (stopped ? BURST_COUNT * (0.7 + speedNorm * 0.3) : isSwipe ? BURST_COUNT + swipe * 6 + impulse2 * 2 : BURST_COUNT * 0.6) * (0.82 + Math.random() * 0.28)
    ),
    inertiaBase: Math.min(
      touchSpeed * 0.014 + impulse2 * 0.028 + (stopped ? speedNorm * 0.02 : 0),
      0.055
    ),
    inheritScale: 0.22 + speedNorm * 0.1 + impulse2 * 0.06 + (stopped ? speedNorm * 0.08 : 0),
    lag: isSwipe ? speedNorm * 0.015 : 0,
    dim: isSwipe || stopped ? 0.85 + motionBoost * 0.15 : 0.5
  };
}

// src/components/ChaosPad/webgl/flowSmooth.ts
function smoothFlow(cache2, key, dx, dy) {
  var _a;
  const speed = Math.hypot(dx, dy);
  const prev = (_a = cache2.get(key)) != null ? _a : { x: 0, y: 0, speed: 0 };
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
  cache2.set(key, flow);
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
var rgbCache = /* @__PURE__ */ new Map();
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
  const drift = m.isSwipe ? 0 : 0.03 + Math.random() * 0.035;
  const spd = 8e-3 + Math.random() * 0.012 + drift + m.swipe * (0.01 + Math.random() * 0.01) + dist * (0.05 + Math.random() * 0.05);
  const mix = m.isSwipe ? 0.14 + m.motionBoost * 0.16 + Math.random() * 0.06 : 0;
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
      const inherit = m.inheritScale * (0.6 + Math.random() * 0.7);
      vx += s.dx * inherit;
      vy += s.dy * inherit;
    }
  }
  const lag = m.lag * (0.35 + Math.random() * 0.9);
  return {
    x: s.x + ox - m.dirX * lag,
    y: s.y + oy - m.dirY * lag,
    vx,
    vy,
    life: 1,
    maxLife: 1.2 + m.motionBoost * 0.45 + (m.stopped ? 0.35 : 0) + Math.random(),
    r: cr * m.dim * (0.96 + Math.random() * 0.08),
    g: cg * m.dim * (0.96 + Math.random() * 0.08),
    b: cb * m.dim * (0.96 + Math.random() * 0.08),
    size: 1.8 + Math.random() * 1.4,
    flowX: m.dirX || flow.x,
    flowY: m.dirY || flow.y,
    seed: pSeed,
    drag: 0.975 + Math.random() * 0.012
  };
}
function splatColor(s) {
  var _a;
  const key = (_a = s.color) != null ? _a : "";
  let rgb = rgbCache.get(key);
  if (!rgb) {
    rgb = normalizeParticleRgb(key);
    rgbCache.set(key, rgb);
  }
  return rgb;
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
      if (width < 1 || height < 1) return;
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
var clamp012 = (n) => Math.min(1, Math.max(0, n));
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
      nx: coords2 ? clamp012(coords2.nx) : 0,
      ny: coords2 ? clamp012(coords2.ny) : 0
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
    nx: clamp012(coords.nx),
    ny: clamp012(coords.ny)
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
  const color = getColorForUser(userId) || FALLBACK_COLOR;
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
	touch-action: auto;
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