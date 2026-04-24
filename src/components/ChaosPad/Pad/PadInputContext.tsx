'use client'

import { pixelToNormalizedInRect } from '@/audio/engine/helpers/getSoundParams'
import { gestureSpeed01FromSegment } from '@/pad/padMotionMetrics'
import { padEventStore } from '@/state/padEventStore'
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	type PointerEvent as ReactPointerEvent,
} from 'react'
import { usePadSurface } from './PadSurfaceContext'

type PadHandlers = {
	onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void
	onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void
	onPointerLeave: (e: ReactPointerEvent<HTMLElement>) => void
	onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void
	onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void
}

type PadInputValue = {
	bindPadHandlers: () => PadHandlers
}

const PadInputContext = createContext<PadInputValue | null>(null)

export function PadInputProvider({ children }: { children: React.ReactNode }) {
	const { padRef } = usePadSurface()
	const pressedRef = useRef(false)
	const gestureLastRef = useRef<{ nx: number; ny: number; t: number } | null>(null)

	const normFromEvent = useCallback(
		(e: ReactPointerEvent<HTMLElement>) => {
			const el = padRef.current
			if (!el) return null
			return pixelToNormalizedInRect(e.clientX, e.clientY, el.getBoundingClientRect())
		},
		[padRef],
	)

	const releaseCaptureIfHeld = (e: ReactPointerEvent<HTMLElement>) => {
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId)
		}
	}

	const bindPadHandlers = useCallback((): PadHandlers => {
		const pad = padEventStore.getState()
		return {
			onPointerDown(e) {
				if (e.pointerType === 'mouse' && e.button !== 0) return
				e.currentTarget.setPointerCapture(e.pointerId)
				const n = normFromEvent(e)
				if (!n) return
				pressedRef.current = true
				const t = performance.now()
				gestureLastRef.current = { nx: n.nx, ny: n.ny, t }
				pad.publishGesture({ type: 'start', nx: n.nx, ny: n.ny, gestureSpeed01: 0, dtMs: 0 })
			},
			onPointerMove(e) {
				const n = normFromEvent(e)
				if (!n) return
				const isPress = e.pointerType !== 'mouse' || e.buttons !== 0
				if (isPress && pressedRef.current) {
					const p = gestureLastRef.current
					if (!p) return
					const now = performance.now()
					const dtMs = now - p.t
					const gestureSpeed01 = gestureSpeed01FromSegment(
						{ nx: p.nx, ny: p.ny },
						{ nx: n.nx, ny: n.ny },
						dtMs,
					)
					gestureLastRef.current = { nx: n.nx, ny: n.ny, t: now }
					pad.publishGesture({ type: 'move', nx: n.nx, ny: n.ny, gestureSpeed01, dtMs })
				} else {
					pad.publishHover({ nx: n.nx, ny: n.ny })
				}
			},
			onPointerLeave() {
				pad.publishHover(null)
			},
			onPointerUp(e) {
				if (e.pointerType === 'mouse' && e.button !== 0) return
				releaseCaptureIfHeld(e)
				if (!pressedRef.current) return
				pressedRef.current = false
				gestureLastRef.current = null
				const n = normFromEvent(e)
				if (!n) return
				pad.publishGesture({ type: 'stop', nx: n.nx, ny: n.ny, gestureSpeed01: 0, dtMs: 0 })
			},
			onPointerCancel(e) {
				releaseCaptureIfHeld(e)
				if (!pressedRef.current) return
				pressedRef.current = false
				gestureLastRef.current = null
				const n = normFromEvent(e)
				if (!n) return
				pad.publishGesture({ type: 'stop', nx: n.nx, ny: n.ny, gestureSpeed01: 0, dtMs: 0 })
			},
		}
	}, [normFromEvent])

	const value = useMemo(() => ({ bindPadHandlers }), [bindPadHandlers])

	return <PadInputContext.Provider value={value}>{children}</PadInputContext.Provider>
}

export function usePadInput() {
	const ctx = useContext(PadInputContext)
	if (!ctx) throw new Error('usePadInput must be used within PadInputProvider')
	return ctx
}
