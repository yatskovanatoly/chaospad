import { FLOW_LERP } from './constants'
import { lerp } from './math'
import type { FlowState } from './types'

export function smoothFlow(
	cache: Map<string, FlowState>,
	key: string,
	dx: number,
	dy: number,
): FlowState {
	const speed = Math.hypot(dx, dy)
	const prev = cache.get(key) ?? { x: 0, y: 0, speed: 0 }

	let tx = prev.x
	let ty = prev.y
	if (speed > 0.02) {
		tx = dx / speed
		ty = dy / speed
	}

	const flow: FlowState = {
		x: lerp(prev.x, tx, FLOW_LERP),
		y: lerp(prev.y, ty, FLOW_LERP),
		speed: lerp(prev.speed, Math.min(speed, 2.2), FLOW_LERP),
	}

	const mag = Math.hypot(flow.x, flow.y)
	if (mag > 1e-3) {
		flow.x /= mag
		flow.y /= mag
	}

	cache.set(key, flow)
	return flow
}
