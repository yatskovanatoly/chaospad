import { useAudioEngine } from '@/components/AudioEngineContext/useAudioEngine'
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

const FRAME_MS = 1000 / 60
const VELOCITY_SMOOTH = 0.6
const MOMENTUM_FRICTION = 0.94
const MOMENTUM_MIN_PX = 0.4
/** Палец замер перед отрывом — инерцию не запускаем. */
const MOMENTUM_STALE_MS = 100

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

/** Скролл, который пад ведёт сам, вместо того чтобы отдать жест браузеру. */
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
	const engine = useAudioEngine()
	const { glowIntervalMs } = useChaospadConfig()
	const emitMotionRef = useRef(emitMotion)
	const engineRef = useRef(engine)
	const sessionsRef = useRef(new Map<number, PointerSession>())
	const suppressClickUntilRef = useRef(0)
	const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	emitMotionRef.current = emitMotion
	engineRef.current = engine

	useLayoutEffect(() => {
		let scroll: ScrollGesture | null = null
		let momentumRaf = 0

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

		const startMomentum = (el: Element, vx: number, vy: number) => {
			stopMomentum()
			let mx = vx
			let my = vy
			if (Math.hypot(mx, my) < MOMENTUM_MIN_PX) return

			const step = () => {
				mx *= MOMENTUM_FRICTION
				my *= MOMENTUM_FRICTION
				const moved = scrollWithChaining(el, mx, my)
				if (!moved || Math.hypot(mx, my) < MOMENTUM_MIN_PX) {
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
			unlockAudio()
			emit(session.lastX, session.lastY, 'move')
		}

		const startHoldHeartbeat = () => {
			if (holdIntervalRef.current != null) return
			holdIntervalRef.current = setInterval(emitHoldMove, glowIntervalMs)
		}

		// Клик после драга гасим только для мыши: у тача синтетический клик
		// и так не доезжает, потому что touchmove отменён.
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

		const unlockAudio = () => {
			engineRef.current.unlock()
		}

		const onTouchStart = (e: TouchEvent) => {
			unlockAudio()
			stopMomentum()
			scroll = null
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

			// Палец вверх — контент вверх: дельта скролла обратна дельте пальца.
			const dx = scroll.lastX - touch.clientX
			const dy = scroll.lastY - touch.clientY
			const dt = Math.max(at - scroll.lastAt, 1)

			scroll.lastX = touch.clientX
			scroll.lastY = touch.clientY
			scroll.lastAt = at
			scrollWithChaining(scroll.el, dx, dy)

			const perFrame = FRAME_MS / dt
			scroll.vx += (dx * perFrame - scroll.vx) * VELOCITY_SMOOTH
			scroll.vy += (dy * perFrame - scroll.vy) * VELOCITY_SMOOTH
		}

		const onPointerDown = (e: PointerEvent) => {
			if (e.pointerType === 'mouse' && e.button !== 0) return

			unlockAudio()

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
				// Тач ведёт touchmove — там же и preventDefault, и скролл.
				if (!passThrough || !session.isTouch) e.preventDefault()
				emit(e.clientX, e.clientY, 'move')
			}
		}

		const onPointerUp = (e: PointerEvent) => {
			if (e.pointerType === 'mouse' && e.button !== 0) return
			unlockAudio()
			endSession(e.pointerId, e.clientX, e.clientY, e)
		}

		const onPointerCancel = (e: PointerEvent) => {
			const session = sessionsRef.current.get(e.pointerId)
			if (!session) return
			// Тач-сессию ведут touch-события: pointercancel её не рвёт.
			if (passThrough && session.isTouch) return
			endSession(e.pointerId, e.clientX, e.clientY, e)
		}

		const onTouchMove = (e: TouchEvent) => {
			if (sessionsRef.current.size === 0) return

			unlockAudio()

			const touch = e.touches[0]
			if (!touch) return

			// Мультитач (пинч/зум) отдаём браузеру целиком.
			if (e.touches.length > 1) {
				scroll = null
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

			// Жест не отдаём браузеру ни при каком раскладе: на нативном скролле
			// мобильный движок морозит главный поток вместе с rAF, и частицы
			// застывают на месте до конца инерции. Скроллим сами.
			e.preventDefault()
			if (passThrough) driveScroll(touch, e.timeStamp)

			if (!passThrough || session.isDrag) {
				emit(touch.clientX, touch.clientY, 'move')
			}
		}

		const onTouchEnd = (e: TouchEvent) => {
			unlockAudio()

			if (scroll && e.touches.length === 0) {
				const stale = e.timeStamp - scroll.lastAt > MOMENTUM_STALE_MS
				if (!stale) startMomentum(scroll.el, scroll.vx, scroll.vy)
				scroll = null
			}

			if (sessionsRef.current.size === 0) return
			if (e.touches.length > 0) return
			endAllSessions(e)
		}

		const onTouchCancel = (e: TouchEvent) => {
			scroll = null
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
		// touchmove non-passive: скролл под падом ведём вручную.
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
		}
	}, [passThrough, rootRef, surfaceRef, glowIntervalMs])
}
