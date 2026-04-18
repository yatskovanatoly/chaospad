'use client'

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { getBorderClassRgb } from '../helpers/borderColorRgb'
import type { RemotePadEvent, VisEvent } from '../EventsContext/EventsContext'
import { usePadEventHandlers } from '../EventsContext/useEvents'
import { useViewportSize } from './useViewportSize'

type CursorState = {
	nx: number
	ny: number
	on: boolean
	rgb: [number, number, number]
}

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

const VS = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
	v_uv = a_pos * 0.5 + 0.5;
	gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const FS = `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_local;
uniform vec2 u_remote;
uniform float u_localOn;
uniform float u_remoteOn;
uniform vec3 u_localRgb;
uniform vec3 u_remoteRgb;

void main() {
	vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
	vec2 uvDist = uv;
	if (u_localOn > 0.5) {
		vec2 d = uv - u_local;
		float len = length(d);
		uvDist += normalize(d + vec2(0.0001)) * sin(u_time * 3.0 - len * 24.0) * 0.022 * exp(-len * 4.0);
	}
	vec3 baseTint = (u_localRgb + u_remoteRgb) * 0.08;
	vec3 col = baseTint * (0.45 + 0.55 * sin(u_time * 0.7 + uv.x * 3.0));
	if (u_localOn > 0.5) {
		float dist = distance(uvDist, u_local);
		float pulse = 0.55 + 0.45 * sin(u_time * 2.8 + dist * 14.0);
		float g = exp(-dist * 5.5) * pulse;
		col += u_localRgb * g * 1.5;
	}
	if (u_remoteOn > 0.5) {
		float dist = distance(uv, u_remote);
		float pulse = 0.55 + 0.45 * cos(u_time * 2.2 + dist * 12.0);
		float g = exp(-dist * 5.5) * pulse;
		col += u_remoteRgb * g * 1.35;
	}
	float a = clamp(length(col) * 1.35, 0.0, 0.98);
	gl_FragColor = vec4(col, a);
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

export default function WebGLViz() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const localRef = useRef<CursorState>({
		nx: 0.5,
		ny: 0.5,
		on: false,
		rgb: getBorderClassRgb('border-blue-500'),
	})
	const remoteRef = useRef<CursorState>({
		nx: 0.5,
		ny: 0.5,
		on: false,
		rgb: getBorderClassRgb('border-red-500'),
	})
	const rafRef = useRef(0)
	const aliveRef = useRef(true)
	const glRef = useRef<{
		gl: WebGLRenderingContext
		prog: WebGLProgram
		loc: Record<string, WebGLUniformLocation | null>
		buf: WebGLBuffer
		aPos: number
	} | null>(null)

	const { width, height } = useViewportSize()

	const onLocal = useCallback((e: VisEvent) => {
		if (e.type === 'stop') {
			localRef.current = { ...localRef.current, on: false }
			return
		}
		localRef.current = {
			nx: e.nx,
			ny: e.ny,
			on: true,
			rgb: getBorderClassRgb(e.color),
		}
	}, [])

	const onRemote = useCallback((e: RemotePadEvent) => {
		if (e.type === 'stop') {
			remoteRef.current = { ...remoteRef.current, on: false }
			return
		}
		remoteRef.current = {
			nx: e.nx,
			ny: e.ny,
			on: true,
			rgb: getBorderClassRgb(e.color),
		}
	}, [])

	usePadEventHandlers({ onLocal, onRemote })

	useLayoutEffect(() => {
		const canvas = canvasRef.current
		if (!canvas || width < 1 || height < 1) return
		syncCanvasSize(canvas, width, height)
		const pack = glRef.current
		if (pack) pack.gl.viewport(0, 0, canvas.width, canvas.height)
	}, [width, height])

	useEffect(() => {
		aliveRef.current = true
		const canvas = canvasRef.current
		if (!canvas) return

		const tryInit = () => {
			if (glRef.current) return
			const rect = canvas.getBoundingClientRect()
			const w =
				rect.width >= 2 ? rect.width : Math.max(width, window.innerWidth)
			const h =
				rect.height >= 2 ? rect.height : Math.max(height, window.innerHeight)
			if (w < 2 || h < 2) {
				rafRef.current = requestAnimationFrame(tryInit)
				return
			}
			syncCanvasSize(canvas, w, h)

			const gl = canvas.getContext('webgl', {
				alpha: true,
				premultipliedAlpha: false,
				preserveDrawingBuffer: false,
			})
			if (!gl) return

			const prog = link(gl, VS, FS)
			const buf = gl.createBuffer()!
			gl.bindBuffer(gl.ARRAY_BUFFER, buf)
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

			const aPos = gl.getAttribLocation(prog, 'a_pos')
			gl.enableVertexAttribArray(aPos)
			gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

			glRef.current = {
				gl,
				prog,
				loc: {
					u_time: gl.getUniformLocation(prog, 'u_time'),
					u_local: gl.getUniformLocation(prog, 'u_local'),
					u_remote: gl.getUniformLocation(prog, 'u_remote'),
					u_localOn: gl.getUniformLocation(prog, 'u_localOn'),
					u_remoteOn: gl.getUniformLocation(prog, 'u_remoteOn'),
					u_localRgb: gl.getUniformLocation(prog, 'u_localRgb'),
					u_remoteRgb: gl.getUniformLocation(prog, 'u_remoteRgb'),
				},
				buf,
				aPos,
			}

			const draw = () => {
				if (!aliveRef.current) return
				const pack = glRef.current
				const c = canvasRef.current
				if (!pack || !c || c.width < 2 || c.height < 2) {
					if (aliveRef.current) rafRef.current = requestAnimationFrame(draw)
					return
				}
				const { gl, prog, loc } = pack
				const t = performance.now() * 0.001
				const L = localRef.current
				const R = remoteRef.current

				gl.viewport(0, 0, c.width, c.height)
				gl.useProgram(prog)
				gl.bindBuffer(gl.ARRAY_BUFFER, pack.buf)
				gl.enableVertexAttribArray(pack.aPos)
				gl.vertexAttribPointer(pack.aPos, 2, gl.FLOAT, false, 0, 0)

				gl.clearColor(0, 0, 0, 0)
				gl.clear(gl.COLOR_BUFFER_BIT)
				gl.enable(gl.BLEND)
				gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

				gl.uniform1f(loc.u_time, t)
				gl.uniform2f(loc.u_local, L.nx, L.ny)
				gl.uniform2f(loc.u_remote, R.nx, R.ny)
				gl.uniform1f(loc.u_localOn, L.on ? 1 : 0)
				gl.uniform1f(loc.u_remoteOn, R.on ? 1 : 0)
				gl.uniform3f(loc.u_localRgb, L.rgb[0], L.rgb[1], L.rgb[2])
				gl.uniform3f(loc.u_remoteRgb, R.rgb[0], R.rgb[1], R.rgb[2])

				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
				if (aliveRef.current) rafRef.current = requestAnimationFrame(draw)
			}
			rafRef.current = requestAnimationFrame(draw)
		}

		tryInit()

		return () => {
			aliveRef.current = false
			cancelAnimationFrame(rafRef.current)
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
			className='fixed inset-0 pointer-events-none z-[5]'
			style={{ opacity: 0.88 }}
		/>
	)
}
