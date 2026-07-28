export type SplatInput = {
	x: number
	y: number
	dx: number
	dy: number
	color: string
	key?: string
	impulse?: number
	stopped?: boolean
}

export type PadMotionState = {
	vx: number
	vy: number
	impulse: number
}

export type SplatOpts = {
	motion?: PadMotionState
	stopped?: boolean
}

export type VisualHandler = (splat: SplatInput) => void
