export const EMPTY_EPS = 1e-5

export function maxBin(bins: Float32Array): number {
	let max = 0
	for (let i = 0; i < bins.length; i++) {
		if (bins[i] > max) max = bins[i]
	}
	return max
}

export function sampleBinsAtPhase(bins: Float32Array, phase: number): number {
	const n = bins.length
	if (n < 2) return 0
	const p = ((phase % 1) + 1) % 1
	const x = p * (n - 1)
	const i0 = Math.floor(x)
	const i1 = Math.min(i0 + 1, n - 1)
	const f = x - i0
	return bins[i0] * (1 - f) + bins[i1] * f
}
