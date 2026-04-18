'use client'

import { pixelToNormalized } from '@/components/AudioEngineContext/helpers/getSoundParams'
import { useState } from 'react'
import { useChaosAudio } from './hooks/useChaosAudio'
import { useChaosWebSocket } from './hooks/useChaosWs'
import useWebSocket from '../WsContext/useWebSocket'
import { MotionType } from '../WsContext/WsContextProvider'
import { EventsContextProvider } from './EventsContext/EventsContextProvider'
import { useEvents } from './EventsContext/useEvents'
import { soundModes } from './sounds'
import { visualizations } from './visualizations'
import { SpectralDebugPanel } from './spectralDebug'
import WaveformBufferViz from './visualizations/WaveformBufferViz'

function ChaosPadInner() {
	const { isActive, oscillatorRef, quantize, soundModeId, setSoundModeId } = useChaosAudio()

	useChaosWebSocket(quantize, soundModeId)

	const { setType, setPos } = useWebSocket()
	const { emitPadHover } = useEvents()
	const [vizId, setVizId] = useState(visualizations[0].id)
	const [spectralDebugOpen, setSpectralDebugOpen] = useState(false)
	const ActiveViz = visualizations.find((v) => v.id === vizId)!.component

	const emitPointer = (e: React.PointerEvent, type: MotionType) => {
		setPos(pixelToNormalized(e.clientX, e.clientY))
		setType(type)
	}

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.pointerType === 'mouse' && e.button !== 0) return
		e.currentTarget.setPointerCapture(e.pointerId)
		emitPointer(e, 'start')
	}

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.pointerType !== 'mouse' || e.buttons === 0) {
			emitPadHover(pixelToNormalized(e.clientX, e.clientY))
		}

		if (!isActive || !oscillatorRef.current) return
		emitPointer(e, 'move')
	}

	const handlePointerLeave = () => {
		emitPadHover(null)
	}

	const releaseCaptureIfHeld = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId)
		}
	}

	const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.pointerType === 'mouse' && e.button !== 0) return
		releaseCaptureIfHeld(e)
		emitPointer(e, 'stop')
	}

	const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
		releaseCaptureIfHeld(e)
		emitPointer(e, 'stop')
	}

	return (
		<>
			<div className='w-full h-dvh bg-gradient-to-t from-gray-800 to-black flex flex-col items-center justify-center select-none'>
				<div className='w-full h-full flex-1 relative overflow-hidden'>
					<div
						className='absolute inset-0 touch-none'
						onPointerDown={handlePointerDown}
						onPointerMove={handlePointerMove}
						onPointerLeave={handlePointerLeave}
						onPointerUp={handlePointerUp}
						onPointerCancel={handlePointerCancel}
					/>
				</div>
				<div className='w-full max-w-xl px-6 py-4 z-10 text-sm text-white space-y-2'>
					<div className='flex flex-wrap gap-2'>
						{visualizations.map((v) => (
							<button
								key={v.id}
								onClick={() => setVizId(v.id)}
								className={`px-3 py-1 rounded border text-xs transition-colors ${
									vizId === v.id
										? 'border-white bg-white text-black'
										: 'border-gray-600 text-gray-400 hover:border-gray-400'
								}`}
							>
								{v.label}
							</button>
						))}
					</div>
					<label className='flex items-center gap-2 cursor-pointer'>
						<input
							type='checkbox'
							checked={spectralDebugOpen}
							onChange={(e) => setSpectralDebugOpen(e.target.checked)}
							className='rounded border-gray-600'
						/>
						<span className='text-neutral-400'>Spectrum debug</span>
					</label>
					<div className='flex flex-wrap gap-2'>
						{soundModes.map((s) => (
							<button
								key={s.id}
								onClick={() => setSoundModeId(s.id)}
								className={`px-3 py-1 rounded border text-xs transition-colors ${
									soundModeId === s.id
										? 'border-amber-200 bg-amber-100 text-black'
										: 'border-gray-600 text-gray-400 hover:border-gray-400'
								}`}
							>
								{s.label}
							</button>
						))}
					</div>
				</div>
			</div>
			<ActiveViz />
			<WaveformBufferViz />
			<SpectralDebugPanel open={spectralDebugOpen} />
		</>
	)
}

export default function ChaosPad() {
	return (
		<EventsContextProvider>
			<ChaosPadInner />
		</EventsContextProvider>
	)
}
