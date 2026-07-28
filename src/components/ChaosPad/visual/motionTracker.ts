import { MAX_TOUCH_SPEED, MOTION_SMOOTH } from './constants'
import type { PadMotionState } from './types'

type Sample = {
	nx: number
	ny: number
	t: number
	vx: number
	vy: number
}

const samples = new Map<string, Sample>()

function impulse(prev: Sample | undefined, vx: number, vy: number): number {
	if (!prev) return 0

	const dvx = vx - prev.vx
	const dvy = vy - prev.vy
	const delta = Math.hypot(dvx, dvy)
	const prevMag = Math.hypot(prev.vx, prev.vy)
	const curMag = Math.hypot(vx, vy)

	let turn = 0
	if (prevMag > 0.025 && curMag > 0.025) {
		const dot = (prev.vx * vx + prev.vy * vy) / (prevMag * curMag)
		turn = Math.min(1, Math.max(0, 1 - dot))
	}

	return Math.min(1, Math.min(delta / 1.1, 1) * 0.6 + turn * 0.4)
}

export function trackMotion(nx: number, ny: number, key: string): PadMotionState {
	const now = Date.now()
	const prev = samples.get(key)
	let vx = prev?.vx ?? 0
	let vy = prev?.vy ?? 0

	if (prev) {
		const dt = (now - prev.t) / 1000
		if (dt > 0 && dt < 0.35) {
			const rawVx = (nx - prev.nx) / dt
			const rawVy = (ny - prev.ny) / dt
			vx = prev.vx + MOTION_SMOOTH * (rawVx - prev.vx)
			vy = prev.vy + MOTION_SMOOTH * (rawVy - prev.vy)
			const mag = Math.hypot(vx, vy)
			if (mag > MAX_TOUCH_SPEED) {
				vx = (vx / mag) * MAX_TOUCH_SPEED
				vy = (vy / mag) * MAX_TOUCH_SPEED
			}
		}
	}

	const state = { vx, vy, impulse: impulse(prev, vx, vy) }
	samples.set(key, { nx, ny, t: now, vx, vy })
	return state
}

export function stopMotion(key: string): PadMotionState {
	const prev = samples.get(key)
	const vx = prev?.vx ?? 0
	const vy = prev?.vy ?? 0
	samples.delete(key)
	return {
		vx,
		vy,
		impulse: Math.min(Math.hypot(vx, vy) / MAX_TOUCH_SPEED, 1),
	}
}

export function resetMotionTracker(): void {
	samples.clear()
}
