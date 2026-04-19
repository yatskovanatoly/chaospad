export function binsToPeriodicWave(ctx: AudioContext, bins: Float32Array): PeriodicWave {
	const n = bins.length
	const real = new Float32Array(n + 1)
	const imag = new Float32Array(n + 1)
	let sum = 0
	for (let k = 0; k < n; k++) {
		const v = bins[k]
		real[k + 1] = v
		sum += Math.abs(v)
	}
	if (sum < 1e-5) {
		real[1] = 1
	}
	return ctx.createPeriodicWave(real, imag, { disableNormalization: false })
}
