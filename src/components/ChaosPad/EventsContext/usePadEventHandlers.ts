import { useContext, useEffect, useRef } from 'react'
import type { RemotePadEvent, VisEvent } from './padEvents.types'
import { EventsContext } from './EventsContext'

export type PadEventHandlersOptions = {
	onLocal?: (event: VisEvent) => void
	onRemote?: (event: RemotePadEvent) => void
	localTickMs?: number
	localThrottleMs?: number
}

/** Подписка на локальные и удалённые события пада (start/move/stop); для waveform используйте usePadWaveform / emitPadHover. */
export function usePadEventHandlers(options: PadEventHandlersOptions) {
	const { onLocal, onRemote, localTickMs = 50, localThrottleMs = 50 } = options
	const ctx = useContext(EventsContext)
	if (!ctx) throw new Error('usePadEventHandlers must be used within EventsContextProvider')
	const { local, remote } = ctx
	const localRef = useRef(local)
	localRef.current = local

	const onLocalRef = useRef(onLocal)
	onLocalRef.current = onLocal
	const onRemoteRef = useRef(onRemote)
	onRemoteRef.current = onRemote

	const lastLocalThrottle = useRef(0)

	useEffect(() => {
		const fn = onLocalRef.current
		if (!fn || !local) return
		if (local.type === 'stop') {
			fn(local)
			return
		}
		lastLocalThrottle.current = Date.now()
		fn(local)
		const id = window.setInterval(() => {
			const l = localRef.current
			if (!l || l.type === 'stop') return
			const now = Date.now()
			if (now - lastLocalThrottle.current < localThrottleMs) return
			lastLocalThrottle.current = now
			fn(l)
		}, localTickMs)
		return () => window.clearInterval(id)
	}, [local, localTickMs, localThrottleMs])

	useEffect(() => {
		const fn = onRemoteRef.current
		if (!fn || !remote) return
		fn(remote)
	}, [remote])
}
