'use client'

import { attachAudioControllers } from '@/audio'
import { closeEngine } from '@/audio/engine/audioEngineSingleton'
import useWebSocket from '@/components/WsContext/useWebSocket'
import { padEventStore } from '@/state/padEventStore'
import { useEffect } from 'react'

export function ChaosBootstrap() {
	const { userId, color, send, subscribe } = useWebSocket()

	useEffect(() => {
		padEventStore.getState().wsBind({ selfUser: { userId, color }, wsSend: send })
		const detachAudio = attachAudioControllers()
		const unsubWs = subscribe((msg) => padEventStore.getState().applyRemoteEvent(msg))

		return () => {
			unsubWs()
			detachAudio()
			closeEngine()
		}
	}, [userId, color, send, subscribe])

	return null
}
