/**
 * Build-time public env (Next.js). Use a full URL so production can use `wss://`.
 * Examples: `ws://localhost:3003`, `wss://ws.example.com`
 */
export function getPublicWebSocketUrl(): string {
	const raw = process.env.NEXT_PUBLIC_WS_URL
	if (!raw?.trim()) return 'ws://localhost:3003'
	const t = raw.trim()
	if (t.startsWith('ws://') || t.startsWith('wss://')) return t
	return `ws://${t}`
}
