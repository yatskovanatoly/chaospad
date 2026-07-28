import { fbm } from './flowField'
import { parseHexColor } from './glUtils'
import type { BurstMetrics, FlowState, Particle } from './types'
import type { SplatInput } from '../visual/types'

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
		(gauss * gauss * 0.62 + Math.sqrt(Math.random()) * 0.38) * m.baseRadius

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

	ox += (fbm(s.x * 14 + ox * 22 + pSeed, s.y * 14 + oy * 22 + pSeed * 0.7) - 0.5) * m.baseRadius * 0.18
	oy += (fbm(s.y * 14 + pSeed, s.x * 14 + pSeed) - 0.5) * m.baseRadius * 0.18

	const omag = Math.hypot(ox, oy) || 1e-4
	const outX = ox / omag
	const outY = oy / omag
	const spd =
		0.012 +
		Math.random() * 0.018 +
		m.swipe * (0.022 + Math.random() * 0.018) +
		dist * (0.12 + Math.random() * 0.1)
	const mix = m.isSwipe ? 0.22 + m.motionBoost * 0.28 + Math.random() * 0.08 : 0
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
			const inherit = m.inheritScale * (0.75 + Math.random() * 0.35)
			vx += s.dx * inherit
			vy += s.dy * inherit
		}
	}

	return {
		x: s.x + ox,
		y: s.y + oy,
		vx,
		vy,
		life: 1,
		maxLife: 1.2 + m.motionBoost * 0.45 + (m.stopped ? 0.35 : 0) + Math.random(),
		r: cr + (Math.random() - 0.5) * 0.04,
		g: cg + (Math.random() - 0.5) * 0.04,
		b: cb + (Math.random() - 0.5) * 0.04,
		size: 0.78 + Math.random() * 0.72,
		flowX: m.dirX || flow.x,
		flowY: m.dirY || flow.y,
		seed: pSeed,
		drag: 0.975 + Math.random() * 0.012,
	}
}

export function splatColor(s: SplatInput): [number, number, number] {
	return parseHexColor(s.color)
}
