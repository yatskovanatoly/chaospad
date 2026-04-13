import handleRemoteEvent from '@/components/ChaosPad/helpers/handleRemoteAudio'
import type { Voice } from '@/components/AudioEngineContext/AudioEngine'
import type { QuantizeMode } from '@/components/AudioEngineContext/helpers/quantizeFreq'
import { useAudioEngine } from '@/components/AudioEngineContext/useAudioEngine'
import { useEffect, useRef } from 'react'
import useWebSocket from '../../WsContext/useWebSocket'

export function useChaosWebSocket(quantize: QuantizeMode) {
	const engine = useAudioEngine()
	const { message } = useWebSocket()
	const remoteUsersRef = useRef<RemoteUserType>({})

	useEffect(() => {
		for (const voice of Object.values(remoteUsersRef.current)) {
			voice.quantize = quantize
		}
	}, [quantize])

	useEffect(() => {
		if (!message) return
		const { userId, type, x, y } = message
		handleRemoteEvent({
			userId: userId!,
			type,
			x,
			y,
			engine,
			remoteUsersRef: remoteUsersRef.current,
			quantize,
		})
	}, [engine, message, quantize])
}

export type RemoteUserType = Record<string, Voice>
