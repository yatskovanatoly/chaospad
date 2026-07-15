import * as react_jsx_runtime from 'react/jsx-runtime';
import { CSSProperties } from 'react';

type QuantizeMode = 'none' | 'chromatic';

type ChaospadConfig = {
    /** WebSocket relay URL. По умолчанию `ws://localhost:3003`. */
    wsUrl?: string;
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
    /** Glow circle diameter in px. Default: 50 */
    glowSize?: number;
};
type ResolvedChaospadConfig = Required<Omit<ChaospadConfig, 'userId'>> & {
    userId?: string;
};
declare const DEFAULT_WS_URL = "ws://localhost:3003";
declare const DEFAULT_CHAOSPAD_CONFIG: Required<Omit<ChaospadConfig, 'userId'>>;
declare function resolveChaospadConfig(config?: ChaospadConfig): ResolvedChaospadConfig;
declare function resolveWebSocketUrl(url: string): string;

type ChaospadProps = {
    config?: ChaospadConfig;
    className?: string;
    style?: CSSProperties;
};
declare function Chaospad({ config, className, style }: ChaospadProps): react_jsx_runtime.JSX.Element;

export { Chaospad, type ChaospadConfig, type ChaospadProps, DEFAULT_CHAOSPAD_CONFIG, DEFAULT_WS_URL, type QuantizeMode, type ResolvedChaospadConfig, Chaospad as default, resolveChaospadConfig, resolveWebSocketUrl };
