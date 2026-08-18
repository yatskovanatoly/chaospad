import {
	findScrollTarget,
	scrollWithChaining,
} from '@/components/ChaosPad/helpers/scrollTarget'
import { useChaospadConfig } from '@/context/ChaospadConfigContext'
import useWebSocket from '@/components/WsContext/useWebSocket'
import type { MotionType } from '@/components/WsContext/WsContextProvider'
import type { Position } from '@/type'
import { useLayoutEffect, useRef, type RefObject } from 'react'

const DRAG_THRESHOLD_PX = 10
const CLICK_SUPPRESS_MS = 400

const VELOCITY_SMOOTH = 0.5
const MOMENTUM_DECAY_PER_MS = 0.998
const MOMENTUM_MIN_SPEED = 0.02
const MOMENTUM_MAX_SPEED = 4
const MOMENTUM_MAX_STEP_MS = 64
const MOMENTUM_STALE_MS = 100
const SUBPIXEL_CARRY_PX = 1

const PASSIVE_CAPTURE = { capture: true, passive: true } as const
const ACTIVE_CAPTURE = { capture: true, passive: false } as const

type PointerSession = {
	startX: number
	startY: number
	lastX: number
	lastY: number
	isDrag: boolean
	isTouch: boolean
}

type ScrollGesture = {
	el: Element
	lastX: number
	lastY: number
	lastAt: number
	vx: number
	vy: number
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

	useLayoutEffect(() => {
		let scroll: ScrollGesture | null = null
		let momentumRaf = 0
		let scrollRaf = 0
		let pendingX = 0
		let pendingY = 0

		const stopHoldHeartbeat = () => {
			if (holdIntervalRef.current == null) return
			clearInterval(holdIntervalRef.current)
			holdIntervalRef.current = null
		}

		const stopMomentum = () => {
			if (!momentumRaf) return
			cancelAnimationFrame(momentumRaf)
			momentumRaf = 0
		}

		const carry = (requested: number, applied: number) =>
			Math.abs(requested - applied) < SUBPIXEL_CARRY_PX ? requested - applied : 0

		const flushScroll = () => {
			scrollRaf = 0
			const dx = pendingX
			const dy = pendingY
			pendingX = 0
			pendingY = 0
			if (!scroll || (dx === 0 && dy === 0)) return

			const applied = scrollWithChaining(scroll.el, dx, dy)
			pendingX += carry(dx, applied.dx)
			pendingY += carry(dy, applied.dy)
		}

		const queueScroll = (dx: number, dy: number) => {
			pendingX += dx
			pendingY += dy
			if (!scrollRaf) scrollRaf = requestAnimationFrame(flushScroll)
		}

		const stopScrollGesture = () => {
			if (scrollRaf) cancelAnimationFrame(scrollRaf)
			scrollRaf = 0
			pendingX = 0
			pendingY = 0
			scroll = null
		}

		const startMomentum = (el: Element, vx: number, vy: number) => {
			stopMomentum()
			const speed = Math.hypot(vx, vy)
			if (speed < MOMENTUM_MIN_SPEED) return

			const scale = speed > MOMENTUM_MAX_SPEED ? MOMENTUM_MAX_SPEED / speed : 1
			let mx = vx * scale
			let my = vy * scale
			let restX = 0
			let restY = 0
			let last = performance.now()

			const step = (now: number) => {
				const dt = Math.min(Math.max(now - last, 1), MOMENTUM_MAX_STEP_MS)
				last = now

				const wantX = mx * dt + restX
				const wantY = my * dt + restY
				const applied = scrollWithChaining(el, wantX, wantY)
				restX = carry(wantX, applied.dx)
				restY = carry(wantY, applied.dy)

				const decay = MOMENTUM_DECAY_PER_MS ** dt
				mx *= decay
				my *= decay

				const stalled =
					applied.dx === 0 && applied.dy === 0 && restX === 0 && restY === 0
				if (stalled || Math.hypot(mx, my) < MOMENTUM_MIN_SPEED) {
					momentumRaf = 0
					return
				}
				momentumRaf = requestAnimationFrame(step)
			}

			momentumRaf = requestAnimationFrame(step)
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

		const suppressesClick = (session: PointerSession) =>
			passThrough && session.isDrag && !session.isTouch

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

			if (suppressesClick(session)) {
				suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS
				event?.preventDefault()
				event?.stopPropagation()
			}
		}

		const endAllSessions = (event?: Event) => {
			for (const [, session] of sessionsRef.current) {
				emit(session.lastX, session.lastY, 'stop')
				if (suppressesClick(session)) {
					suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS
					event?.preventDefault()
				}
			}
			sessionsRef.current.clear()
			stopHoldHeartbeat()
		}

		const onTouchStart = (e: TouchEvent) => {
			stopMomentum()
			stopScrollGesture()
			if (!passThrough) return

			const touch = e.touches[0]
			if (!touch || e.touches.length > 1) return

			const el = findScrollTarget(touch.clientX, touch.clientY)
			if (!el) return

			scroll = {
				el,
				lastX: touch.clientX,
				lastY: touch.clientY,
				lastAt: e.timeStamp,
				vx: 0,
				vy: 0,
			}
		}

		const driveScroll = (touch: Touch, at: number) => {
			if (!scroll) return

			const dx = scroll.lastX - touch.clientX
			const dy = scroll.lastY - touch.clientY
			const dt = Math.max(at - scroll.lastAt, 1)

			scroll.lastX = touch.clientX
			scroll.lastY = touch.clientY
			scroll.lastAt = at
			queueScroll(dx, dy)

			scroll.vx += (dx / dt - scroll.vx) * VELOCITY_SMOOTH
			scroll.vy += (dy / dt - scroll.vy) * VELOCITY_SMOOTH
		}

		const onPointerDown = (e: PointerEvent) => {
			if (e.pointerType === 'mouse' && e.button !== 0) return

			sessionsRef.current.set(e.pointerId, {
				startX: e.clientX,
				startY: e.clientY,
				lastX: e.clientX,
				lastY: e.clientY,
				isDrag: !passThrough,
				isTouch: e.pointerType !== 'mouse',
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
				if (!passThrough || !session.isTouch) e.preventDefault()
				emit(e.clientX, e.clientY, 'move')
			}
		}

		const onPointerUp = (e: PointerEvent) => {
			if (e.pointerType === 'mouse' && e.button !== 0) return
			endSession(e.pointerId, e.clientX, e.clientY, e)
		}

		const onPointerCancel = (e: PointerEvent) => {
			const session = sessionsRef.current.get(e.pointerId)
			if (!session) return
			if (passThrough && session.isTouch) return
			endSession(e.pointerId, e.clientX, e.clientY, e)
		}

		const onTouchMove = (e: TouchEvent) => {
			if (sessionsRef.current.size === 0) return

			const touch = e.touches[0]
			if (!touch) return

			if (e.touches.length > 1) {
				stopScrollGesture()
				return
			}

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

			e.preventDefault()
			if (passThrough) driveScroll(touch, e.timeStamp)

			if (!passThrough || session.isDrag) {
				emit(touch.clientX, touch.clientY, 'move')
			}
		}

		const onTouchEnd = (e: TouchEvent) => {
			if (scroll && e.touches.length === 0) {
				const { el, vx, vy } = scroll
				const stale = e.timeStamp - scroll.lastAt > MOMENTUM_STALE_MS
				flushScroll()
				stopScrollGesture()
				if (!stale) startMomentum(el, vx, vy)
			}

			if (sessionsRef.current.size === 0) return
			if (e.touches.length > 0) return
			endAllSessions(e)
		}

		const onTouchCancel = (e: TouchEvent) => {
			stopScrollGesture()
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

		const unbinds: Array<() => void> = []
		const bind = (
			el: EventTarget,
			type: string,
			fn: (e: never) => void,
			opts: AddEventListenerOptions | boolean,
		) => {
			const listener = fn as EventListener
			el.addEventListener(type, listener, opts)
			unbinds.push(() => el.removeEventListener(type, listener, opts))
		}

		bind(document, 'touchstart', onTouchStart, PASSIVE_CAPTURE)
		bind(document, 'touchend', onTouchEnd, PASSIVE_CAPTURE)
		bind(target, 'pointerdown', onPointerDown, PASSIVE_CAPTURE)
		bind(target, 'pointermove', onPointerMove, ACTIVE_CAPTURE)
		bind(target, 'pointerup', onPointerUp, ACTIVE_CAPTURE)
		bind(target, 'pointercancel', onPointerCancel, PASSIVE_CAPTURE)
		bind(document, 'touchmove', onTouchMove, ACTIVE_CAPTURE)
		bind(document, 'touchcancel', onTouchCancel, PASSIVE_CAPTURE)
		bind(document, 'visibilitychange', endAllSessions, false)
		bind(window, 'blur', endAllSessions, false)
		if (passThrough) {
			bind(document, 'click', onClickCapture, true)
			bind(document, 'dragstart', onDragStart, ACTIVE_CAPTURE)
		}

		return () => {
			for (const unbind of unbinds) unbind()
			sessionsRef.current.clear()
			stopHoldHeartbeat()
			stopMomentum()
			stopScrollGesture()
		}
	}, [passThrough, rootRef, surfaceRef, glowIntervalMs])
}
