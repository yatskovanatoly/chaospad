import { useRef, useState } from 'react'
import { useWebSocket } from '../WsContext'

export function useChaosAudio() {
	const audioCtxRef = useRef<AudioContext | null>(null)
	const oscillatorRef = useRef<OscillatorNode | null>(null)
	const gainNodeRef = useRef<GainNode | null>(null)
	const convolverRef = useRef<ConvolverNode | null>(null)
	const [isActive, setIsActive] = useState(false)

	const [release, setRelease] = useState(0.5)
	const [reverbLevel, setReverbLevel] = useState(0.5)

	const { sendEvent } = useWebSocket()

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

	const updateSoundFromPosition = (
		clientX: number,
		clientY: number,
		send: boolean = false
	) => {
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

		if (gainNodeRef.current && audioCtxRef.current) {
			const now = audioCtxRef.current.currentTime
			const g = gainNodeRef.current.gain
			g.cancelScheduledValues(now)
			g.setValueAtTime(0, now)
			g.linearRampToValueAtTime(amp * 0.5, now)
		}

		if (send) sendEvent('move', x, y)
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

		oscillator.connect(gainNode)
		gainNode.connect(ctx.destination)
		gainNode.connect(convolver)
		convolver.connect(convolverGain)
		convolverGain.connect(ctx.destination)

		oscillator.type = 'sine'
		gainNode.gain.value = 0

		oscillator.start()

		oscillatorRef.current = oscillator
		gainNodeRef.current = gainNode
		convolverRef.current = convolver

		const pos = 'touches' in e ? e.touches[0] : e
		updateSoundFromPosition(pos.clientX, pos.clientY, true)
		const x = pos.clientX / window.innerWidth
		const y = pos.clientY / window.innerHeight
		sendEvent('start', x, y)

		setIsActive(true)
	}

	const stopAudio = () => {
		if (gainNodeRef.current && audioCtxRef.current) {
			const now = audioCtxRef.current.currentTime
			const g = gainNodeRef.current.gain
			g.cancelScheduledValues(now)
			g.setValueAtTime(g.value, now)
			g.linearRampToValueAtTime(0, now + release)
		}

		setTimeout(() => {
			oscillatorRef.current?.stop()
			oscillatorRef.current?.disconnect()
			gainNodeRef.current?.disconnect()
			convolverRef.current?.disconnect()

			oscillatorRef.current = null
			gainNodeRef.current = null
			convolverRef.current = null
		}, (release + 0.1) * 1000)
		sendEvent('stop', 0, 0)
		setIsActive(false)
	}

	const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
		if (!isActive || !oscillatorRef.current) return
		const pos = 'touches' in e ? e.touches[0] : e
		updateSoundFromPosition(pos.clientX, pos.clientY, true)
	}

	return {
		startAudio,
		stopAudio,
		handleMove,
		isActive,
		setRelease,
		setReverbLevel,
		release,
		reverbLevel,
	}
}
