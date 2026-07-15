import { useChaospadConfig } from '@/context/ChaospadConfigContext'
import type { Voice } from '@/components/AudioEngineContext/AudioEngine'
import { useAudioEngine } from '@/components/AudioEngineContext'
import { useCallback, useEffect, useRef } from 'react'
import useWebSocket from '../../WsContext/useWebSocket'

export function useChaosAudio() {
	const engine = useAudioEngine()
	const { volume, reverbLevel, release, quantize } = useChaospadConfig()
	const voiceRef = useRef<Voice | null>(null)
	const oscillatorRef = useRef<OscillatorNode | null>(null)
	const isActiveRef = useRef(false)
	const { pos, type: motionType } = useWebSocket()

	useEffect(() => {
		engine.setVolume(volume)
		engine.setReverbLevel(reverbLevel)
	}, [engine, volume, reverbLevel])

	useEffect(() => {
		if (voiceRef.current) voiceRef.current.quantize = quantize
	}, [quantize])

	const startAudio = useCallback(() => {
		engine.setVolume(volume)
		engine.setReverbLevel(reverbLevel)
		const run = () => {
			const voice = engine.createVoice(pos ?? { nx: 0, ny: 0 }, quantize)
			voiceRef.current = voice
			oscillatorRef.current = voice.oscillator
			isActiveRef.current = true
		}
		if (engine.ctx.state === 'suspended') {
			void engine.ctx.resume().then(run)
		} else {
			run()
		}
	}, [engine, pos, quantize, reverbLevel, volume])

	const stopAudio = useCallback(() => {
		if (voiceRef.current) {
			voiceRef.current.stop(release)
			voiceRef.current = null
			oscillatorRef.current = null
		}
		isActiveRef.current = false
	}, [release])

	useEffect(() => {
		if (motionType === 'start' && !isActiveRef.current) {
			startAudio()
		} else if (motionType === 'move' && isActiveRef.current && pos) {
			voiceRef.current?.updatePosition(pos.nx, pos.ny)
		} else if (motionType === 'stop' && isActiveRef.current) {
			stopAudio()
		}
	}, [motionType, pos, startAudio, stopAudio])

	return {
		isActive: isActiveRef.current,
		oscillatorRef,
	}
}
