import type { QuantizeMode } from '@/components/AudioEngineContext/helpers/quantizeFreq'

export type ChaospadConfig = {
	/** WebSocket relay URL. По умолчанию `ws://localhost:3003`. */
	wsUrl?: string
	/** Master output volume, 0–1. Default: 1 */
	volume?: number
	/** Reverb wet level, 0–1. Default: 0.5 */
	reverbLevel?: number
	/** Local voice release time in seconds. Default: 0.5 */
	release?: number
	/** Remote users voice release time in seconds. Default: 0.5 */
	remoteRelease?: number
	/** Frequency quantization mode. Default: `'chromatic'` */
	quantize?: QuantizeMode
	/** Session user id. Auto-generated if omitted. */
	userId?: string
	/** Glow spawn interval while pointer is held, ms. Default: 50 */
	glowIntervalMs?: number
	/** Glow circle diameter in px. Default: 50 */
	glowSize?: number
}

export type ResolvedChaospadConfig = Required<
	Omit<ChaospadConfig, 'userId'>
> & {
	userId?: string
}

export const DEFAULT_WS_URL = 'ws://localhost:3003'

export const DEFAULT_CHAOSPAD_CONFIG: Required<
	Omit<ChaospadConfig, 'userId'>
> = {
	wsUrl: DEFAULT_WS_URL,
	volume: 1,
	reverbLevel: 0.5,
	release: 0.5,
	remoteRelease: 0.5,
	quantize: 'chromatic',
	glowIntervalMs: 50,
	glowSize: 50,
}

export function resolveChaospadConfig(
	config?: ChaospadConfig,
): ResolvedChaospadConfig {
	return {
		wsUrl: config?.wsUrl ?? DEFAULT_CHAOSPAD_CONFIG.wsUrl,
		volume: config?.volume ?? DEFAULT_CHAOSPAD_CONFIG.volume,
		reverbLevel: config?.reverbLevel ?? DEFAULT_CHAOSPAD_CONFIG.reverbLevel,
		release: config?.release ?? DEFAULT_CHAOSPAD_CONFIG.release,
		remoteRelease:
			config?.remoteRelease ?? DEFAULT_CHAOSPAD_CONFIG.remoteRelease,
		quantize: config?.quantize ?? DEFAULT_CHAOSPAD_CONFIG.quantize,
		userId: config?.userId,
		glowIntervalMs:
			config?.glowIntervalMs ?? DEFAULT_CHAOSPAD_CONFIG.glowIntervalMs,
		glowSize: config?.glowSize ?? DEFAULT_CHAOSPAD_CONFIG.glowSize,
	}
}

export function resolveWebSocketUrl(url: string): string {
	const t = url.trim()
	if (t.startsWith('ws://') || t.startsWith('wss://')) return t
	return `ws://${t}`
}
