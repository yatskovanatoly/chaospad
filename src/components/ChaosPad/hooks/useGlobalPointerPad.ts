import { useChaospadConfig } from '@/context/ChaospadConfigContext'
import useWebSocket from '@/components/WsContext/useWebSocket'
import type { MotionType } from '@/components/WsContext/WsContextProvider'
import type { Position } from '@/type'
import { useEffect, useRef, type RefObject } from 'react'

const DRAG_THRESHOLD_PX = 10
const CLICK_SUPPRESS_MS = 400

const PASSIVE_CAPTURE = { capture: true, passive: true } as const
const ACTIVE_CAPTURE = { capture: true, passive: false } as const

type PointerSession = {
	startX: number
	startY: number
	lastX: number
	lastY: number
	isDrag: boolean
}

export function useGlobalPointerPad(
	rootRef: RefObject<HTMLDivElement | null>,
	surfaceRef: RefObject<HTMLDivElement | null>,
	passThrough: boolean,
) {
	const { emitMotion } = useWebSocket()
	const { glowIntervalMs } = useChaospadConfig()
	const emitMotionRef = useRef(emitMotion)
	const sessionsRef = useRef(new Map<number, PointerSession>())
	const suppressClickUntilRef = useRef(0)
	const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	emitMotionRef.current = emitMotion

	useEffect(() => {
		const stopHoldHeartbeat = () => {
			if (holdIntervalRef.current == null) return
			clearInterval(holdIntervalRef.current)
			holdIntervalRef.current = null
		}

		const emit = (clientX: number, clientY: number, type: MotionType) => {
			const rect = rootRef.current?.getBoundingClientRect()
			if (!rect || rect.width === 0 || rect.height === 0) return
			const pos: Position = {
				nx: (clientX - rect.left) / rect.width,
				ny: (clientY - rect.top) / rect.height,
			}
			emitMotionRef.current(pos, type)
		}

		const emitHoldMove = () => {
			const session = sessionsRef.current.values().next().value
			if (!session) return
			emit(session.lastX, session.lastY, 'move')
		}

		const startHoldHeartbeat = () => {
			if (holdIntervalRef.current != null) return
			holdIntervalRef.current = setInterval(emitHoldMove, glowIntervalMs)
		}

		const endSession = (
			pointerId: number,
			clientX: number,
			clientY: number,
			event?: Event,
		) => {
			const session = sessionsRef.current.get(pointerId)
			if (!session) return

			sessionsRef.current.delete(pointerId)
			emit(clientX, clientY, 'stop')
			if (sessionsRef.current.size === 0) stopHoldHeartbeat()

			if (passThrough && session.isDrag) {
				suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS
				event?.preventDefault()
				event?.stopPropagation()
			}
		}

		const endAllSessions = (event?: Event) => {
			for (const [pointerId, session] of sessionsRef.current) {
				emit(session.lastX, session.lastY, 'stop')
				if (passThrough && session.isDrag) {
					suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS
					event?.preventDefault()
				}
			}
			sessionsRef.current.clear()
			stopHoldHeartbeat()
		}

		const onPointerDown = (e: PointerEvent) => {
			if (e.pointerType === 'mouse' && e.button !== 0) return

			sessionsRef.current.set(e.pointerId, {
				startX: e.clientX,
				startY: e.clientY,
				lastX: e.clientX,
				lastY: e.clientY,
				isDrag: !passThrough,
			})

			if (!passThrough) {
				e.preventDefault()
				const surface = surfaceRef.current
				if (surface?.hasPointerCapture && !surface.hasPointerCapture(e.pointerId)) {
					surface.setPointerCapture(e.pointerId)
				}
			}

			emit(e.clientX, e.clientY, 'start')
			startHoldHeartbeat()
		}

		const onPointerMove = (e: PointerEvent) => {
			const session = sessionsRef.current.get(e.pointerId)
			if (!session) return

			session.lastX = e.clientX
			session.lastY = e.clientY

			if (passThrough && !session.isDrag) {
				const dx = e.clientX - session.startX
				const dy = e.clientY - session.startY
				if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
					session.isDrag = true
				}
			}

			if (!passThrough || session.isDrag) {
				e.preventDefault()
				emit(e.clientX, e.clientY, 'move')
			}
		}

		const onPointerUp = (e: PointerEvent) => {
			if (e.pointerType === 'mouse' && e.button !== 0) return
			endSession(e.pointerId, e.clientX, e.clientY, e)
		}

		const onPointerCancel = (e: PointerEvent) => {
			endSession(e.pointerId, e.clientX, e.clientY, e)
		}

		const onTouchMove = (e: TouchEvent) => {
			if (sessionsRef.current.size === 0) return

			const touch = e.touches[0]
			if (!touch) return

			const firstEntry = sessionsRef.current.entries().next()
			if (firstEntry.done) return
			const [, session] = firstEntry.value

			session.lastX = touch.clientX
			session.lastY = touch.clientY

			if (passThrough && !session.isDrag) {
				const dx = touch.clientX - session.startX
				const dy = touch.clientY - session.startY
				if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
					session.isDrag = true
				}
			}

			if (!passThrough || session.isDrag) {
				e.preventDefault()
				emit(touch.clientX, touch.clientY, 'move')
			}
		}

		const onTouchEnd = (e: TouchEvent) => {
			if (sessionsRef.current.size === 0) return
			if (e.touches.length > 0) return
			endAllSessions(e)
		}

		const onTouchCancel = (e: TouchEvent) => {
			if (sessionsRef.current.size === 0) return
			endAllSessions(e)
		}

		const onClickCapture = (e: MouseEvent) => {
			if (Date.now() < suppressClickUntilRef.current) {
				e.preventDefault()
				e.stopPropagation()
			}
		}

		const onDragStart = (e: DragEvent) => {
			if (passThrough && sessionsRef.current.size > 0) {
				e.preventDefault()
			}
		}

		const target: EventTarget = passThrough
			? document
			: (surfaceRef.current ?? document)

		target.addEventListener('pointerdown', onPointerDown, PASSIVE_CAPTURE)
		target.addEventListener('pointermove', onPointerMove, ACTIVE_CAPTURE)
		target.addEventListener('pointerup', onPointerUp, PASSIVE_CAPTURE)
		target.addEventListener('pointercancel', onPointerCancel, PASSIVE_CAPTURE)
		document.addEventListener('touchmove', onTouchMove, ACTIVE_CAPTURE)
		document.addEventListener('touchend', onTouchEnd, PASSIVE_CAPTURE)
		document.addEventListener('touchcancel', onTouchCancel, PASSIVE_CAPTURE)
		document.addEventListener('visibilitychange', endAllSessions)
		window.addEventListener('blur', endAllSessions)
		if (passThrough) {
			document.addEventListener('click', onClickCapture, true)
			document.addEventListener('dragstart', onDragStart, ACTIVE_CAPTURE)
		}

		return () => {
			target.removeEventListener('pointerdown', onPointerDown, PASSIVE_CAPTURE)
			target.removeEventListener('pointermove', onPointerMove, ACTIVE_CAPTURE)
			target.removeEventListener('pointerup', onPointerUp, PASSIVE_CAPTURE)
			target.removeEventListener('pointercancel', onPointerCancel, PASSIVE_CAPTURE)
			document.removeEventListener('touchmove', onTouchMove, ACTIVE_CAPTURE)
			document.removeEventListener('touchend', onTouchEnd, PASSIVE_CAPTURE)
			document.removeEventListener('touchcancel', onTouchCancel, PASSIVE_CAPTURE)
			document.removeEventListener('visibilitychange', endAllSessions)
			window.removeEventListener('blur', endAllSessions)
			document.removeEventListener('click', onClickCapture, true)
			document.removeEventListener('dragstart', onDragStart, ACTIVE_CAPTURE)
			sessionsRef.current.clear()
			stopHoldHeartbeat()
		}
	}, [passThrough, rootRef, surfaceRef, glowIntervalMs])
}
