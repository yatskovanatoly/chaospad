import { MotionType } from '@/components/WsContext/WsContextProvider'
import spawnGlow from './spawnGlow'

let lastGlowTime = 0

const throttledSpawn = (
	x: number,
	y: number,
	color: string,
	type: MotionType,
) => {
	const now = Date.now()
	if (now - lastGlowTime < 50) return
	lastGlowTime = now
	spawnGlow(x, y, color, type)
}

export default throttledSpawn
