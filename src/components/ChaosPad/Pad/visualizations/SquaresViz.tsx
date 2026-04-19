'use client'

import { usePadEvents } from '@/state/hooks/usePadEvents'
import { useCallback } from 'react'
import { usePadSurface } from '../PadSurfaceContext'
import { useParticles } from './useParticles'

const SIZE = 40

export default function SquaresViz() {
	const { width, height } = usePadSurface()
	const { particles, spawn } = useParticles()

	const onLocal = useCallback(
		(e: { nx: number; ny: number; color: string }) => spawn(e.nx, e.ny, e.color),
		[spawn],
	)
	const onRemote = useCallback(
		(e: { nx: number; ny: number; color: string }) => spawn(e.nx, e.ny, e.color),
		[spawn],
	)

	usePadEvents({ onLocal, onRemote })

	return (
		<div className='absolute inset-0 pointer-events-none overflow-hidden'>
			{particles.map((p) => (
				<div
					key={p.id}
					className={`absolute border-4 opacity-60 ${p.color}`}
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
