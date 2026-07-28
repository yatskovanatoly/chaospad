'use client'

import { useChaospadConfig } from '@/context/ChaospadConfigContext'
import { useChaosAudio } from './hooks/useChaosAudio'
import { useChaosWebSocket } from './hooks/useChaosWs'
import { useAudioUnlock } from './hooks/useAudioUnlock'
import { useGlobalPointerPad } from './hooks/useGlobalPointerPad'
import GlowEffect from './GlowFx'
import PadGlCanvas from './PadGlCanvas'
import { useRef, type CSSProperties } from 'react'

type ChaosPadProps = {
	className?: string
	style?: CSSProperties
}

export default function ChaosPad({ className, style }: ChaosPadProps) {
	const { pointerPassThrough, visualMode } = useChaospadConfig()
	const rootRef = useRef<HTMLDivElement>(null)
	const surfaceRef = useRef<HTMLDivElement>(null)
	const glowContainerRef = useRef<HTMLDivElement>(null)

	useAudioUnlock()
	useChaosAudio()
	useChaosWebSocket()
	useGlobalPointerPad(rootRef, surfaceRef, pointerPassThrough)

	const rootClass = [
		'chaospad-root',
		pointerPassThrough && 'chaospad-pass-through',
		className,
	]
		.filter(Boolean)
		.join(' ')

	return (
		<div ref={rootRef} className={rootClass} style={style}>
			<div ref={surfaceRef} className='chaospad-surface' aria-hidden='true' />
			<div ref={glowContainerRef} className='chaospad-glow-layer'>
				{visualMode === 'webgl' && (
					<PadGlCanvas containerRef={glowContainerRef} />
				)}
			</div>
			<GlowEffect containerRef={glowContainerRef} />
		</div>
	)
}
