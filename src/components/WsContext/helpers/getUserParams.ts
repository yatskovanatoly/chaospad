import { hueToCss } from '@/helpers/color'

const HUE_STEP = 137.508

export const FALLBACK_COLOR = hueToCss(45)

export function hashUserIndex(id: string | undefined, size: number): number {
	if (!id || size <= 0) return 0
	let hash = 0
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash)
	}
	return Math.abs(hash) % size
}

export const getColorForUser = (id: string | undefined) => {
	if (!id) return undefined
	return hueToCss((hashUserIndex(id, 997) * HUE_STEP) % 360)
}

export const getUserId = () => {
	try {
		return crypto.randomUUID()
	} catch (_error) {
		console.log('Error: Insecure environment to use crypto.randomUUID')
		return Math.random().toFixed()
	}
}
