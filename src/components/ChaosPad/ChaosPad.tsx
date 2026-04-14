'use client'

import { useChaosAudio } from './hooks/useChaosAudio'
import { useChaosWebSocket } from './hooks/useChaosWs'
import useWebSocket from '../WsContext/useWebSocket'
import { MotionType } from '../WsContext/WsContextProvider'
import GlowEffect from './GlowFx'

export default function ChaosPad() {

	const {
		setRelease,
		setReverbLevel,
		release,
		reverbLevel,
		volume,
		setVolume,
		isActive,
		oscillatorRef,
		quantize,
	} = useChaosAudio()

	useChaosWebSocket(quantize)

	const { setType, setPos } = useWebSocket()

	const emitPointer = (e: React.PointerEvent, type: MotionType) => {
		setPos({ x: e.clientX, y: e.clientY })
		setType(type)
	}

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.pointerType === 'mouse' && e.button !== 0) return
		e.currentTarget.setPointerCapture(e.pointerId)
		emitPointer(e, 'start')
	}

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!isActive || !oscillatorRef.current) return
		emitPointer(e, 'move')
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
						onPointerUp={handlePointerUp}
						onPointerCancel={handlePointerCancel}
					/>
				</div>
				<div className='w-full max-w-xl px-6 py-4 space-y-3 z-10 text-sm text-white'>
					<label className='block'>
						Release: {release.toFixed(2)}s
						<input
							type='range'
							min={0}
							max={3}
							step={0.01}
							value={release}
							onChange={(e) => setRelease(parseFloat(e.target.value))}
							className='w-full accent-gray-500'
						/>
					</label>
					<label className='block'>
						Reverb: {Math.ceil(reverbLevel * 100)}%
						<input
							type='range'
							min={0}
							max={1}
							step={0.01}
							value={reverbLevel}
							onChange={(e) => setReverbLevel(parseFloat(e.target.value))}
							className='w-full accent-gray-500'
						/>
					</label>
					<label className='block'>
						Volume: {Math.ceil(volume * 100)}%
						<input
							type='range'
							min={0}
							max={1}
							step={0.01}
							value={volume}
							onChange={(e) => setVolume(parseFloat(e.target.value))}
							className='w-full accent-gray-500'
						/>
					</label>
				</div>
			</div>
			<GlowEffect />
		</>
	)
}
