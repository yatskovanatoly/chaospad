import useWebSocket from '@/components/WsContext/useWebSocket'
import type { MotionType } from '@/components/WsContext/WsContextProvider'
import { useEffect, useRef, type RefObject } from 'react'

const CAPTURE = { capture: true, passive: true } as const

export function useGlobalPointerPad(
	rootRef: RefObject<HTMLDivElement | null>,
	enabled: boolean,
) {
	const { setType, setPos } = useWebSocket()
	const setTypeRef = useRef(setType)
	const setPosRef = useRef(setPos)
	const activePointersRef = useRef(new Set<number>())

	setTypeRef.current = setType
	setPosRef.current = setPos

	useEffect(() => {
		if (!enabled) return

		const emitPointer = (clientX: number, clientY: number, type: MotionType) => {
			const rect = rootRef.current?.getBoundingClientRect()
			if (!rect || rect.width === 0 || rect.height === 0) return
			setPosRef.current({
				nx: (clientX - rect.left) / rect.width,
				ny: (clientY - rect.top) / rect.height,
			})
			setTypeRef.current(type)
		}

		const onPointerDown = (e: PointerEvent) => {
			if (e.pointerType === 'mouse' && e.button !== 0) return
			activePointersRef.current.add(e.pointerId)
			emitPointer(e.clientX, e.clientY, 'start')
		}

		const onPointerMove = (e: PointerEvent) => {
			if (!activePointersRef.current.has(e.pointerId)) return
			emitPointer(e.clientX, e.clientY, 'move')
		}

		const endPointer = (e: PointerEvent) => {
			if (!activePointersRef.current.has(e.pointerId)) return
			activePointersRef.current.delete(e.pointerId)
			emitPointer(e.clientX, e.clientY, 'stop')
		}

		document.addEventListener('pointerdown', onPointerDown, CAPTURE)
		document.addEventListener('pointermove', onPointerMove, CAPTURE)
		document.addEventListener('pointerup', endPointer, CAPTURE)
		document.addEventListener('pointercancel', endPointer, CAPTURE)

		return () => {
			document.removeEventListener('pointerdown', onPointerDown, CAPTURE)
			document.removeEventListener('pointermove', onPointerMove, CAPTURE)
			document.removeEventListener('pointerup', endPointer, CAPTURE)
			document.removeEventListener('pointercancel', endPointer, CAPTURE)
			activePointersRef.current.clear()
		}
	}, [enabled, rootRef])
}
