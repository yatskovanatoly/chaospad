function heatRgb(v: number): [number, number, number] {
	const t = v / 255
	const r = Math.round(12 + t * 220)
	const g = Math.round(t * t * 180)
	const b = Math.round(40 + (1 - t) * 180)
	return [r, g, b]
}

function binIndexLog(y: number, height: number, n: number): number {
	if (n < 3) return Math.min(n - 1, Math.max(0, Math.floor((y / height) * n)))
	const iMin = 1
	const iMax = n - 1
	const t = height > 1 ? y / (height - 1) : 0
	const lo = Math.log(iMin)
	const hi = Math.log(iMax)
	return Math.min(iMax, Math.max(iMin, Math.floor(Math.exp(lo + t * (hi - lo)))))
}

export function appendSpectrumColumn(
	rgba: Uint8ClampedArray,
	width: number,
	height: number,
	freq: ArrayLike<number> & { length: number },
) {
	for (let y = 0; y < height; y++) {
		const row = y * width * 4
		rgba.copyWithin(row, row + 4, row + width * 4)
	}
	const x = width - 1
	const n = freq.length
	for (let y = 0; y < height; y++) {
		const fi = binIndexLog(height - 1 - y, height, n)
		const v = freq[fi]
		const [r, g, b] = heatRgb(v)
		const i = (y * width + x) * 4
		rgba[i] = r
		rgba[i + 1] = g
		rgba[i + 2] = b
		rgba[i + 3] = 255
	}
}

export function clearSpectrum(rgba: Uint8ClampedArray) {
	rgba.fill(0)
	for (let i = 3; i < rgba.length; i += 4) rgba[i] = 255
}
