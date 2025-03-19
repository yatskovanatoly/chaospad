import { MotionType } from '@/components/WsContextProvider'
import spawnGlow from './spawnGlow'

const throttledSpawn = (
	type: MotionType,
	x: number,
	y: number,
	color: string
) => {
	let lastGlowTime = 0

	const now = Date.now()

	if (now - lastGlowTime < 50) return

	lastGlowTime = now
	spawnGlow(x, y, color, type)
}

export default throttledSpawn
