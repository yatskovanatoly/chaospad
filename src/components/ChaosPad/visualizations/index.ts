import type { ComponentType } from 'react'
import GlowViz from './GlowViz'
import SquaresViz from './SquaresViz'
import WebGLViz from './WebGLViz'

export {
	useEvents,
	usePadLocal,
	usePadRemote,
	usePadWaveform,
	usePadEventHandlers,
	type PadEventHandlersOptions,
} from '../EventsContext/useEvents'
export type { PadEventsApi, PadHoverNorm, RemotePadEvent, VisEvent } from '../EventsContext/padEvents.types'

type Visualization = {
	id: string
	label: string
	component: ComponentType
}

export const visualizations: Visualization[] = [
	{ id: 'glow', label: 'Glow', component: GlowViz },
	{ id: 'squares', label: 'Squares', component: SquaresViz },
	{ id: 'webgl', label: 'WebGL', component: WebGLViz },
]
