import type { ComponentType } from 'react'
import GlowViz from './GlowViz'
import SquaresViz from './SquaresViz'
import WebGLViz from './WebGLViz'

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
