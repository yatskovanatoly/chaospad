'use client'

import {
	registerPadVisual,
	unregisterPadVisual,
} from '@/components/ChaosPad/helpers/padVisualBridge'
import { ParticleSim } from '@/components/ChaosPad/webgl/ParticleSim'
import { useEffect, useRef } from 'react'

type PadGlCanvasProps = {
	containerRef: React.RefObject<HTMLDivElement | null>
}

export default function PadGlCanvas({ containerRef }: PadGlCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const simRef = useRef<ParticleSim | null>(null)
	const rafRef = useRef(0)

	useEffect(() => {
		const canvas = canvasRef.current
		const container = containerRef.current
		if (!canvas || !container) return

		let sim: ParticleSim
		try {
			sim = new ParticleSim(canvas)
		} catch (err) {
			console.warn(
				'[chaospad] webgl particles init failed, falling back to css',
				err,
			)
			return
		}

		simRef.current = sim

		const resize = () => {
			const { width, height } = container.getBoundingClientRect()
			const dpr = Math.min(window.devicePixelRatio || 1, 2)
			canvas.width = Math.max(1, Math.floor(width * dpr))
			canvas.height = Math.max(1, Math.floor(height * dpr))
			canvas.style.width = `${width}px`
			canvas.style.height = `${height}px`
			sim.resize(width, height)
		}

		registerPadVisual((splat) => sim.pushSplat(splat))

		const ro = new ResizeObserver(resize)
		ro.observe(container)
		resize()

		const loop = () => {
			sim.step()
			rafRef.current = requestAnimationFrame(loop)
		}
		rafRef.current = requestAnimationFrame(loop)

		return () => {
			cancelAnimationFrame(rafRef.current)
			unregisterPadVisual()
			ro.disconnect()
			sim.destroy()
			simRef.current = null
		}
	}, [containerRef])

	return (
		<canvas
			ref={canvasRef}
			className='chaospad-gl-canvas'
			aria-hidden='true'
		/>
	)
}
