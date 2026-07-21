import { useChaospadConfig } from '@/context/ChaospadConfigContext'
import type { Voice } from '@/components/AudioEngineContext/AudioEngine'
import { useAudioEngine } from '@/components/AudioEngineContext'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import useWebSocket from '../../WsContext/useWebSocket'

export function useChaosAudio() {
	const engine = useAudioEngine()
	const { volume, reverbLevel, release, quantize } = useChaospadConfig()
	const { subscribeMotion } = useWebSocket()
	const voiceRef = useRef<Voice | null>(null)
	const isActiveRef = useRef(false)
	const pendingStartRef = useRef(false)

	useEffect(() => {
		engine.setVolume(volume)
		engine.setReverbLevel(reverbLevel)
	}, [engine, volume, reverbLevel])

	useEffect(() => {
		if (voiceRef.current) voiceRef.current.quantize = quantize
	}, [quantize])

	const startAudio = useCallback(
		(position: { nx: number; ny: number }) => {
			pendingStartRef.current = true
			engine.setVolume(volume)
			engine.setReverbLevel(reverbLevel)
			const run = () => {
				if (!pendingStartRef.current) return
				const voice = engine.createVoice(position, quantize)
				voiceRef.current = voice
				isActiveRef.current = true
			}
			try {
				engine.unlock()
			} finally {
				run()
			}
		},
		[engine, quantize, reverbLevel, volume],
	)

	const stopAudio = useCallback(() => {
		pendingStartRef.current = false
		if (voiceRef.current) {
			voiceRef.current.stop(release)
			voiceRef.current = null
		}
		isActiveRef.current = false
	}, [release])

	useLayoutEffect(() => {
		return subscribeMotion(({ pos, type }) => {
			if (type === 'start' && pos) {
				if (!isActiveRef.current) startAudio(pos)
				return
			}
			if (type === 'move' && isActiveRef.current && pos) {
				voiceRef.current?.updatePosition(pos.nx, pos.ny)
				return
			}
			if (type === 'stop' && isActiveRef.current) {
				stopAudio()
			}
		})
	}, [startAudio, stopAudio, subscribeMotion])

	return {
		isActive: isActiveRef.current,
	}
}
