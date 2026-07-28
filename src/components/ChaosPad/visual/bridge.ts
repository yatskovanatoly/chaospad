import { trackMotion, stopMotion, resetMotionTracker } from './motionTracker'
import type { PadMotionState, SplatInput, SplatOpts, VisualHandler } from './types'

let handler: VisualHandler | null = null

export function registerVisual(h: VisualHandler): void {
	handler = h
}

export function unregisterVisual(): void {
	handler = null
	resetMotionTracker()
}

export function emitSplat(
	nx: number,
	ny: number,
	color: string,
	key: string,
	opts?: SplatOpts,
): boolean {
	if (!handler) return false

	const motion: PadMotionState = opts?.stopped
		? stopMotion(key)
		: (opts?.motion ?? trackMotion(nx, ny, key))

	handler({
		x: nx,
		y: ny,
		dx: motion.vx,
		dy: motion.vy,
		color,
		key,
		impulse: motion.impulse,
		stopped: opts?.stopped,
	})

	return true
}

export type { SplatInput, PadMotionState, SplatOpts }
