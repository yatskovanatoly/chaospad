const hash = (x: number, y: number) => {
	const s = Math.sin(x * 127.1 + y * 311.7) * 43_758.5453
	return s - Math.floor(s)
}

const noise2 = (x: number, y: number) => {
	const ix = Math.floor(x)
	const iy = Math.floor(y)
	const fx = x - ix
	const fy = y - iy
	const ux = fx * fx * (3 - 2 * fx)
	const uy = fy * fy * (3 - 2 * fy)
	const a = hash(ix, iy)
	const b = hash(ix + 1, iy)
	const c = hash(ix, iy + 1)
	const d = hash(ix + 1, iy + 1)
	return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}

const fbm = (x: number, y: number) => {
	let v = 0
	let a = 0.5
	let px = x
	let py = y
	for (let i = 0; i < 4; i++) {
		v += a * noise2(px, py)
		px *= 2.03
		py *= 2.03
		a *= 0.5
	}
	return v
}

export const sampleFlow = (x: number, y: number, t: number, seed: number) => {
	const s = seed * 19.17
	const sc = 5.5 + (seed % 1) * 4
	const tx = t * (0.06 + (seed % 0.07))
	const ty = t * (0.055 + (seed % 0.06))
	const px = x * sc + s + tx
	const py = y * sc + s * 0.7 + ty
	const eps = 0.04
	const n = fbm(px, py)
	const nx = fbm(px + eps, py) - fbm(px - eps, py)
	const ny = fbm(px, py + eps) - fbm(px, py - eps)
	const px2 = x * (sc * 2.1) + s * 2.3 + tx * 0.6
	const py2 = y * (sc * 2.1) + s * 1.1 + ty * 0.7
	const nx2 = fbm(px2 + eps, py2) - fbm(px2 - eps, py2)
	const ny2 = fbm(px2, py2 + eps) - fbm(px2, py2 - eps)
	return {
		curlX: (ny + ny2 * 0.45) * 0.011,
		curlY: -(nx + nx2 * 0.45) * 0.011,
		boost: (n - 0.5) * 0.005,
	}
}

export { fbm }
