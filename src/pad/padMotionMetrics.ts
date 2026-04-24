export const GESTURE_SPEED_REF = 2

export function gestureSpeed01FromSegment(
	prev: { nx: number; ny: number },
	next: { nx: number; ny: number },
	dtMs: number,
): number {
	const dtS = Math.max(1e-4, dtMs / 1000)
	const dist = Math.hypot(next.nx - prev.nx, next.ny - prev.ny)
	return Math.max(0, Math.min(1, dist / dtS / GESTURE_SPEED_REF))
}
