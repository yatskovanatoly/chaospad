'use client'

import { useCallback } from 'react'
import type { RemotePadEvent, VisEvent } from '../EventsContext/EventsContext'
import { usePadEventHandlers } from '../EventsContext/useEvents'
import { useParticles } from './useParticles'
import { useViewportSize } from './useViewportSize'

const SIZE = 50

export default function GlowViz() {
	const { width, height } = useViewportSize()
	const { particles, spawn } = useParticles()

	const onLocal = useCallback((e: VisEvent) => spawn(e.nx, e.ny, e.color), [spawn])
	const onRemote = useCallback((e: RemotePadEvent) => spawn(e.nx, e.ny, e.color), [spawn])

	usePadEventHandlers({ onLocal, onRemote })

	return (
		<div className='fixed inset-0 pointer-events-none overflow-hidden'>
			{particles.map((p) => (
				<div
					key={p.id}
					className={`absolute rounded-full border-4 opacity-60 blur-xs ${p.color}`}
					style={{
						left: p.nx * width - SIZE / 2,
						top: p.ny * height - SIZE / 2,
						width: SIZE,
						height: SIZE,
						animation: 'glow-effect .5s ease-in-out',
					}}
				/>
			))}
		</div>
	)
}
