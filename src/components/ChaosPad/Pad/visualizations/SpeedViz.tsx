'use client'

import { padEventStore } from '@/state/padEventStore'
import { usePadSurface } from '../PadSurfaceContext'

const D_MIN = 16
const D_MAX = 104

export default function SpeedViz() {
	const { width, height } = usePadSurface()
	const local = padEventStore((s) => s.local)
	const s = local?.gestureSpeed01 ?? 0
	if (!local || (local.type !== 'start' && local.type !== 'move')) return null
	const d = D_MIN + (D_MAX - D_MIN) * s
	return (
		<div className='absolute inset-0 pointer-events-none overflow-hidden z-[4]'>
			<div
				className='absolute rounded-full bg-red-500/80 border-2 border-red-400/60 -translate-x-1/2 -translate-y-1/2'
				style={{
					left: local.nx * width,
					top: local.ny * height,
					width: d,
					height: d,
					boxShadow: '0 0 16px rgba(248, 113, 113, 0.45)',
					transition: 'width 40ms linear, height 40ms linear',
				}}
			/>
		</div>
	)
}
