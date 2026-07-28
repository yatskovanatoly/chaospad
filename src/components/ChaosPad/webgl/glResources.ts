import { createProgram } from './glUtils'
import {
	FADE_FRAGMENT,
	FADE_VERTEX,
	PARTICLE_FRAGMENT,
	PARTICLE_VERTEX,
} from './shaders'
import { PARTICLE_STRIDE } from './constants'

const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])

export type GlResources = {
	gl: WebGL2RenderingContext
	program: WebGLProgram
	fadeProgram: WebGLProgram
	vao: WebGLVertexArrayObject
	quadVao: WebGLVertexArrayObject
	buffer: WebGLBuffer
	quadBuffer: WebGLBuffer
	cpuData: Float32Array
}

export function createGlResources(canvas: HTMLCanvasElement): GlResources {
	const gl = canvas.getContext('webgl2', {
		alpha: true,
		premultipliedAlpha: false,
		antialias: false,
		depth: false,
	})
	if (!gl) throw new Error('WebGL2 not supported')

	const program = createProgram(gl, PARTICLE_VERTEX, PARTICLE_FRAGMENT)
	const fadeProgram = createProgram(gl, FADE_VERTEX, FADE_FRAGMENT)
	const vao = gl.createVertexArray()
	const buffer = gl.createBuffer()
	const quadVao = gl.createVertexArray()
	const quadBuffer = gl.createBuffer()
	if (!vao || !buffer || !quadVao || !quadBuffer) {
		throw new Error('Failed to create GPU buffers')
	}

	const cpuData = new Float32Array(PARTICLE_STRIDE * 16_000)
	const stride = PARTICLE_STRIDE * 4

	gl.bindVertexArray(vao)
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
	gl.bufferData(gl.ARRAY_BUFFER, cpuData.byteLength, gl.DYNAMIC_DRAW)
	gl.enableVertexAttribArray(0)
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0)
	gl.enableVertexAttribArray(1)
	gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 8)
	gl.enableVertexAttribArray(2)
	gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 12)
	gl.enableVertexAttribArray(3)
	gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 24)

	gl.bindVertexArray(quadVao)
	gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
	gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW)
	gl.enableVertexAttribArray(0)
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0)
	gl.bindVertexArray(null)

	return { gl, program, fadeProgram, vao, quadVao, buffer, quadBuffer, cpuData }
}

export function destroyGlResources(r: GlResources): void {
	const { gl } = r
	gl.deleteBuffer(r.buffer)
	gl.deleteBuffer(r.quadBuffer)
	gl.deleteVertexArray(r.vao)
	gl.deleteVertexArray(r.quadVao)
	gl.deleteProgram(r.program)
	gl.deleteProgram(r.fadeProgram)
}
