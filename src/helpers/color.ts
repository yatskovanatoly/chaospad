export const PARTICLE_LIGHTNESS = 0.68
export const PARTICLE_CHROMA = 0.17

const FALLBACK_HUE = 45

type Rgb = [number, number, number]

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

const toLinear = (v: number) =>
	v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4

const toGamma = (v: number) =>
	v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055

function oklabToLinear(l: number, a: number, b: number): Rgb {
	const lc = (l + 0.396_337_777_4 * a + 0.215_803_757_3 * b) ** 3
	const mc = (l - 0.105_561_345_8 * a - 0.063_854_172_8 * b) ** 3
	const sc = (l - 0.089_484_177_5 * a - 1.291_485_548 * b) ** 3

	return [
		4.076_741_662_1 * lc - 3.307_711_591_3 * mc + 0.230_969_929_2 * sc,
		-1.268_438_004_6 * lc + 2.609_757_401_1 * mc - 0.341_319_396_5 * sc,
		-0.004_196_086_3 * lc - 0.703_418_614_7 * mc + 1.707_614_701 * sc,
	]
}

function linearToOklab(r: number, g: number, b: number): Rgb {
	const l = Math.cbrt(0.412_221_470_8 * r + 0.536_332_536_3 * g + 0.051_445_992_9 * b)
	const m = Math.cbrt(0.211_903_498_2 * r + 0.680_699_545_1 * g + 0.107_396_956_6 * b)
	const s = Math.cbrt(0.088_302_461_9 * r + 0.281_718_837_6 * g + 0.629_978_700_5 * b)

	return [
		0.210_454_255_3 * l + 0.793_617_785 * m - 0.004_072_046_8 * s,
		1.977_998_495_1 * l - 2.428_592_205 * m + 0.450_593_709_9 * s,
		0.025_904_037_1 * l + 0.782_771_766_2 * m - 0.808_675_766 * s,
	]
}

const inGamut = ([r, g, b]: Rgb) =>
	r >= -1e-4 && r <= 1.0001 && g >= -1e-4 && g <= 1.0001 && b >= -1e-4 && b <= 1.0001

export function oklchToRgb(l: number, chroma: number, hue: number): Rgb {
	const rad = (hue * Math.PI) / 180
	let c = chroma

	for (let i = 0; i < 24; i++) {
		const linear = oklabToLinear(l, c * Math.cos(rad), c * Math.sin(rad))
		if (inGamut(linear) || c <= 0) {
			return [
				clamp01(toGamma(clamp01(linear[0]))),
				clamp01(toGamma(clamp01(linear[1]))),
				clamp01(toGamma(clamp01(linear[2]))),
			]
		}
		c -= chroma / 24
	}

	return [l, l, l]
}

export function parseCssRgb(css: string | undefined): Rgb | null {
	if (!css) return null

	const hex = css.trim().replace('#', '')
	const full =
		hex.length === 3
			? hex
					.split('')
					.map((c) => c + c)
					.join('')
			: hex
	if (full.length !== 6 || !/^[\da-f]{6}$/i.test(full)) return null

	return [
		parseInt(full.slice(0, 2), 16) / 255,
		parseInt(full.slice(2, 4), 16) / 255,
		parseInt(full.slice(4, 6), 16) / 255,
	]
}

export function hueOfCss(css: string | undefined): number {
	const rgb = parseCssRgb(css)
	if (!rgb) return FALLBACK_HUE

	const [, a, b] = linearToOklab(
		toLinear(rgb[0]),
		toLinear(rgb[1]),
		toLinear(rgb[2]),
	)
	if (Math.hypot(a, b) < 1e-4) return FALLBACK_HUE

	const deg = (Math.atan2(b, a) * 180) / Math.PI
	return deg < 0 ? deg + 360 : deg
}

export function hueToCss(hue: number): string {
	const rgb = oklchToRgb(PARTICLE_LIGHTNESS, PARTICLE_CHROMA, hue)
	const hex = rgb
		.map((v) =>
			Math.round(v * 255)
				.toString(16)
				.padStart(2, '0'),
		)
		.join('')

	return `#${hex}`
}

export function normalizeParticleRgb(css: string | undefined): Rgb {
	return oklchToRgb(PARTICLE_LIGHTNESS, PARTICLE_CHROMA, hueOfCss(css))
}
