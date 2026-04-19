const MIN_FREQ = 256
const MAX_FREQ = 512

export function getViewportSize(): { width: number; height: number } {
	if (typeof window === 'undefined') return { width: 1, height: 1 }
	const vv = window.visualViewport
	if (vv) return { width: vv.width, height: vv.height }
	return {
		width: document.documentElement.clientWidth,
		height: document.documentElement.clientHeight,
	}
}

export function clamp01(n: number) {
	return Math.min(1, Math.max(0, n))
}

export function pixelToNormalized(clientX: number, clientY: number) {
	const { width, height } = getViewportSize()
	return {
		nx: clamp01(clientX / width),
		ny: clamp01(clientY / height),
	}
}

export function pixelToNormalizedInRect(
	clientX: number,
	clientY: number,
	rect: DOMRectReadOnly,
) {
	const w = rect.width
	const h = rect.height
	if (w < 1e-6 || h < 1e-6) return { nx: 0.5, ny: 0.5 }
	return {
		nx: clamp01((clientX - rect.left) / w),
		ny: clamp01((clientY - rect.top) / h),
	}
}

export function getSoundParamsFromNormalized(nx: number, ny: number) {
	const nxClamped = clamp01(nx)
	const nyClamped = clamp01(ny)
	const freq = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, nxClamped)
	const amp = 1 - nyClamped
	return { freq, amp, nx: nxClamped, ny: nyClamped }
}
