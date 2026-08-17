import { normalizeParticleRgb } from '@/helpers/color'
import { fbm } from './flowField'
import type { BurstMetrics, FlowState, Particle } from './types'
import type { SplatInput } from '../visual/types'

const rgbCache = new Map<string, [number, number, number]>()

type Ctx = {
	s: SplatInput
	m: BurstMetrics
	flow: FlowState
	rgb: [number, number, number]
	seed: number
	i: number
}

export function makeParticle({ s, m, flow, rgb, seed, i }: Ctx): Particle {
	const [cr, cg, cb] = rgb
	const pSeed = seed + i * 1.618 + Math.random() * 7
	const gauss = (Math.random() + Math.random() + Math.random()) / 3
	const dist =
		(gauss * gauss * 0.42 + Math.sqrt(Math.random()) * 0.58) * m.baseRadius

	const angle = Math.random() * Math.PI * 2
	let ox = Math.cos(angle) * dist
	let oy = Math.sin(angle) * dist

	if (m.isSwipe) {
		const along = ox * m.dirX + oy * m.dirY
		const perp = ox * m.perpX + oy * m.perpY
		const perpScale =
			m.stopped || m.impulse > 0.35
				? 0.72 + Math.random() * 0.2
				: 0.88 + Math.random() * 0.12
		ox = m.dirX * along * m.stretch + m.perpX * perp * perpScale
		oy = m.dirY * along * m.stretch + m.perpY * perp * perpScale
	}

	ox += (fbm(s.x * 14 + ox * 22 + pSeed, s.y * 14 + oy * 22 + pSeed * 0.7) - 0.5) * m.baseRadius * 0.28
	oy += (fbm(s.y * 14 + pSeed, s.x * 14 + pSeed) - 0.5) * m.baseRadius * 0.28

	const omag = Math.hypot(ox, oy) || 1e-4
	const outX = ox / omag
	const outY = oy / omag
	const drift = m.isSwipe ? 0 : 0.03 + Math.random() * 0.035
	const spd =
		0.008 +
		Math.random() * 0.012 +
		drift +
		m.swipe * (0.01 + Math.random() * 0.01) +
		dist * (0.05 + Math.random() * 0.05)
	const mix = m.isSwipe ? 0.14 + m.motionBoost * 0.16 + Math.random() * 0.06 : 0
	const jitter = (Math.random() - 0.5) * 0.005

	let vx = (outX * (1 - mix) + m.dirX * mix) * spd + jitter
	let vy = (outY * (1 - mix) + m.dirY * mix) * spd + jitter

	if (m.touchSpeed > 0.015 || m.stopped || m.impulse > 0.08) {
		const bias = 0.65 + Math.random() * 0.35
		const tdx = m.touchSpeed > 1e-4 ? s.dx / m.touchSpeed : 0
		const tdy = m.touchSpeed > 1e-4 ? s.dy / m.touchSpeed : 0
		vx += tdx * m.inertiaBase * bias
		vy += tdy * m.inertiaBase * bias
		if (m.touchSpeed > 0.012 || m.stopped) {
			const inherit = m.inheritScale * (0.6 + Math.random() * 0.7)
			vx += s.dx * inherit
			vy += s.dy * inherit
		}
	}

	const lag = m.lag * (0.35 + Math.random() * 0.9)

	return {
		x: s.x + ox - m.dirX * lag,
		y: s.y + oy - m.dirY * lag,
		vx,
		vy,
		life: 1,
		maxLife: 1.2 + m.motionBoost * 0.45 + (m.stopped ? 0.35 : 0) + Math.random(),
		r: cr * m.dim * (0.96 + Math.random() * 0.08),
		g: cg * m.dim * (0.96 + Math.random() * 0.08),
		b: cb * m.dim * (0.96 + Math.random() * 0.08),
		size: 1.8 + Math.random() * 1.4,
		flowX: m.dirX || flow.x,
		flowY: m.dirY || flow.y,
		seed: pSeed,
		drag: 0.975 + Math.random() * 0.012,
	}
}

export function splatColor(s: SplatInput): [number, number, number] {
	const key = s.color ?? ''
	let rgb = rgbCache.get(key)
	if (!rgb) {
		rgb = normalizeParticleRgb(key)
		rgbCache.set(key, rgb)
	}
	return rgb
}
