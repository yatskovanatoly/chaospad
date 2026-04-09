import type { Voice } from '@/components/AudioEngineContext/AudioEngine'
import { useAudioEngine } from '@/components/AudioEngineContext'
import { useEffect, useRef, useState } from 'react'
import useWebSocket from '../../WsContext/useWebSocket'

export function useChaosAudio() {
	const engine = useAudioEngine()
	const voiceRef = useRef<Voice | null>(null)
	const oscillatorRef = useRef<OscillatorNode | null>(null)
	const [isActive, setIsActive] = useState(false)
	const [release, setRelease] = useState(0.5)
	const [reverbLevel, setReverbLevel] = useState(0.5)
	const [volume, setVolume] = useState(1)
	const { pos, type: motionType } = useWebSocket()

	useEffect(() => {
		engine.setVolume(volume)
		engine.setReverbLevel(reverbLevel)
	}, [engine, volume, reverbLevel])

	const startAudio = () => {
		engine.setVolume(volume)
		engine.setReverbLevel(reverbLevel)
		const run = () => {
			const voice = engine.createVoice(pos ?? { x: 0, y: 0 })
			voiceRef.current = voice
			oscillatorRef.current = voice.oscillator
			setIsActive(true)
		}
		if (engine.ctx.state === 'suspended') {
			void engine.ctx.resume().then(run)
		} else {
			run()
		}
	}

	const stopAudio = () => {
		if (voiceRef.current) {
			voiceRef.current.stop(release)
			voiceRef.current = null
			oscillatorRef.current = null
		}
		setIsActive(false)
	}

	useEffect(() => {
		if (motionType === 'start' && !isActive) {
			startAudio()
		} else if (motionType === 'move' && isActive && pos) {
			voiceRef.current?.updatePosition(pos.x, pos.y)
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
