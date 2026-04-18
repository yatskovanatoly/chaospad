import handleRemoteEvent, { applyVoiceSoundMode } from '@/components/ChaosPad/helpers/handleRemoteAudio'
import { applySegment, PAD_WAVEFORM_BINS } from '@/components/ChaosPad/EventsContext/padWaveform'
import type { SoundModeId } from '@/components/ChaosPad/sounds'
import type { Voice } from '@/components/AudioEngineContext/AudioEngine'
import type { QuantizeMode } from '@/components/AudioEngineContext/helpers/quantizeFreq'
import { useAudioEngine } from '@/components/AudioEngineContext/useAudioEngine'
import { useCallback, useEffect, useRef } from 'react'
import useWebSocket from '../../WsContext/useWebSocket'

const REMOTE_WAVE_THROTTLE_MS = 60

export function useChaosWebSocket(quantize: QuantizeMode, soundModeId: SoundModeId) {
	const engine = useAudioEngine()
	const { message } = useWebSocket()
	const remoteUsersRef = useRef<RemoteUserType>({})
	const remoteBinsRef = useRef<Record<string, Float32Array>>({})
	const remoteWaveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>({})
	const remoteLastPosRef = useRef<Record<string, { nx: number; ny: number }>>({})

	const getBinsForUser = useCallback((userId: string) => remoteBinsRef.current[userId], [])

	useEffect(() => {
		for (const [uid, voice] of Object.entries(remoteUsersRef.current)) {
			applyVoiceSoundMode(voice, soundModeId, getBinsForUser, uid)
		}
	}, [soundModeId, getBinsForUser])

	useEffect(() => {
		for (const voice of Object.values(remoteUsersRef.current)) {
			voice.quantize = quantize
		}
	}, [quantize])

	useEffect(() => {
		if (!message) return
		const { userId, type, nx, ny } = message
		const uid = userId!

		if (type === 'start') {
			remoteBinsRef.current[uid] = new Float32Array(PAD_WAVEFORM_BINS)
			delete remoteLastPosRef.current[uid]
		}
		if (type === 'start' || type === 'move') {
			if (!remoteBinsRef.current[uid]) {
				remoteBinsRef.current[uid] = new Float32Array(PAD_WAVEFORM_BINS)
			}
			const prev = remoteLastPosRef.current[uid] ?? null
			applySegment(
				remoteBinsRef.current[uid],
				prev?.nx ?? nx,
				prev?.ny ?? ny,
				nx,
				ny,
			)
			remoteLastPosRef.current[uid] = { nx, ny }
		}

		if (type === 'stop') {
			const t = remoteWaveTimersRef.current[uid]
			if (t) clearTimeout(t)
			delete remoteWaveTimersRef.current[uid]
			delete remoteBinsRef.current[uid]
			delete remoteLastPosRef.current[uid]
		}

		handleRemoteEvent({
			userId: uid,
			type,
			nx,
			ny,
			engine,
			remoteUsersRef: remoteUsersRef.current,
			quantize,
			soundModeId,
			getBinsForUser,
		})

		if (soundModeId === 'padWaveform' && type === 'move') {
			const v = remoteUsersRef.current[uid]
			if (!v) return
			const existing = remoteWaveTimersRef.current[uid]
			if (existing) clearTimeout(existing)
			remoteWaveTimersRef.current[uid] = setTimeout(() => {
				remoteWaveTimersRef.current[uid] = undefined
				const voice = remoteUsersRef.current[uid]
				const bins = remoteBinsRef.current[uid]
				if (voice && bins) applyVoiceSoundMode(voice, soundModeId, getBinsForUser, uid)
			}, REMOTE_WAVE_THROTTLE_MS)
		}
	}, [engine, message, quantize, soundModeId, getBinsForUser])

	return { remoteUsersRef }
}

export type RemoteUserType = Record<string, Voice>
