import type { WSContextType } from '@/type'

type RawWsMessage = {
	userId?: string
	type?: string
	color?: string
	nx?: number
	ny?: number
	x?: number
	y?: number
}

export function parseWsMessage(raw: unknown): WSContextType['message'] {
	if (!raw || typeof raw !== 'object') return undefined

	const data = raw as RawWsMessage
	if (!data.userId || !data.type || !data.color) return undefined

	let nx: number | undefined
	let ny: number | undefined

	if (typeof data.nx === 'number' && typeof data.ny === 'number') {
		nx = data.nx
		ny = data.ny
	} else if (typeof data.x === 'number' && typeof data.y === 'number') {
		// Legacy pixel coords — normalize for current viewport
		nx = data.x / window.innerWidth
		ny = data.y / window.innerHeight
	}

	if (nx == null || ny == null || !Number.isFinite(nx) || !Number.isFinite(ny)) {
		return undefined
	}

	return {
		userId: data.userId,
		type: data.type as WSContextType['type'],
		color: data.color,
		nx: Math.min(1, Math.max(0, nx)),
		ny: Math.min(1, Math.max(0, ny)),
	}
}

export function buildWsPayload({
	userId,
	type,
	pos,
	color,
}: {
	userId: string
	type: string
	pos?: { nx: number; ny: number }
	color: string
}) {
	return JSON.stringify({
		userId,
		type,
		nx: pos?.nx,
		ny: pos?.ny,
		color,
	})
}
