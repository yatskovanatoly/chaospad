import createSoundChain from '@/helpers/sound/createSoundChain'
import { updateSoundFromPosition } from '@/helpers/sound/updateSoundFromPosition'
import { useEffect, useRef, useState } from 'react'
import useWebSocket from './useWebSocket'

export function useChaosAudio() {
	const audioCtxRef = useRef<AudioContext | null>(null)
	const oscillatorRef = useRef<OscillatorNode | null>(null)
	const gainNodeRef = useRef<GainNode | null>(null)
	const convolverRef = useRef<ConvolverNode | null>(null)
	const convolverGainRef = useRef<GainNode | null>(null)
	const [isActive, setIsActive] = useState(false)
	const [release, setRelease] = useState(0.5)
	const [reverbLevel, setReverbLevel] = useState(0.5)
	const [volume, setVolume] = useState(1)
	const { pos, type: motionType } = useWebSocket()

	const startAudio = () => {
		if (!audioCtxRef.current) {
			audioCtxRef.current = new window.AudioContext()
		}

		const ctx = audioCtxRef.current

		// Ensure the AudioContext is resumed
		if (ctx.state === 'suspended') {
			ctx.resume().then(() => {
				console.log('AudioContext resumed')
				startOscillator(ctx)
			})
		} else {
			startOscillator(ctx)
		}
	}

	const startOscillator = (ctx: AudioContext) => {
		const { oscillator, gainNode, convolver, convolverGain } = createSoundChain(
			{ ctx, reverbLevel, volume, position: pos }
		)

		pos && updateSoundFromPosition(pos.x, pos.y, ctx, oscillator, gainNode)
		setIsActive(true)

		oscillatorRef.current = oscillator
		gainNodeRef.current = gainNode
		convolverRef.current = convolver
		convolverGainRef.current = convolverGain
	}

	const stopAudio = () => {
		if (gainNodeRef.current && audioCtxRef.current) {
			const now = audioCtxRef.current.currentTime
			const g = gainNodeRef.current.gain
			g.cancelScheduledValues(now)
			g.setValueAtTime(g.value, now)
			g.linearRampToValueAtTime(0, now + release)
		}

		audioCtxRef.current?.addEventListener('statechange', () => {
			if (audioCtxRef.current?.state === 'running') {
				oscillatorRef.current?.stop()
				oscillatorRef.current?.disconnect()
				gainNodeRef.current?.disconnect()
				convolverRef.current?.disconnect()
				oscillatorRef.current = null
				gainNodeRef.current = null
				convolverRef.current = null
			}
		})

		setIsActive(false)
	}

	// Respond to motionType and pos
	useEffect(() => {
		if (motionType === 'start' && !isActive) {
			startAudio()
		} else if (motionType === 'move' && isActive && pos) {
			updateSoundFromPosition(
				pos.x,
				pos.y,
				audioCtxRef.current,
				oscillatorRef.current,
				gainNodeRef.current
			)
		} else if (motionType === 'stop' && isActive) {
			stopAudio()
		}
	}, [motionType, pos, isActive])

	return {
		startAudio,
		stopAudio,
		isActive,
		setRelease,
		setReverbLevel,
		release,
		reverbLevel,
		volume,
		setVolume,
		oscillatorRef,
	}
}
