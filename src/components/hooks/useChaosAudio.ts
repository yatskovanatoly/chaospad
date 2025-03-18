import { useEffect, useRef, useState } from 'react'
import useWebSocket from './useWebSocket'
import { getSoundParamsFromXY } from '@/helpers/getSoundParams'
import { updateSoundFromPosition } from '@/helpers/updateSoundFromPosition'
import { createSoundChain } from '@/helpers/createSoundChain'

export function useChaosAudio() {
	const audioCtxRef = useRef<AudioContext | null>(null)
	const oscillatorRef = useRef<OscillatorNode | null>(null)
	const gainNodeRef = useRef<GainNode | null>(null)
	const convolverRef = useRef<ConvolverNode | null>(null)
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
		const {
			osc: oscillator,
			gain,
			convolver,
			convolverGain,
		} = createSoundChain(ctx, pos.x, pos.y)

		convolverGain.gain.value = reverbLevel
		gain.gain.value = volume

		oscillator.start()

		oscillatorRef.current = oscillator
		gainNodeRef.current = gain
		convolverRef.current = convolver

		updateSoundFromPosition(pos.x, pos.y, ctx, oscillator, gain)
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
		} else if (motionType === 'move' && isActive) {
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
