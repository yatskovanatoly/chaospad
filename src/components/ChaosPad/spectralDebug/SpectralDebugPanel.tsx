'use client'

import { useAudioEngine } from '@/components/AudioEngineContext/useAudioEngine'
import { useEffect, useRef } from 'react'
import {
	appendSpectrumColumn,
	clearSpectrum,
	SPECTRUM_COLS,
	SPECTRUM_ROW_H,
} from './spectrogramScroll'

type Props = {
	open: boolean
}

export function SpectralDebugPanel({ open }: Props) {
	const engine = useAudioEngine()
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const rowImageRef = useRef<ImageData | null>(null)
	const bufRef = useRef<Uint8ClampedArray | null>(null)
	const freqScratchRef = useRef<Uint8Array | null>(null)

	useEffect(() => {
		if (open) return
		bufRef.current = null
	}, [open])

	useEffect(() => {
		if (!open) return

		let raf = 0
		let frame = 0
		const loop = () => {
			raf = requestAnimationFrame(loop)
			frame++
			if (frame % 2) return

			const canvas = canvasRef.current
			const ctx = canvas?.getContext('2d')
			if (!ctx || !canvas) return

			const W = SPECTRUM_COLS
			const H = SPECTRUM_ROW_H

			if (canvas.width !== W || canvas.height !== H) {
				canvas.width = W
				canvas.height = H
			}

			let buf = bufRef.current
			if (!buf || buf.length !== W * SPECTRUM_ROW_H * 4) {
				buf = new Uint8ClampedArray(W * SPECTRUM_ROW_H * 4)
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

			appendSpectrumColumn(buf, W, SPECTRUM_ROW_H, readFreq(engine.masterAnalyser))

			ctx.fillStyle = '#080808'
			ctx.fillRect(0, 0, W, H)

			if (!rowImageRef.current || rowImageRef.current.width !== W) {
				rowImageRef.current = ctx.createImageData(W, SPECTRUM_ROW_H)
			}
			const rowImg = rowImageRef.current
			rowImg.data.set(buf)
			ctx.putImageData(rowImg, 0, 0)
		}

		raf = requestAnimationFrame(loop)
		return () => cancelAnimationFrame(raf)
	}, [open, engine])

	if (!open) return null

	return (
		<div className='fixed bottom-20 right-4 z-[500] max-w-[min(100vw-2rem,280px)] rounded border border-white/15 bg-black/90 p-2 shadow-xl'>
			<div className='mb-1 text-[10px] uppercase tracking-wide text-neutral-500'>Spectrogram</div>
			<div className='mb-1 text-[9px] font-mono text-neutral-400'>master out</div>
			<canvas ref={canvasRef} className='block w-full' style={{ imageRendering: 'pixelated' }} />
		</div>
	)
}
