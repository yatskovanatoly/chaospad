import { PARTICLE_STRIDE } from './constants'
import { smoothLife } from './math'
import type { GlResources } from './glResources'
import type { Particle } from './types'

export function drawParticles(
	res: GlResources,
	particles: Particle[],
	width: number,
	height: number,
): number {
	const { gl, program, vao, buffer, cpuData } = res
	const count = particles.length
	if (count === 0) return 0

	for (let i = 0; i < count; i++) {
		const p = particles[i]
		const o = i * PARTICLE_STRIDE
		cpuData[o] = p.x
		cpuData[o + 1] = p.y
		cpuData[o + 2] = smoothLife(p.life)
		cpuData[o + 3] = p.r
		cpuData[o + 4] = p.g
		cpuData[o + 5] = p.b
		cpuData[o + 6] = p.size
	}

	gl.useProgram(program)
	gl.bindVertexArray(vao)
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, cpuData.subarray(0, count * PARTICLE_STRIDE))
	gl.uniform2f(gl.getUniformLocation(program, 'uResolution'), width, height)
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
	gl.drawArrays(gl.POINTS, 0, count)
	return count
}
