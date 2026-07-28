import type { QuantizeMode } from '@/components/AudioEngineContext/helpers/quantizeFreq'

export type ChaospadConfig = {
	/** WebSocket relay URL. Auto-detected from page host if omitted. */
	wsUrl?: string
	/** WS port when URL is auto-detected. Default: 3003 */
	wsPort?: number
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
	/**
	 * React to touches anywhere on the page without blocking clicks on UI below.
	 * Uses document capture listeners + `pointer-events: none` on the pad layer.
	 * Default: `true`
	 */
	pointerPassThrough?: boolean
}

export type ResolvedChaospadConfig = Required<
	Omit<ChaospadConfig, 'userId'>
> & {
	userId?: string
}

export const DEFAULT_WS_PORT = 3003

/** SSR fallback */
export const DEFAULT_WS_URL = `ws://localhost:${DEFAULT_WS_PORT}`

const readEnv = (key: string): string | undefined => {
	if (typeof process === 'undefined') return undefined
	return process.env[key]
}

const readEnvWsUrl = (): string | undefined => {
	const raw =
		readEnv('NEXT_PUBLIC_CHAOSPAD_WS_URL') ??
		readEnv('CHAOSPAD_WS_URL') ??
		readEnv('NEXT_PUBLIC_WS_URL')
	const trimmed = raw?.trim()
	return trimmed || undefined
}

const readEnvWsPort = (): number | undefined => {
	const raw =
		readEnv('NEXT_PUBLIC_CHAOSPAD_WS_PORT') ?? readEnv('CHAOSPAD_WS_PORT')
	if (!raw) return undefined
	const port = Number(raw)
	return Number.isFinite(port) ? port : undefined
}

/**
 * Relay URL from env or current page host:
 * - http://localhost:3000 -> ws://localhost:3003
 * - http://192.168.x.x:3000 -> ws://192.168.x.x:3003
 * - https://example.com -> wss://example.com:3003
 */
export function resolveDefaultWsUrl(
	wsPort = DEFAULT_WS_PORT,
	opts?: { ssr?: boolean },
): string {
	const fromEnv = readEnvWsUrl()
	if (fromEnv) return fromEnv

	const port = readEnvWsPort() ?? wsPort

	if (opts?.ssr || typeof window === 'undefined') {
		return `ws://localhost:${port}`
	}

	const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
	return `${wsProto}//${window.location.hostname}:${port}`
}

export const DEFAULT_CHAOSPAD_CONFIG: Required<
	Omit<ChaospadConfig, 'userId'>
> = {
	wsUrl: DEFAULT_WS_URL,
	wsPort: DEFAULT_WS_PORT,
	volume: 1,
	reverbLevel: 0.72,
	release: 1.1,
	remoteRelease: 1.1,
	quantize: 'chromatic',
	glowIntervalMs: 50,
	pointerPassThrough: true,
}

export function resolveChaospadConfig(
	config?: ChaospadConfig,
	opts?: { ssr?: boolean },
): ResolvedChaospadConfig {
	const wsPort = config?.wsPort ?? readEnvWsPort() ?? DEFAULT_WS_PORT
	const wsUrl = config?.wsUrl?.trim() || resolveDefaultWsUrl(wsPort, opts)

	return {
		wsUrl,
		wsPort,
		volume: config?.volume ?? DEFAULT_CHAOSPAD_CONFIG.volume,
		reverbLevel: config?.reverbLevel ?? DEFAULT_CHAOSPAD_CONFIG.reverbLevel,
		release: config?.release ?? DEFAULT_CHAOSPAD_CONFIG.release,
		remoteRelease:
			config?.remoteRelease ?? DEFAULT_CHAOSPAD_CONFIG.remoteRelease,
		quantize: config?.quantize ?? DEFAULT_CHAOSPAD_CONFIG.quantize,
		userId: config?.userId,
		glowIntervalMs:
			config?.glowIntervalMs ?? DEFAULT_CHAOSPAD_CONFIG.glowIntervalMs,
		pointerPassThrough:
			config?.pointerPassThrough ??
			DEFAULT_CHAOSPAD_CONFIG.pointerPassThrough,
	}
}

export function resolveWebSocketUrl(url: string): string {
	const t = url.trim()
	if (!t) return resolveDefaultWsUrl()
	if (t.startsWith('ws://') || t.startsWith('wss://')) return t
	return `ws://${t}`
}
