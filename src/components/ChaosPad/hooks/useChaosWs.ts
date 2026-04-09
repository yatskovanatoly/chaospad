import handleRemoteEvent from '@/components/ChaosPad/helpers/handleRemoteAudio'
import type { Voice } from '@/components/AudioEngineContext/AudioEngine'
import { useAudioEngine } from '@/components/AudioEngineContext/useAudioEngine'
import { useEffect, useRef } from 'react'
import useWebSocket from '../../WsContext/useWebSocket'

export function useChaosWebSocket() {
	const engine = useAudioEngine()
	const { message } = useWebSocket()
	const remoteUsersRef = useRef<RemoteUserType>({})

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
		})
	}, [engine, message])
}

export type RemoteUserType = Record<string, Voice>
