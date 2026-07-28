export type SplatInput = {
	x: number
	y: number
	dx: number
	dy: number
	color: string
	radius: number
	key?: string
	/** 0–1: velocity change magnitude (direction change or deceleration). */
	impulse?: number
	stopped?: boolean
}

type VisualHandler = (splat: SplatInput) => void

type MotionSample = {
	nx: number
	ny: number
	t: number
	vx: number
	vy: number
}

export type PadMotionState = {
	vx: number
	vy: number
	impulse: number
}

let handler: VisualHandler | null = null
const motionByKey = new Map<string, MotionSample>()

const SMOOTH = 0.11
const MAX_SPEED = 2.2

export function registerPadVisual(h: VisualHandler): void {
	handler = h
}

export function unregisterPadVisual(): void {
	handler = null
	motionByKey.clear()
}

function computeImpulse(
	prev: MotionSample | undefined,
	vx: number,
	vy: number,
): number {
	if (!prev) return 0

	const dvx = vx - prev.vx
	const dvy = vy - prev.vy
	const deltaMag = Math.hypot(dvx, dvy)
	const prevMag = Math.hypot(prev.vx, prev.vy)
	const curMag = Math.hypot(vx, vy)

	let turn = 0
	if (prevMag > 0.025 && curMag > 0.025) {
		const dot = (prev.vx * vx + prev.vy * vy) / (prevMag * curMag)
		turn = Math.min(1, Math.max(0, 1 - dot))
	}

	const deltaNorm = Math.min(deltaMag / 1.1, 1)
	return Math.min(1, deltaNorm * 0.6 + turn * 0.4)
}

function updateMotion(nx: number, ny: number, key: string): PadMotionState {
	const now = Date.now()
	const prev = motionByKey.get(key)

	let vx = prev?.vx ?? 0
	let vy = prev?.vy ?? 0

	if (prev) {
		const dt = (now - prev.t) / 1000
		if (dt > 0 && dt < 0.35) {
			const rawVx = (nx - prev.nx) / dt
			const rawVy = (ny - prev.ny) / dt
			vx = prev.vx + SMOOTH * (rawVx - prev.vx)
			vy = prev.vy + SMOOTH * (rawVy - prev.vy)

			const mag = Math.hypot(vx, vy)
			if (mag > MAX_SPEED) {
				vx = (vx / mag) * MAX_SPEED
				vy = (vy / mag) * MAX_SPEED
			}
		}
	}

	const impulse = computeImpulse(prev, vx, vy)
	motionByKey.set(key, { nx, ny, t: now, vx, vy })
	return { vx, vy, impulse }
}

function readStopMotion(key: string): PadMotionState {
	const prev = motionByKey.get(key)
	const vx = prev?.vx ?? 0
	const vy = prev?.vy ?? 0
	motionByKey.delete(key)
	return {
		vx,
		vy,
		impulse: Math.min(Math.hypot(vx, vy) / MAX_SPEED, 1),
	}
}

/** Track pointer velocity on every motion frame (independent of spawn throttle). */
export function trackPadMotion(nx: number, ny: number, key = 'default'): PadMotionState {
	return updateMotion(nx, ny, key)
}

export function spawnVisualSplat(
	nx: number,
	ny: number,
	color: string,
	size: number,
	key = 'default',
	opts?: { motion?: PadMotionState; stopped?: boolean },
): boolean {
	if (!handler) return false

	const motion = opts?.stopped
		? readStopMotion(key)
		: (opts?.motion ?? updateMotion(nx, ny, key))

	handler({
		x: nx,
		y: ny,
		dx: motion.vx,
		dy: motion.vy,
		color,
		radius: size * 0.004,
		key,
		impulse: motion.impulse,
		stopped: opts?.stopped,
	})

	return true
}

export { MAX_SPEED }
