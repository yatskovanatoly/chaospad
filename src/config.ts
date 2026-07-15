import { DEFAULT_WS_URL, resolveWebSocketUrl } from '@/types/config'

/**
 * Build-time public env (Next.js demo app). Library consumers pass `wsUrl` in config.
 */
export function getPublicWebSocketUrl(): string {
	const raw = process.env.NEXT_PUBLIC_WS_URL
	if (!raw?.trim()) return DEFAULT_WS_URL
	return resolveWebSocketUrl(raw)
}
