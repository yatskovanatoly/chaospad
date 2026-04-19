'use client'

import { useEffect, useRef } from 'react'
import { padEventStore } from '../padEventStore'
import type { UserPadState } from '@/components/ChaosPad/padEvents.types'
import type { WireMessage } from '@/type'

export type PadEventsOptions = {
	onLocal?: (e: UserPadState) => void
	onRemote?: (e: WireMessage) => void
	localTickMs?: number
	localThrottleMs?: number
}

export function usePadEvents(options: PadEventsOptions) {
	const { onLocal, onRemote, localTickMs = 50, localThrottleMs = 50 } = options

	const onLocalRef = useRef(onLocal)
	onLocalRef.current = onLocal
	const onRemoteRef = useRef(onRemote)
	onRemoteRef.current = onRemote

	useEffect(() => {
		let prev = padEventStore.getState().local
		let intervalId: number | null = null
		let lastEmit = 0

		const teardownInterval = () => {
			if (intervalId != null) {
				window.clearInterval(intervalId)
				intervalId = null
			}
		}

		const handle = (local: UserPadState | null) => {
			if (!local || local.updatedAt === 0) {
				teardownInterval()
				return
			}
			const fn = onLocalRef.current
			if (fn) fn(local)
			if (local.type === 'stop') {
				teardownInterval()
				return
			}
			lastEmit = Date.now()
			teardownInterval()
			intervalId = window.setInterval(() => {
				const cur = padEventStore.getState().local
				if (!cur || cur.type === 'stop') return
				const now = Date.now()
				if (now - lastEmit < localThrottleMs) return
				lastEmit = now
				onLocalRef.current?.(cur)
			}, localTickMs)
		}

		handle(prev)

		const unsub = padEventStore.subscribe((s) => {
			if (s.local === prev) return
			prev = s.local
			handle(s.local)
		})

		return () => {
			unsub()
			teardownInterval()
		}
	}, [localTickMs, localThrottleMs])

	useEffect(() => {
		const unsub = padEventStore.getState().onRemote((msg) => {
			onRemoteRef.current?.(msg)
		})
		return unsub
	}, [])
}
