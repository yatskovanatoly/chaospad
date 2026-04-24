export function binsToPeriodicWave(ctx: AudioContext, bins: Float32Array): PeriodicWave {
	const n = bins.length
	const real = new Float32Array(n + 1)
	const imag = new Float32Array(n + 1)

	let sum = 0
	for (let i = 0; i < n; i++) sum += bins[i]
	const mean = sum / n

	let energy = 0
	for (let i = 0; i < n; i++) energy += Math.abs(bins[i] - mean)
	if (energy < 1e-6) {
		real[1] = 1
		return ctx.createPeriodicWave(real, imag, { disableNormalization: false })
	}

	const even = n % 2 === 0
	const nyq = even ? n / 2 : 0

	const fillBin = (h: number, scale: number) => {
		const c0 = ((2 * Math.PI) / n) * h
		let ap = 0
		let bp = 0
		for (let i = 0; i < n; i++) {
			const x = bins[i] - mean
			const ang = c0 * i
			ap += x * Math.cos(ang)
			bp += x * Math.sin(ang)
		}
		real[h] = scale * ap
		imag[h] = scale * bp
	}

	if (even) {
		for (let h = 1; h < nyq; h++) fillBin(h, 2 / n)
		let ap = 0
		for (let i = 0; i < n; i++) {
			ap += (bins[i] - mean) * Math.cos(Math.PI * i)
		}
		real[nyq] = (1 / n) * ap
		imag[nyq] = 0
		for (let h = nyq + 1; h <= n; h++) {
			real[h] = 0
			imag[h] = 0
		}
	} else {
		const hMax = (n - 1) / 2
		for (let h = 1; h <= hMax; h++) fillBin(h, 2 / n)
		for (let h = hMax + 1; h <= n; h++) {
			real[h] = 0
			imag[h] = 0
		}
	}

	return ctx.createPeriodicWave(real, imag, { disableNormalization: false })
}
