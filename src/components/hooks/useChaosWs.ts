import handleRemoteEvent from '@/helpers/sound/handleRemoteAudio'
import { useEffect, useRef } from 'react'
import useWebSocket from './useWebSocket'

export function useChaosWebSocket() {
	const audioCtxRef = useRef<AudioContext | null>(null)
	const { message } = useWebSocket()
	const remoteUsersRef = useRef<RemoteUserType>({})

	useEffect(() => {
		if (!audioCtxRef.current) {
			audioCtxRef.current = new AudioContext()
		}
	}, [])

	useEffect(() => {
		if (!message) return
		const { userId, type, x, y } = message
		handleRemoteEvent({
			userId: userId!,
			type,
			x,
			y,
			ctx: audioCtxRef.current,
			remoteUsersRef: remoteUsersRef.current,
		})
	}, [message])
}

export type RemoteUserType = Record<
	string,
	{ osc: OscillatorNode; gain: GainNode }
>
