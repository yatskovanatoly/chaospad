'use client'

import { padEventStore } from '@/state/padEventStore'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { usePadSurface } from '../PadSurfaceContext'

function compile(gl: WebGLRenderingContext, type: number, src: string) {
	const sh = gl.createShader(type)!
	gl.shaderSource(sh, src)
	gl.compileShader(sh)
	if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
		gl.deleteShader(sh)
		throw new Error(gl.getShaderInfoLog(sh) ?? 'shader')
	}
	return sh
}

function link(gl: WebGLRenderingContext, vs: string, fs: string) {
	const v = compile(gl, gl.VERTEX_SHADER, vs)
	const f = compile(gl, gl.FRAGMENT_SHADER, fs)
	const p = gl.createProgram()!
	gl.attachShader(p, v)
	gl.attachShader(p, f)
	gl.linkProgram(p)
	gl.deleteShader(v)
	gl.deleteShader(f)
	if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
		gl.deleteProgram(p)
		throw new Error(gl.getProgramInfoLog(p) ?? 'program')
	}
	return p
}

const VS = `attribute vec2 a_pos;
void main() {
	gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const FS = `precision mediump float;
uniform vec4 u_color;
void main() {
	gl_FragColor = u_color;
}`

function syncCanvasSize(canvas: HTMLCanvasElement, width: number, height: number) {
	const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
	const w = Math.max(2, Math.floor(width * dpr))
	const h = Math.max(2, Math.floor(height * dpr))
	canvas.width = w
	canvas.height = h
	canvas.style.width = `${width}px`
	canvas.style.height = `${height}px`
}

type GlPack = {
	gl: WebGLRenderingContext
	prog: WebGLProgram
	buf: WebGLBuffer
	aPos: number
	uColor: WebGLUniformLocation | null
}

export default function WaveformBufferViz() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const glRef = useRef<GlPack | null>(null)
	const bins = padEventStore((s) => s.local?.xyArray)
	const version = padEventStore((s) => s.xyVersion)
	const { width, height } = usePadSurface()

	useLayoutEffect(() => {
		const canvas = canvasRef.current
		if (!canvas || width < 1 || height < 1) return
		syncCanvasSize(canvas, width, height)

		let pack = glRef.current
		if (!pack) {
			const gl = canvas.getContext('webgl', {
				alpha: true,
				premultipliedAlpha: false,
			})
			if (!gl) return
			const prog = link(gl, VS, FS)
			const buf = gl.createBuffer()!
			pack = {
				gl,
				prog,
				buf,
				aPos: gl.getAttribLocation(prog, 'a_pos'),
				uColor: gl.getUniformLocation(prog, 'u_color'),
			}
			glRef.current = pack
		}

		const { gl, prog, buf, aPos, uColor } = pack
		if (!bins || bins.length < 2) {
			gl.clearColor(0, 0, 0, 0)
			gl.clear(gl.COLOR_BUFFER_BIT)
			return
		}
		const n = bins.length

		const stripLen = 2 * n
		const lineLen = n
		const verts = new Float32Array((stripLen + lineLen) * 2)
		let o = 0
		const denom = Math.max(1, n - 1)
		for (let i = 0; i < n; i++) {
			const x = 2 * (i / denom) - 1
			const y = 2 * bins[i] - 1
			verts[o++] = x
			verts[o++] = y
			verts[o++] = x
			verts[o++] = -1
		}
		for (let i = 0; i < n; i++) {
			const x = 2 * (i / denom) - 1
			const y = 2 * bins[i] - 1
			verts[o++] = x
			verts[o++] = y
		}

		gl.viewport(0, 0, canvas.width, canvas.height)
		gl.clearColor(0, 0, 0, 0)
		gl.clear(gl.COLOR_BUFFER_BIT)
		gl.enable(gl.BLEND)
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

		gl.useProgram(prog)
		gl.bindBuffer(gl.ARRAY_BUFFER, buf)
		gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW)
		gl.enableVertexAttribArray(aPos)
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

		if (uColor) gl.uniform4f(uColor, 0.88, 0.95, 1.0, 0.42)
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, stripLen)

		if (uColor) gl.uniform4f(uColor, 0.88, 0.95, 1.0, 0.82)
		gl.drawArrays(gl.LINE_STRIP, stripLen, lineLen)
	}, [version, width, height, bins])

	useEffect(() => {
		return () => {
			const pack = glRef.current
			if (pack) {
				pack.gl.deleteProgram(pack.prog)
				pack.gl.deleteBuffer(pack.buf)
			}
			glRef.current = null
		}
	}, [])

	return (
		<canvas
			ref={canvasRef}
			className='absolute inset-0 pointer-events-none z-[6]'
			style={{ opacity: 0.92 }}
		/>
	)
}
