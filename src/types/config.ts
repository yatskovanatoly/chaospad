import type { QuantizeMode } from '@/components/AudioEngineContext/helpers/quantizeFreq'

export type ChaospadConfig = {
	/** WebSocket relay URL. Auto-detected from page host if omitted. */
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

export const DEFAULT_WS_PORT = 3003

/** SSR fallback */
export const DEFAULT_WS_URL = `ws://localhost:${DEFAULT_WS_PORT}`

/**
 * Pick relay URL from the current page:
 * - http://localhost:3000 -> ws://localhost:3003
 * - http://192.168.x.x:3000 -> ws://192.168.x.x:3003
 * - https://zuyefa.ru -> wss://ws.zuyefa.ru
 */
export function resolveDefaultWsUrl(): string {
	if (typeof window === 'undefined') return DEFAULT_WS_URL

	const { hostname, protocol } = window.location
	const isHttps = protocol === 'https:'

	if (!isHttps) {
		return `ws://${hostname}:${DEFAULT_WS_PORT}`
	}

	if (hostname === 'localhost' || hostname === '127.0.0.1') {
		return `wss://localhost:${DEFAULT_WS_PORT}`
	}

	const parts = hostname.split('.')
	if (parts.length >= 2) {
		const rootDomain = parts.slice(-2).join('.')
		return `wss://ws.${rootDomain}`
	}

	return `wss://${hostname}:${DEFAULT_WS_PORT}`
}

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
		wsUrl: config?.wsUrl ?? resolveDefaultWsUrl(),
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
