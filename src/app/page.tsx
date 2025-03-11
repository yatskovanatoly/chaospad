'use client'
import { useRef, useState } from 'react'

export default function ChaosPad() {
	const audioCtxRef = useRef<AudioContext | null>(null)
	const oscillatorRef = useRef<OscillatorNode | null>(null)
	const gainNodeRef = useRef<GainNode | null>(null)
	const convolverRef = useRef<ConvolverNode | null>(null)
	const [isActive, setIsActive] = useState(false)

	// ADSR + Reverb state
	const [release, setRelease] = useState(0.5)
	const [reverbLevel, setReverbLevel] = useState(0.5)

	const createImpulseResponse = (
		ctx: AudioContext,
		duration = 2,
		decay = 2
	) => {
		const rate = ctx.sampleRate
		const length = rate * duration
		const impulse = ctx.createBuffer(2, length, rate)
		for (let c = 0; c < 2; c++) {
			const channel = impulse.getChannelData(c)
			for (let i = 0; i < length; i++) {
				channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
			}
		}
		return impulse
	}

	const updateSoundFromPosition = (clientX: number, clientY: number) => {
		const x = clientX / window.innerWidth
		const y = clientY / window.innerHeight

		const freq = 100 + x * 1000
		const amp = 1 - y

		if (oscillatorRef.current) {
			oscillatorRef.current.frequency.setValueAtTime(
				freq,
				audioCtxRef.current!.currentTime
			)
		}

		// ADSR attack/decay envelope
		if (gainNodeRef.current && audioCtxRef.current) {
			const now = audioCtxRef.current.currentTime
			const g = gainNodeRef.current.gain
			g.cancelScheduledValues(now)
			g.setValueAtTime(0, now)
			g.linearRampToValueAtTime(amp * 0.5, now)
		}
	}

	const startAudio = (e: React.MouseEvent | React.TouchEvent) => {
		if (!audioCtxRef.current) {
			audioCtxRef.current = new window.AudioContext()
		}

		const ctx = audioCtxRef.current

		const oscillator = ctx.createOscillator()
		const gainNode = ctx.createGain()
		const convolver = ctx.createConvolver()
		const convolverGain = ctx.createGain()

		convolver.buffer = createImpulseResponse(ctx)
		convolverGain.gain.value = reverbLevel

		// Connect nodes
		oscillator.connect(gainNode)
		gainNode.connect(ctx.destination) // dry
		gainNode.connect(convolver)
		convolver.connect(convolverGain)
		convolverGain.connect(ctx.destination) // wet

		oscillator.type = 'sine'
		gainNode.gain.value = 0

		oscillator.start()

		oscillatorRef.current = oscillator
		gainNodeRef.current = gainNode
		convolverRef.current = convolver

		// Get position + trigger sound
		const pos = 'touches' in e ? e.touches[0] : e
		updateSoundFromPosition(pos.clientX, pos.clientY)

		setIsActive(true)
	}

	const stopAudio = () => {
		if (gainNodeRef.current && audioCtxRef.current) {
			const now = audioCtxRef.current.currentTime
			const g = gainNodeRef.current.gain
			g.cancelScheduledValues(now)
			g.setValueAtTime(g.value, now)
			g.linearRampToValueAtTime(0, now + release) // release
		}

		// Stop oscillator after release time
		setTimeout(() => {
			oscillatorRef.current?.stop()
			oscillatorRef.current?.disconnect()
			gainNodeRef.current?.disconnect()
			convolverRef.current?.disconnect()

			oscillatorRef.current = null
			gainNodeRef.current = null
			convolverRef.current = null
		}, (release + 0.1) * 10000)

		setIsActive(false)
	}

	const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
		if (!isActive || !oscillatorRef.current) return

		const pos = 'touches' in e ? e.touches[0] : e
		updateSoundFromPosition(pos.clientX, pos.clientY)
	}

	return (
		<div className='w-full h-screen bg-gradient-to-br from-black to-gray-900 text-white flex flex-col items-center justify-center select-none'>
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

			<div className='bg-black/80 w-full max-w-xl px-6 py-4 space-y-3 text-sm'>
				{/* <label className='block'>
					Attack: {attack.toFixed(2)}s
					<input
						type='range'
						min={0}
						max={2}
						step={0.01}
						value={attack}
						onChange={(e) => setAttack(parseFloat(e.target.value))}
						className='w-full'
					/>
				</label>
				<label className='block'>
					Decay: {decay.toFixed(2)}s
					<input
						type='range'
						min={0}
						max={2}
						step={0.01}
						value={decay}
						onChange={(e) => setDecay(parseFloat(e.target.value))}
						className='w-full'
					/>
				</label> */}
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
					Reverb: {reverbLevel.toFixed(2)}
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
			</div>
		</div>
	)
}
