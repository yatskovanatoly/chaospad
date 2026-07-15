'use client'

import { useChaospadConfig } from '@/context/ChaospadConfigContext'
import { useChaosAudio } from './hooks/useChaosAudio'
import { useChaosWebSocket } from './hooks/useChaosWs'
import { useGlobalPointerPad } from './hooks/useGlobalPointerPad'
import useWebSocket from '../WsContext/useWebSocket'
import { MotionType } from '../WsContext/WsContextProvider'
import GlowEffect from './GlowFx'
import { useRef, type CSSProperties } from 'react'

type ChaosPadProps = {
	className?: string
	style?: CSSProperties
}

export default function ChaosPad({ className, style }: ChaosPadProps) {
	const { pointerPassThrough } = useChaospadConfig()
	const rootRef = useRef<HTMLDivElement>(null)
	const glowContainerRef = useRef<HTMLDivElement>(null)

	useChaosAudio()
	useChaosWebSocket()
	useGlobalPointerPad(rootRef, pointerPassThrough)

	const { setType, setPos } = useWebSocket()

	const emitPointer = (e: React.PointerEvent, type: MotionType) => {
		const rect = rootRef.current?.getBoundingClientRect()
		if (!rect || rect.width === 0 || rect.height === 0) return
		setPos({
			nx: (e.clientX - rect.left) / rect.width,
			ny: (e.clientY - rect.top) / rect.height,
		})
		setType(type)
	}

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.pointerType === 'mouse' && e.button !== 0) return
		e.currentTarget.setPointerCapture(e.pointerId)
		emitPointer(e, 'start')
	}

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
		emitPointer(e, 'move')
	}

	const releaseCaptureIfHeld = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId)
		}
	}

	const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.pointerType === 'mouse' && e.button !== 0) return
		releaseCaptureIfHeld(e)
		emitPointer(e, 'stop')
	}

	const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
		releaseCaptureIfHeld(e)
		emitPointer(e, 'stop')
	}

	const rootClass = [
		'chaospad-root',
		pointerPassThrough && 'chaospad-pass-through',
		className,
	]
		.filter(Boolean)
		.join(' ')

	return (
		<div ref={rootRef} className={rootClass} style={style}>
			{!pointerPassThrough ? (
				<div
					className='chaospad-surface'
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					onPointerCancel={handlePointerCancel}
				/>
			) : null}
			<div ref={glowContainerRef} className='chaospad-glow-layer' />
			<GlowEffect containerRef={glowContainerRef} />
		</div>
	)
}
