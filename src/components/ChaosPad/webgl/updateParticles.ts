import { sampleFlow } from './flowField'
import { lerp } from './math'
import type { Particle } from './types'

export function updateParticles(
	particles: Particle[],
	dt: number,
	time: number,
): Particle[] {
	const alive: Particle[] = []
	const subDt = dt * 0.5

	for (const p of particles) {
		for (let s = 0; s < 2; s++) {
			const field = sampleFlow(p.x, p.y, time + s * subDt * 0.5, p.seed)
			const vmag = Math.hypot(p.vx, p.vy)
			if (vmag > 0.0004) {
				const blend = Math.min(subDt * 1.1, 0.015)
				p.flowX = lerp(p.flowX, p.vx / vmag, blend)
				p.flowY = lerp(p.flowY, p.vy / vmag, blend)
			}
			p.vx += field.curlX + p.flowX * field.boost
			p.vy += field.curlY + p.flowY * field.boost
			p.x += p.vx * subDt
			p.y += p.vy * subDt
			const drag = p.drag - (1 - p.life) * 0.0015
			p.vx *= drag
			p.vy *= drag
		}

		p.life -= dt / p.maxLife
		if (p.life > 0 && p.x > -0.08 && p.x < 1.08 && p.y > -0.08 && p.y < 1.08) {
			alive.push(p)
		}
	}

	return alive
}
