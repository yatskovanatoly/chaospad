import { MAX_PARTICLES } from './constants'
import { burstMetrics } from './burstMetrics'
import { smoothFlow } from './flowSmooth'
import { makeParticle, splatColor } from './makeParticle'
import type { FlowState, Particle } from './types'
import type { SplatInput } from '../visual/types'

export function spawnBurst(
	particles: Particle[],
	flowByKey: Map<string, FlowState>,
	s: SplatInput,
): void {
	const key = s.key ?? '__local__'
	const flow = smoothFlow(flowByKey, key, s.dx, s.dy)
	const m = burstMetrics(s, flow)
	const rgb = splatColor(s)
	const seed = Math.random() * 1000

	for (let i = 0; i < m.burstCount; i++) {
		if (particles.length >= MAX_PARTICLES) particles.shift()
		particles.push(makeParticle({ s, m, flow, rgb, seed, i }))
	}
}
