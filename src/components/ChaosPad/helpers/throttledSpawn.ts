import type { MotionType } from '@/components/WsContext/WsContextProvider'
import type { PadMotionState } from './padVisualBridge'
import spawnVisual, { type SpawnVisualOpts } from './spawnVisual'

const IMPULSE_BYPASS = 0.32

const createThrottledSpawn = (intervalMs: number, glowSize: number) => {
	const lastGlowTimeByKey = new Map<string, number>()

	return (
		container: HTMLElement,
		nx: number,
		ny: number,
		color: string,
		_type: MotionType,
		key = 'default',
		motion?: PadMotionState,
	) => {
		const now = Date.now()
		const lastGlowTime = lastGlowTimeByKey.get(key) ?? 0
		const elapsed = now - lastGlowTime
		const impulse = motion?.impulse ?? 0
		const forceSpawn = impulse >= IMPULSE_BYPASS

		if (!forceSpawn) {
			const jittered = intervalMs * (0.75 + Math.random() * 0.55)
			if (elapsed < jittered) return
			if (elapsed < intervalMs * 1.8 && Math.random() < 0.15) return
		}

		lastGlowTimeByKey.set(key, now)
		const opts: SpawnVisualOpts | undefined = motion ? { motion } : undefined
		spawnVisual(container, nx, ny, color, glowSize, key, opts)
	}
}

export default createThrottledSpawn
