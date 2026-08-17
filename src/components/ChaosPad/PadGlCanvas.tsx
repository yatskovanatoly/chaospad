'use client'

import { registerVisual, unregisterVisual } from '@/components/ChaosPad/visual/bridge'
import { ParticleSim } from '@/components/ChaosPad/webgl/ParticleSim'
import { useEffect, useRef } from 'react'

type Props = {
	containerRef: React.RefObject<HTMLDivElement | null>
}

export default function PadGlCanvas({ containerRef }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const rafRef = useRef(0)

	useEffect(() => {
		const canvas = canvasRef.current
		const container = containerRef.current
		if (!canvas || !container) return

		let sim: ParticleSim
		try {
			sim = new ParticleSim(canvas)
		} catch (err) {
			console.warn('[chaospad] webgl init failed', err)
			return
		}

		const resize = () => {
			const { width, height } = container.getBoundingClientRect()
			// Мобильные браузеры на схлопывании адресной строки/резинке успевают
			// отдать нулевой размер — на нём буфер следа схлопывается в угол.
			if (width < 1 || height < 1) return
			const dpr = Math.min(window.devicePixelRatio || 1, 2)
			canvas.width = Math.max(1, Math.floor(width * dpr))
			canvas.height = Math.max(1, Math.floor(height * dpr))
			canvas.style.width = `${width}px`
			canvas.style.height = `${height}px`
			sim.resize(width, height)
		}

		registerVisual((splat) => sim.pushSplat(splat))
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
			unregisterVisual()
			ro.disconnect()
			sim.destroy()
		}
	}, [containerRef])

	return (
		<canvas ref={canvasRef} className='chaospad-gl-canvas' aria-hidden='true' />
	)
}
