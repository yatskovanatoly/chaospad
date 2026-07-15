import type { MotionType } from '@/components/WsContext/WsContextProvider'
import spawnGlow from './spawnGlow'

const createThrottledSpawn = (intervalMs: number, glowSize: number) => {
	let lastGlowTime = 0

	return (
		container: HTMLElement,
		x: number,
		y: number,
		color: string,
		_type: MotionType,
	) => {
		const now = Date.now()
		if (now - lastGlowTime < intervalMs) return
		lastGlowTime = now
		spawnGlow(container, x, y, color, glowSize)
	}
}

export default createThrottledSpawn
