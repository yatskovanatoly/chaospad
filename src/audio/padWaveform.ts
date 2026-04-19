export const PAD_WAVEFORM_BINS = 256

export function applySample(bins: Float32Array, nx: number, ny: number) {
	const x = Math.min(1, Math.max(0, nx))
	const y = Math.min(1, Math.max(0, ny))
	const i = Math.min(bins.length - 1, Math.floor(x * (bins.length - 1)))
	bins[i] = 1 - y
}

export function applySegment(
	bins: Float32Array,
	x0: number,
	y0: number,
	x1: number,
	y1: number,
) {
	const n = bins.length
	const v0 = 1 - y0
	const v1 = 1 - y1
	const x0c = Math.min(1, Math.max(0, x0))
	const x1c = Math.min(1, Math.max(0, x1))
	if (n < 1) return
	if (n === 1) {
		bins[0] = v1
		return
	}
	const denom = n - 1
	if (Math.abs(x1c - x0c) < 1e-9) {
		const i = Math.min(n - 1, Math.floor(x0c * denom))
		bins[i] = v1
		return
	}
	let i0 = Math.floor(x0c * denom)
	let i1 = Math.floor(x1c * denom)
	i0 = Math.max(0, Math.min(n - 1, i0))
	i1 = Math.max(0, Math.min(n - 1, i1))
	if (i0 > i1) [i0, i1] = [i1, i0]
	for (let i = i0; i <= i1; i++) {
		const x = i / denom
		const t = (x - x0c) / (x1c - x0c)
		const tc = Math.max(0, Math.min(1, t))
		bins[i] = v0 + tc * (v1 - v0)
	}
}
