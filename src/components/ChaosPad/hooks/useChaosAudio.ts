import type { Voice } from '@/components/AudioEngineContext/AudioEngine'
import type { QuantizeMode } from '@/components/AudioEngineContext/helpers/quantizeFreq'
import { useAudioEngine } from '@/components/AudioEngineContext'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useEvents } from '../EventsContext/useEvents'
import { defaultSoundModeId, type SoundModeId } from '../sounds'
import useWebSocket from '../../WsContext/useWebSocket'

const WAVEFORM_THROTTLE_MS = 110

export function useChaosAudio() {
	const engine = useAudioEngine()
	const voiceRef = useRef<Voice | null>(null)
	const oscillatorRef = useRef<OscillatorNode | null>(null)
	const pendingMoveRef = useRef<{ nx: number; ny: number } | null>(null)
	const moveRafRef = useRef<number | null>(null)
	const [isActive, setIsActive] = useState(false)
	const [release, setRelease] = useState(0.5)
	const [reverbLevel, setReverbLevel] = useState(0.5)
	const [volume, setVolume] = useState(1)
	const [quantize, setQuantize] = useState<QuantizeMode>('chromatic')
	const [soundModeId, setSoundModeId] = useState<SoundModeId>(defaultSoundModeId)
	const { pos, type: motionType } = useWebSocket()
	const { padWaveform } = useEvents()
	const posRef = useRef(pos)
	posRef.current = pos

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
			setIsActive(true)
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
		setIsActive(false)
	}, [release])

	useEffect(() => {
		if (motionType === 'start' && !isActive) {
			startAudio()
		} else if (motionType === 'move' && isActive && pos) {
			pendingMoveRef.current = { nx: pos.nx, ny: pos.ny }
			if (moveRafRef.current == null) {
				moveRafRef.current = requestAnimationFrame(() => {
					moveRafRef.current = null
					const p = pendingMoveRef.current
					if (p && voiceRef.current) voiceRef.current.updatePosition(p.nx, p.ny)
				})
			}
		} else if (motionType === 'stop' && isActive) {
			if (moveRafRef.current != null) {
				cancelAnimationFrame(moveRafRef.current)
				moveRafRef.current = null
			}
			const p = pendingMoveRef.current
			if (p && voiceRef.current) voiceRef.current.updatePosition(p.nx, p.ny)
			pendingMoveRef.current = null
			stopAudio()
		}
	}, [isActive, motionType, pos, startAudio, stopAudio])

	useEffect(() => {
		return () => {
			if (moveRafRef.current != null) cancelAnimationFrame(moveRafRef.current)
		}
	}, [])

	useEffect(() => {
		const v = voiceRef.current
		if (!v || !isActive) return
		if (soundModeId === 'sine') {
			v.setSoundMode('sine')
		} else {
			v.setSoundMode('padWaveform', padWaveform.getBins())
			const p = posRef.current
			if (p) v.updatePosition(p.nx, p.ny)
		}
	}, [soundModeId, isActive, padWaveform])

	useEffect(() => {
		if (!isActive || soundModeId !== 'padWaveform') return
		let timeout: ReturnType<typeof setTimeout> | null = null
		const flush = () => {
			timeout = null
			const voice = voiceRef.current
			if (!voice) return
			voice.setSoundMode('padWaveform', padWaveform.getBins())
			const p = posRef.current
			if (p) voice.updatePosition(p.nx, p.ny)
		}
		const unsub = padWaveform.subscribe(() => {
			if (!voiceRef.current) return
			if (timeout) return
			timeout = setTimeout(flush, WAVEFORM_THROTTLE_MS)
		})
		return () => {
			unsub()
			if (timeout) clearTimeout(timeout)
		}
	}, [isActive, soundModeId, padWaveform])

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
		quantize,
		setQuantize,
		oscillatorRef,
		voiceRef,
		soundModeId,
		setSoundModeId,
	}
}
