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

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

const resolveCoords = (data: RawWsMessage) => {
	if (typeof data.nx === 'number' && typeof data.ny === 'number') {
		return { nx: data.nx, ny: data.ny }
	}

	if (typeof data.x === 'number' && typeof data.y === 'number') {
		return {
			nx: data.x / window.innerWidth,
			ny: data.y / window.innerHeight,
		}
	}

	return null
}

export function parseWsMessage(raw: unknown): WSContextType['message'] {
	if (!raw || typeof raw !== 'object') return undefined

	const data = raw as RawWsMessage
	if (!data.userId || !data.type || !data.color) return undefined

	if (data.type === 'stop') {
		const coords = resolveCoords(data)
		return {
			userId: data.userId,
			type: 'stop',
			color: data.color,
			nx: coords ? clamp01(coords.nx) : 0,
			ny: coords ? clamp01(coords.ny) : 0,
		}
	}

	const coords = resolveCoords(data)
	if (!coords || !Number.isFinite(coords.nx) || !Number.isFinite(coords.ny)) {
		return undefined
	}

	return {
		userId: data.userId,
		type: data.type as WSContextType['type'],
		color: data.color,
		nx: clamp01(coords.nx),
		ny: clamp01(coords.ny),
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
	const payload: Record<string, string | number> = {
		userId,
		type,
		color,
	}

	if (pos && Number.isFinite(pos.nx) && Number.isFinite(pos.ny)) {
		payload.nx = pos.nx
		payload.ny = pos.ny
	}

	return JSON.stringify(payload)
}
