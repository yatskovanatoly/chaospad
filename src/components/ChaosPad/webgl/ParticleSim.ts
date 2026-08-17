import type { SplatInput } from '../visual/types'
import { TRAIL_FADE } from './constants'
import { drawParticles } from './drawParticles'
import type { GlResources } from './glResources'
import { createGlResources, destroyGlResources } from './glResources'
import { spawnBurst } from './spawnBurst'
import {
	blitTexture,
	createTrailBuffer,
	destroyTrailBuffer,
	resizeTrailBuffer,
	type TrailBuffer,
} from './trailBuffer'
import type { FlowState, Particle } from './types'
import { updateParticles } from './updateParticles'

export class ParticleSim {
	private res: GlResources
	private trail: TrailBuffer
	private particles: Particle[] = []
	private pending: SplatInput[] = []
	private flowByKey = new Map<string, FlowState>()
	private time = 0
	private lastFrame = 0
	private width = 1
	private height = 1

	constructor(canvas: HTMLCanvasElement) {
		this.res = createGlResources(canvas)
		this.trail = createTrailBuffer(this.res.gl, 1, 1)
		this.lastFrame = performance.now()
	}

	resize(displayWidth: number, displayHeight: number): void {
		const dpr = Math.min(window.devicePixelRatio || 1, 2)
		const w = Math.max(1, Math.floor(displayWidth * dpr))
		const h = Math.max(1, Math.floor(displayHeight * dpr))
		if (w === this.width && h === this.height) return
		this.width = w
		this.height = h
		resizeTrailBuffer(this.res.gl, this.trail, w, h)
	}

	pushSplat(s: SplatInput): void {
		this.pending.push(s)
	}

	step(): void {
		const now = performance.now()
		const dt = Math.min(0.04, Math.max(0.008, (now - this.lastFrame) / 1000))
		this.lastFrame = now
		this.time += dt

		for (const s of this.pending) spawnBurst(this.particles, this.flowByKey, s)
		this.pending.length = 0
		this.particles = updateParticles(this.particles, dt, this.time)
		this.render()
	}

	destroy(): void {
		destroyTrailBuffer(this.res.gl, this.trail)
		destroyGlResources(this.res)
	}

	private render(): void {
		const { gl, fadeProgram, quadVao } = this.res
		const { width: w, height: h } = this
		const writeIdx = 1 - this.trail.readIdx
		const readTex = this.trail.textures[this.trail.readIdx]
		const writeFbo = this.trail.fbos[writeIdx]

		gl.viewport(0, 0, w, h)
		gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo)
		gl.clearColor(0, 0, 0, 0)
		gl.clear(gl.COLOR_BUFFER_BIT)
		gl.enable(gl.BLEND)
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
		blitTexture(gl, fadeProgram, quadVao, readTex, TRAIL_FADE)
		drawParticles(this.res, this.particles, w, h)
		gl.disable(gl.BLEND)

		gl.bindFramebuffer(gl.FRAMEBUFFER, null)
		gl.clearColor(0, 0, 0, 0)
		gl.clear(gl.COLOR_BUFFER_BIT)
		gl.enable(gl.BLEND)
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
		blitTexture(gl, fadeProgram, quadVao, this.trail.textures[writeIdx], 1)
		gl.disable(gl.BLEND)

		this.trail.readIdx = writeIdx
	}
}
