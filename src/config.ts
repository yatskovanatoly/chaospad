import {
	DEFAULT_WS_URL,
	resolveDefaultWsUrl,
	resolveWebSocketUrl,
} from '@/types/config'

/** @deprecated Use resolveDefaultWsUrl() or Chaospad config env vars */
export function getPublicWebSocketUrl(): string {
	const raw =
		process.env.NEXT_PUBLIC_CHAOSPAD_WS_URL ??
		process.env.NEXT_PUBLIC_WS_URL
	if (!raw?.trim()) return resolveDefaultWsUrl()
	return resolveWebSocketUrl(raw)
}

export { DEFAULT_WS_URL, resolveDefaultWsUrl, resolveWebSocketUrl }
