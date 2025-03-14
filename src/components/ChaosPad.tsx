'use client'

import { useChaosAudio } from './hooks/useChaosAudio'
import { useChaosWebSocket } from './hooks/useChaosWs'

export default function ChaosPad() {
	const {
		startAudio,
		stopAudio,
		handleMove,
		setRelease,
		setReverbLevel,
		release,
		reverbLevel,
		volume,
		setVolume,
	} = useChaosAudio()

	useChaosWebSocket()

	return (
		<div className='w-full h-screen bg-gradient-to-br text-black inverc from-red-200 via-green-200 to-blue-200 flex flex-col items-center justify-center select-none'>
			<div
				className='w-full h-full flex-1'
				onMouseDown={startAudio}
				onMouseUp={stopAudio}
				onMouseMove={handleMove}
				onTouchStart={startAudio}
				onTouchEnd={stopAudio}
				onTouchMove={handleMove}
			>
				<div className='text-center pt-10 pointer-events-none'>
					<h1 className='text-3xl font-bold'>ChaosPad 🎛️</h1>
					<p className='opacity-70'>Touch & move — sound follows you</p>
				</div>
			</div>

			<div className='w-full max-w-xl px-6 py-4 space-y-3 text-sm'>
				<label className='block'>
					Release: {release.toFixed(2)}s
					<input
						type='range'
						min={0}
						max={3}
						step={0.01}
						value={release}
						onChange={(e) => setRelease(parseFloat(e.target.value))}
						className='w-full'
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
						className='w-full'
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
						className='w-full'
					/>
				</label>
			</div>
		</div>
	)
}
