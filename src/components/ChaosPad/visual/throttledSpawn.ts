import type { MotionType } from '@/components/WsContext/WsContextProvider'
import { IMPULSE_BYPASS } from './constants'
import { emitSplat } from './bridge'
import type { PadMotionState, SplatOpts } from './types'

export function createThrottledSpawn(intervalMs: number) {
	const lastAt = new Map<string, number>()

	return (
		nx: number,
		ny: number,
		color: string,
		_type: MotionType,
		key: string,
		motion?: PadMotionState,
		opts?: Pick<SplatOpts, 'stopped'>,
	) => {
		const now = Date.now()
		const elapsed = now - (lastAt.get(key) ?? 0)
		const force = (motion?.impulse ?? 0) >= IMPULSE_BYPASS || opts?.stopped

		if (!force) {
			const wait = intervalMs * (0.75 + Math.random() * 0.55)
			if (elapsed < wait) return
			if (elapsed < intervalMs * 1.8 && Math.random() < 0.15) return
		}

		lastAt.set(key, now)
		emitSplat(nx, ny, color, key, { motion, ...opts })
	}
}
