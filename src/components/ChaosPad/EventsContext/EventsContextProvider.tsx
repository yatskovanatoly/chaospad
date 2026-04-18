'use client'

import useWebSocket from '@/components/WsContext/useWebSocket'
import { useCallback, useMemo, useRef } from 'react'
import { EventsContext } from './EventsContext'
import { createPadWaveformStore } from './padWaveform'

export function EventsContextProvider({ children }: { children: React.ReactNode }) {
	const { pos, type, color, message } = useWebSocket()
	const padWaveformRef = useRef<ReturnType<typeof createPadWaveformStore> | null>(null)
	if (!padWaveformRef.current) padWaveformRef.current = createPadWaveformStore()
	const padWaveform = padWaveformRef.current
	const lastPadHoverRef = useRef<{ nx: number; ny: number } | null>(null)

	const emitPadHover = useCallback(
		(v: { nx: number; ny: number } | null) => {
			if (!v) {
				lastPadHoverRef.current = null
				return
			}
			padWaveform.apply(lastPadHoverRef.current, v.nx, v.ny)
			lastPadHoverRef.current = { nx: v.nx, ny: v.ny }
		},
		[padWaveform],
	)

	const local = useMemo(
		() => (pos ? { nx: pos.nx, ny: pos.ny, color, type } : null),
		[pos, color, type],
	)

	const remote = useMemo(
		() =>
			message
				? {
						nx: message.nx,
						ny: message.ny,
						color: message.color,
						type: message.type,
						userId: message.userId!,
					}
				: undefined,
		[message],
	)

	return (
		<EventsContext.Provider value={{ local, remote, padWaveform, emitPadHover }}>
			{children}
		</EventsContext.Provider>
	)
}
