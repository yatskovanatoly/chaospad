import handleRemoteEvent from '@/components/ChaosPad/helpers/handleRemoteAudio'
import { useChaospadConfig } from '@/context/ChaospadConfigContext'
import type { Voice } from '@/components/AudioEngineContext/AudioEngine'
import { useAudioEngine } from '@/components/AudioEngineContext/useAudioEngine'
import { useEffect, useRef } from 'react'
import useWebSocket from '../../WsContext/useWebSocket'

export function useChaosWebSocket() {
	const engine = useAudioEngine()
	const { quantize, remoteRelease } = useChaospadConfig()
	const { message } = useWebSocket()
	const remoteUsersRef = useRef<RemoteUserType>({})

	useEffect(() => {
		for (const voice of Object.values(remoteUsersRef.current)) {
			voice.quantize = quantize
		}
	}, [quantize])

	useEffect(() => {
		if (!message) return
		const { userId, type, nx, ny } = message
		handleRemoteEvent({
			userId: userId!,
			type,
			nx,
			ny,
			engine,
			remoteUsersRef: remoteUsersRef.current,
			quantize,
			remoteRelease,
		})
	}, [engine, message, quantize, remoteRelease])
}

export type RemoteUserType = Record<string, Voice>
