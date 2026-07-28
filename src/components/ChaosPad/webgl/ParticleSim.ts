import { createProgram, parseHexColor } from './glUtils'
import {
	FADE_FRAGMENT,
	FADE_VERTEX,
	PARTICLE_FRAGMENT,
	PARTICLE_VERTEX,
} from './particleShaders'
import type { SplatInput } from '../helpers/padVisualBridge'
import { MAX_SPEED } from '../helpers/padVisualBridge'

const MAX_PARTICLES = 16_000
const BURST_COUNT = 26
const STRIDE = 7
const FLOW_LERP = 0.09
const TRAIL_FADE = 0.968

type Particle = {
	x: number
	y: number
	vx: number
	vy: number
	life: number
	maxLife: number
	r: number
	g: number
	b: number
	size: number
	flowX: number
	flowY: number
	seed: number
	drag: number
}

type FlowState = {
	x: number
	y: number
	speed: number
}

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

const sampleFlow = (x: number, y: number, t: number, seed: number) => {
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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const QUAD_VERTS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

export class ParticleSim {
	private gl: WebGL2RenderingContext
	private program: WebGLProgram
	private fadeProgram: WebGLProgram
	private vao: WebGLVertexArrayObject
	private quadVao: WebGLVertexArrayObject
	private buffer: WebGLBuffer
	private quadBuffer: WebGLBuffer
	private cpuData: Float32Array
	private particles: Particle[] = []
	private count = 0
	private displayWidth = 1
	private displayHeight = 1
	private time = 0
	private pending: SplatInput[] = []
	private flowByKey = new Map<string, FlowState>()
	private lastFrame = 0
	private fbos: [WebGLFramebuffer, WebGLFramebuffer]
	private textures: [WebGLTexture, WebGLTexture]
	private fbWidth = 0
	private fbHeight = 0
	private readIdx = 0

	constructor(canvas: HTMLCanvasElement) {
		const gl = canvas.getContext('webgl2', {
			alpha: true,
			premultipliedAlpha: false,
			antialias: false,
			depth: false,
		})
		if (!gl) throw new Error('WebGL2 not supported')

		this.gl = gl
		this.program = createProgram(gl, PARTICLE_VERTEX, PARTICLE_FRAGMENT)
		this.fadeProgram = createProgram(gl, FADE_VERTEX, FADE_FRAGMENT)

		const vao = gl.createVertexArray()
		const buffer = gl.createBuffer()
		if (!vao || !buffer) throw new Error('Failed to create GPU buffers')

		this.vao = vao
		this.buffer = buffer
		this.cpuData = new Float32Array(MAX_PARTICLES * STRIDE)

		gl.bindVertexArray(vao)
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
		gl.bufferData(gl.ARRAY_BUFFER, this.cpuData.byteLength, gl.DYNAMIC_DRAW)

		const stride = STRIDE * 4
		gl.enableVertexAttribArray(0)
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0)
		gl.enableVertexAttribArray(1)
		gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 8)
		gl.enableVertexAttribArray(2)
		gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 12)
		gl.enableVertexAttribArray(3)
		gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 24)
		gl.bindVertexArray(null)

		const quadVao = gl.createVertexArray()
		const quadBuffer = gl.createBuffer()
		if (!quadVao || !quadBuffer) throw new Error('Failed to create quad buffers')

		this.quadVao = quadVao
		this.quadBuffer = quadBuffer
		gl.bindVertexArray(quadVao)
		gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTS, gl.STATIC_DRAW)
		gl.enableVertexAttribArray(0)
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0)
		gl.bindVertexArray(null)

		this.fbos = [gl.createFramebuffer()!, gl.createFramebuffer()!]
		this.textures = [gl.createTexture()!, gl.createTexture()!]

		this.lastFrame = performance.now()
	}

	resize(displayWidth: number, displayHeight: number): void {
		const dpr = Math.min(window.devicePixelRatio || 1, 2)
		this.displayWidth = Math.max(1, Math.floor(displayWidth * dpr))
		this.displayHeight = Math.max(1, Math.floor(displayHeight * dpr))

		if (
			this.displayWidth !== this.fbWidth ||
			this.displayHeight !== this.fbHeight
		) {
			this.fbWidth = this.displayWidth
			this.fbHeight = this.displayHeight
			this.initFramebuffers()
		}
	}

	pushSplat(s: SplatInput): void {
		this.pending.push(s)
	}

	step(): void {
		const now = performance.now()
		const dt = Math.min(0.04, Math.max(0.008, (now - this.lastFrame) / 1000))
		this.lastFrame = now
		this.time += dt

		for (const s of this.pending) this.spawnBurst(s)
		this.pending.length = 0

		this.update(dt)
		this.draw()
	}

	destroy(): void {
		const gl = this.gl
		gl.deleteBuffer(this.buffer)
		gl.deleteBuffer(this.quadBuffer)
		gl.deleteVertexArray(this.vao)
		gl.deleteVertexArray(this.quadVao)
		gl.deleteProgram(this.program)
		gl.deleteProgram(this.fadeProgram)
		for (const fb of this.fbos) gl.deleteFramebuffer(fb)
		for (const tex of this.textures) gl.deleteTexture(tex)
	}

	private initFramebuffers(): void {
		const gl = this.gl
		const { fbWidth: w, fbHeight: h } = this

		for (let i = 0; i < 2; i++) {
			gl.bindTexture(gl.TEXTURE_2D, this.textures[i])
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

			gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[i])
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.COLOR_ATTACHMENT0,
				gl.TEXTURE_2D,
				this.textures[i],
				0,
			)
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, null)
		gl.bindTexture(gl.TEXTURE_2D, null)
	}

	private smoothFlow(key: string, dx: number, dy: number): FlowState {
		const speed = Math.hypot(dx, dy)
		const prev = this.flowByKey.get(key) ?? { x: 0, y: 0, speed: 0 }

		let tx = prev.x
		let ty = prev.y
		if (speed > 0.02) {
			tx = dx / speed
			ty = dy / speed
		}

		const flow: FlowState = {
			x: lerp(prev.x, tx, FLOW_LERP),
			y: lerp(prev.y, ty, FLOW_LERP),
			speed: lerp(prev.speed, Math.min(speed, 2.2), FLOW_LERP),
		}

		const mag = Math.hypot(flow.x, flow.y)
		if (mag > 1e-3) {
			flow.x /= mag
			flow.y /= mag
		}

		this.flowByKey.set(key, flow)
		return flow
	}

	private spawnBurst(s: SplatInput): void {
		const [cr, cg, cb] = parseHexColor(s.color)
		const key = s.key ?? '__local__'
		const stopped = s.stopped === true
		const impulse = s.impulse ?? 0
		const touchSpeed = Math.hypot(s.dx, s.dy)
		const hasInertia = touchSpeed > 0.015 || stopped || impulse > 0.08
		const touchDirX = touchSpeed > 1e-4 ? s.dx / touchSpeed : 0
		const touchDirY = touchSpeed > 1e-4 ? s.dy / touchSpeed : 0
		const speedNorm = Math.min(touchSpeed / MAX_SPEED, 1)
		const motionBoost = Math.min(
			speedNorm * 0.7 + impulse * 0.45 + (stopped ? speedNorm * 0.25 : 0),
			1,
		)

		const flow = this.smoothFlow(key, s.dx, s.dy)
		const isSwipe =
			hasInertia && (touchSpeed > 0.022 || impulse > 0.14 || stopped)

		let dirX = touchDirX || flow.x
		let dirY = touchDirY || flow.y
		if (!isSwipe) {
			dirX = 0
			dirY = 0
		}

		const perpX = -dirY
		const perpY = dirX
		const swipe = Math.min(Math.max(touchSpeed, flow.speed) * 0.45, 1)
		const radiusJitter = 0.92 + Math.random() * 0.16
		const baseRadius =
			(stopped
				? 0.042 + speedNorm * 0.035
				: isSwipe
					? 0.046 + swipe * 0.08
					: 0.044) * radiusJitter
		const stretch = isSwipe
			? 1 + swipe * (0.18 + motionBoost * 0.14 + Math.random() * 0.08)
			: 1
		const burstCount = Math.round(
			(stopped
				? BURST_COUNT * (0.75 + speedNorm * 0.35)
				: isSwipe
					? BURST_COUNT + swipe * 10 + impulse * 4
					: BURST_COUNT) * (0.88 + Math.random() * 0.22),
		)
		const inertiaBase = Math.min(
			touchSpeed * 0.022 + impulse * 0.06 + (stopped ? speedNorm * 0.035 : 0),
			0.11,
		)
		const inheritScale =
			0.006 + speedNorm * 0.009 + impulse * 0.012 + (stopped ? speedNorm * 0.014 : 0)
		const burstSeed = Math.random() * 1000

		for (let i = 0; i < burstCount; i++) {
			if (this.particles.length >= MAX_PARTICLES) {
				this.particles.shift()
			}

			const pSeed = burstSeed + i * 1.618 + Math.random() * 7
			const angle = Math.random() * Math.PI * 2
			const gauss = (Math.random() + Math.random() + Math.random()) / 3
			const ring = Math.sqrt(Math.random())
			const dist = (gauss * gauss * 0.62 + ring * 0.38) * baseRadius

			let ox = Math.cos(angle) * dist
			let oy = Math.sin(angle) * dist

			if (isSwipe) {
				const along = ox * dirX + oy * dirY
				const perp = ox * perpX + oy * perpY
				const perpScale =
					stopped || impulse > 0.35 ? 0.72 + Math.random() * 0.2 : 0.88 + Math.random() * 0.12
				ox = dirX * along * stretch + perpX * perp * perpScale
				oy = dirY * along * stretch + perpY * perp * perpScale
			}

			const n = fbm(s.x * 14 + ox * 22 + pSeed, s.y * 14 + oy * 22 + pSeed * 0.7)
			ox += (n - 0.5) * baseRadius * 0.18
			oy +=
				(fbm(s.y * 14 + pSeed, s.x * 14 + pSeed) - 0.5) * baseRadius * 0.18

			const omag = Math.hypot(ox, oy) || 1e-4
			const outX = ox / omag
			const outY = oy / omag
			const spd =
				0.012 +
				Math.random() * 0.018 +
				swipe * (0.022 + Math.random() * 0.018) +
				dist * (0.12 + Math.random() * 0.1)
			const flowMix = isSwipe ? 0.22 + motionBoost * 0.28 + Math.random() * 0.08 : 0
			let vx =
				(outX * (1 - flowMix) + dirX * flowMix) * spd +
				(Math.random() - 0.5) * 0.005
			let vy =
				(outY * (1 - flowMix) + dirY * flowMix) * spd +
				(Math.random() - 0.5) * 0.005

			if (hasInertia) {
				const alongBias = 0.65 + Math.random() * 0.35
				vx += touchDirX * inertiaBase * alongBias
				vy += touchDirY * inertiaBase * alongBias

				if (touchSpeed > 0.012 || stopped) {
					const inherit = inheritScale * (0.75 + Math.random() * 0.35)
					vx += s.dx * inherit
					vy += s.dy * inherit
				}
			}

			this.particles.push({
				x: s.x + ox,
				y: s.y + oy,
				vx,
				vy,
				life: 1,
				maxLife:
					1.2 + motionBoost * 0.45 + (stopped ? 0.35 : 0) + Math.random() * 1.0,
				r: cr + (Math.random() - 0.5) * 0.04,
				g: cg + (Math.random() - 0.5) * 0.04,
				b: cb + (Math.random() - 0.5) * 0.04,
				size: 0.78 + Math.random() * 0.72,
				flowX: dirX || flow.x,
				flowY: dirY || flow.y,
				seed: pSeed,
				drag: 0.975 + Math.random() * 0.012,
			})
		}
	}

	private update(dt: number): void {
		const alive: Particle[] = []
		const t = this.time
		const subSteps = 2
		const subDt = dt / subSteps

		for (const p of this.particles) {
			for (let s = 0; s < subSteps; s++) {
				const field = sampleFlow(p.x, p.y, t + s * subDt * 0.5, p.seed)
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

				const lifeDrag = 1 - p.life
				p.vx *= p.drag - lifeDrag * 0.0015
				p.vy *= p.drag - lifeDrag * 0.0015
			}

			p.life -= dt / p.maxLife
			if (
				p.life > 0 &&
				p.x > -0.08 &&
				p.x < 1.08 &&
				p.y > -0.08 &&
				p.y < 1.08
			) {
				alive.push(p)
			}
		}

		this.particles = alive
	}

	private draw(): void {
		const gl = this.gl
		const { displayWidth: w, displayHeight: h } = this

		gl.viewport(0, 0, w, h)

		const writeIdx = 1 - this.readIdx
		const readTex = this.textures[this.readIdx]
		const writeFbo = this.fbos[writeIdx]

		gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo)
		gl.clearColor(0, 0, 0, 0)
		gl.clear(gl.COLOR_BUFFER_BIT)

		gl.enable(gl.BLEND)
		gl.useProgram(this.fadeProgram)
		gl.bindVertexArray(this.quadVao)
		gl.activeTexture(gl.TEXTURE0)
		gl.bindTexture(gl.TEXTURE_2D, readTex)
		gl.uniform1i(gl.getUniformLocation(this.fadeProgram, 'uTexture'), 0)
		gl.uniform1f(
			gl.getUniformLocation(this.fadeProgram, 'uFade'),
			TRAIL_FADE,
		)
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

		this.count = this.particles.length
		if (this.count > 0) {
			const data = this.cpuData
			for (let i = 0; i < this.count; i++) {
				const p = this.particles[i]
				const o = i * STRIDE
				const t = p.life
				const fade = t * t * (3 - 2 * t)
				data[o] = p.x
				data[o + 1] = p.y
				data[o + 2] = fade
				data[o + 3] = p.r
				data[o + 4] = p.g
				data[o + 5] = p.b
				data[o + 6] = p.size
			}

			gl.useProgram(this.program)
			gl.bindVertexArray(this.vao)
			gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
			gl.bufferSubData(
				gl.ARRAY_BUFFER,
				0,
				data.subarray(0, this.count * STRIDE),
			)
			gl.uniform2f(
				gl.getUniformLocation(this.program, 'uResolution'),
				w,
				h,
			)
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
			gl.drawArrays(gl.POINTS, 0, this.count)
		}

		gl.disable(gl.BLEND)

		gl.bindFramebuffer(gl.FRAMEBUFFER, null)
		gl.viewport(0, 0, w, h)
		gl.clearColor(0, 0, 0, 0)
		gl.clear(gl.COLOR_BUFFER_BIT)

		gl.enable(gl.BLEND)
		gl.useProgram(this.fadeProgram)
		gl.bindVertexArray(this.quadVao)
		gl.activeTexture(gl.TEXTURE0)
		gl.bindTexture(gl.TEXTURE_2D, this.textures[writeIdx])
		gl.uniform1i(gl.getUniformLocation(this.fadeProgram, 'uTexture'), 0)
		gl.uniform1f(gl.getUniformLocation(this.fadeProgram, 'uFade'), 1.0)
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
		gl.disable(gl.BLEND)

		this.readIdx = writeIdx
	}
}
