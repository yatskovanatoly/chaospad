'use client'

import { usePadInput } from './PadInputContext'
import { ActiveViz } from './ActiveViz'
import WaveformBufferViz from './visualizations/WaveformBufferViz'

export function PadLayer() {
	const { bindPadHandlers } = usePadInput()
	return (
		<>
			<ActiveViz />
			<WaveformBufferViz />
			<div className='absolute inset-0 touch-none z-[20]' {...bindPadHandlers()} />
		</>
	)
}
