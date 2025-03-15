import { useCallback, useEffect, useMemo, useRef } from 'react'
import useWebSocket from './useWebSocket'

export function useChaosWebSocket() {
	const audioCtxRef = useRef<AudioContext | null>(null)
	const { message } = useWebSocket()

	const remoteUsersRef = useRef<
		Record<string, { osc: OscillatorNode; gain: GainNode }>
	>({})

	useEffect(() => {
		if (!audioCtxRef.current) {
			audioCtxRef.current = new AudioContext()
		}
	}, [])

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

	const updateOsc = (
		x: number,
		y: number,
		osc: OscillatorNode,
		gain: GainNode
	) => {
		const freq = 100 + x * 1000
		const vol = 1 - y
		osc.frequency.setValueAtTime(freq, audioCtxRef.current!.currentTime)
		gain.gain.setValueAtTime(vol * 0.3, audioCtxRef.current!.currentTime)
	}

	const handleRemoteEvent = useCallback(
		(data: { userId: string; type: string; x: number; y: number }) => {
			if (!audioCtxRef.current) {
				audioCtxRef.current = new AudioContext()
			}
			const ctx = audioCtxRef.current
			const { userId: id, type, x, y } = data

			if (type === 'start') {
				const osc = ctx.createOscillator()
				const gain = ctx.createGain()
				const convolver = ctx.createConvolver()
				convolver.buffer = createImpulseResponse(ctx)
				osc.type = 'sine'

				osc.connect(gain).connect(convolver).connect(ctx.destination)
				osc.start()

				remoteUsersRef.current[id] = { osc, gain }

				updateOsc(x, y, osc, gain)
			}

			if (type === 'move') {
				const user = remoteUsersRef.current[id]
				if (user) updateOsc(x, y, user.osc, user.gain)
			}

			if (type === 'stop') {
				const user = remoteUsersRef.current[id]
				if (user) {
					user.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
					user.osc.stop(ctx.currentTime + 0.6)
					delete remoteUsersRef.current[id]
				}
			}
		},
		[audioCtxRef]
	)

	useEffect(() => {
		if (!message) return
		const { userId, type, x, y } = message
		console.log('effect', message)
		handleRemoteEvent({ userId: userId!, type, x, y })
	}, [message, handleRemoteEvent])
}
