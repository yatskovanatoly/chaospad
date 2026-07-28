import * as react_jsx_runtime from 'react/jsx-runtime';
import { CSSProperties } from 'react';

type QuantizeMode = 'none' | 'chromatic';

type ChaospadConfig = {
    /** WebSocket relay URL. Auto-detected from page host if omitted. */
    wsUrl?: string;
    /** WS port when URL is auto-detected. Default: 3003 */
    wsPort?: number;
    /** Master output volume, 0–1. Default: 1 */
    volume?: number;
    /** Reverb wet level, 0–1. Default: 0.5 */
    reverbLevel?: number;
    /** Local voice release time in seconds. Default: 0.5 */
    release?: number;
    /** Remote users voice release time in seconds. Default: 0.5 */
    remoteRelease?: number;
    /** Frequency quantization mode. Default: `'chromatic'` */
    quantize?: QuantizeMode;
    /** Session user id. Auto-generated if omitted. */
    userId?: string;
    /** Glow spawn interval while pointer is held, ms. Default: 50 */
    glowIntervalMs?: number;
    /**
     * React to touches anywhere on the page without blocking clicks on UI below.
     * Uses document capture listeners + `pointer-events: none` on the pad layer.
     * Default: `true`
     */
    pointerPassThrough?: boolean;
};
type ResolvedChaospadConfig = Required<Omit<ChaospadConfig, 'userId'>> & {
    userId?: string;
};
declare const DEFAULT_WS_PORT = 3003;
/** SSR fallback */
declare const DEFAULT_WS_URL = "ws://localhost:3003";
/**
 * Relay URL from env or current page host:
 * - http://localhost:3000 -> ws://localhost:3003
 * - http://192.168.x.x:3000 -> ws://192.168.x.x:3003
 * - https://example.com -> wss://example.com:3003
 */
declare function resolveDefaultWsUrl(wsPort?: number, opts?: {
    ssr?: boolean;
}): string;
declare const DEFAULT_CHAOSPAD_CONFIG: Required<Omit<ChaospadConfig, 'userId'>>;
declare function resolveChaospadConfig(config?: ChaospadConfig, opts?: {
    ssr?: boolean;
}): ResolvedChaospadConfig;
declare function resolveWebSocketUrl(url: string): string;

type ChaospadProps = {
    config?: ChaospadConfig;
    className?: string;
    style?: CSSProperties;
};
declare function Chaospad({ config, className, style }: ChaospadProps): react_jsx_runtime.JSX.Element;

export { Chaospad, type ChaospadConfig, type ChaospadProps, DEFAULT_CHAOSPAD_CONFIG, DEFAULT_WS_PORT, DEFAULT_WS_URL, type QuantizeMode, type ResolvedChaospadConfig, Chaospad as default, resolveChaospadConfig, resolveDefaultWsUrl, resolveWebSocketUrl };
