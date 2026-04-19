'use client'

import { getEngine, subscribeEngine } from '@/audio/engine/audioEngineSingleton'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { appendSpectrumColumn, clearSpectrum } from './spectrogramScroll'

type Props = {
	open: boolean
	className?: string
}

export function SpectralDebugPanel({ open, className = '' }: Props) {
	const engine = useSyncExternalStore(subscribeEngine, getEngine, () => null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const rowImageRef = useRef<ImageData | null>(null)
	const bufRef = useRef<Uint8ClampedArray | null>(null)
	const freqScratchRef = useRef<Uint8Array | null>(null)
	const [dims, setDims] = useState({ w: 256, h: 56 })

	useEffect(() => {
		if (!open) return
		bufRef.current = null
		rowImageRef.current = null
	}, [open])

	useEffect(() => {
		if (!open) return
		const el = containerRef.current
		if (!el) return
		const measure = () => {
			const cr = el.getBoundingClientRect()
			const w = Math.max(32, Math.floor(cr.width))
			const h = Math.max(32, Math.floor(cr.height))
			setDims((d) => (d.w === w && d.h === h ? d : { w, h }))
		}
		measure()
		const ro = new ResizeObserver(measure)
		ro.observe(el)
		return () => ro.disconnect()
	}, [open])

	useEffect(() => {
		if (!open || !engine) return

		let raf = 0
		let frame = 0
		const W = dims.w
		const H = dims.h

		const loop = () => {
			raf = requestAnimationFrame(loop)
			frame++
			if (frame % 2) return

			const canvas = canvasRef.current
			const ctx = canvas?.getContext('2d')
			if (!ctx || !canvas) return

			if (canvas.width !== W || canvas.height !== H) {
				canvas.width = W
				canvas.height = H
			}

			let buf = bufRef.current
			if (!buf || buf.length !== W * H * 4) {
				buf = new Uint8ClampedArray(W * H * 4)
				clearSpectrum(buf)
				bufRef.current = buf
			}

			const readFreq = (analyser: AnalyserNode) => {
				const n = analyser.frequencyBinCount
				let b = freqScratchRef.current
				if (!b || b.length !== n) {
					b = new Uint8Array(new ArrayBuffer(n))
					freqScratchRef.current = b
				}
				analyser.getByteFrequencyData(b as Parameters<AnalyserNode['getByteFrequencyData']>[0])
				return b
			}

			appendSpectrumColumn(buf, W, H, readFreq(engine.masterAnalyser))

			ctx.fillStyle = '#080808'
			ctx.fillRect(0, 0, W, H)

			if (!rowImageRef.current || rowImageRef.current.width !== W || rowImageRef.current.height !== H) {
				rowImageRef.current = ctx.createImageData(W, H)
			}
			const rowImg = rowImageRef.current
			rowImg.data.set(buf)
			ctx.putImageData(rowImg, 0, 0)
		}

		raf = requestAnimationFrame(loop)
		return () => cancelAnimationFrame(raf)
	}, [open, engine, dims.w, dims.h])

	if (!open) return null

	return (
		<div ref={containerRef} className={`min-h-0 min-w-0 h-full flex-1 flex flex-col ${className}`}>
			<canvas
				ref={canvasRef}
				className='block h-full w-full min-h-0'
				style={{ imageRendering: 'pixelated' }}
			/>
		</div>
	)
}
