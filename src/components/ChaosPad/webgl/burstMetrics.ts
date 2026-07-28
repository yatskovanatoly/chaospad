import { MAX_TOUCH_SPEED } from '../visual/constants'
import { BURST_COUNT } from './constants'
import type { FlowState } from './types'
import type { SplatInput } from '../visual/types'
import type { BurstMetrics } from './types'

export function burstMetrics(
	s: SplatInput,
	flow: FlowState,
): BurstMetrics {
	const stopped = s.stopped === true
	const impulse = s.impulse ?? 0
	const touchSpeed = Math.hypot(s.dx, s.dy)
	const speedNorm = Math.min(touchSpeed / MAX_TOUCH_SPEED, 1)
	const motionBoost = Math.min(
		speedNorm * 0.7 + impulse * 0.45 + (stopped ? speedNorm * 0.25 : 0),
		1,
	)
	const isSwipe =
		(touchSpeed > 0.015 || stopped || impulse > 0.08) &&
		(touchSpeed > 0.022 || impulse > 0.14 || stopped)

	let dirX = touchSpeed > 1e-4 ? s.dx / touchSpeed : flow.x
	let dirY = touchSpeed > 1e-4 ? s.dy / touchSpeed : flow.y
	if (!isSwipe) {
		dirX = 0
		dirY = 0
	}

	const swipe = Math.min(Math.max(touchSpeed, flow.speed) * 0.45, 1)
	const baseRadius =
		(stopped
			? 0.062 + speedNorm * 0.05
			: isSwipe
				? 0.068 + swipe * 0.12
				: 0.065) *
		(0.9 + Math.random() * 0.22)

	return {
		stopped,
		impulse,
		touchSpeed,
		speedNorm,
		motionBoost,
		isSwipe,
		dirX,
		dirY,
		perpX: -dirY,
		perpY: dirX,
		swipe,
		baseRadius,
		stretch: isSwipe
			? 1 + swipe * (0.18 + motionBoost * 0.14 + Math.random() * 0.08)
			: 1,
		burstCount: Math.round(
			(stopped
				? BURST_COUNT * (0.7 + speedNorm * 0.3)
				: isSwipe
					? BURST_COUNT + swipe * 6 + impulse * 2
					: BURST_COUNT) * (0.82 + Math.random() * 0.28),
		),
		inertiaBase: Math.min(
			touchSpeed * 0.022 + impulse * 0.06 + (stopped ? speedNorm * 0.035 : 0),
			0.11,
		),
		inheritScale:
			0.006 +
			speedNorm * 0.009 +
			impulse * 0.012 +
			(stopped ? speedNorm * 0.014 : 0),
	}
}
