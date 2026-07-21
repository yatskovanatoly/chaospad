import type { MotionType } from '@/components/WsContext/WsContextProvider'
import spawnGlow from './spawnGlow'

const createThrottledSpawn = (intervalMs: number, glowSize: number) => {
	const lastGlowTimeByKey = new Map<string, number>()

	return (
		container: HTMLElement,
		x: number,
		y: number,
		color: string,
		_type: MotionType,
		key = 'default',
	) => {
		const now = Date.now()
		const lastGlowTime = lastGlowTimeByKey.get(key) ?? 0
		if (now - lastGlowTime < intervalMs) return
		lastGlowTimeByKey.set(key, now)
		spawnGlow(container, x, y, color, glowSize)
	}
}

export default createThrottledSpawn
