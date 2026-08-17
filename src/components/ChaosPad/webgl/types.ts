export type Particle = {
	x: number
	y: number
	vx: number
	vy: number
	life: number
	maxLife: number
	r: number
	g: number
	b: number
	size: number
	flowX: number
	flowY: number
	seed: number
	drag: number
}

export type FlowState = {
	x: number
	y: number
	speed: number
}

export type BurstMetrics = {
	stopped: boolean
	impulse: number
	touchSpeed: number
	speedNorm: number
	motionBoost: number
	isSwipe: boolean
	dirX: number
	dirY: number
	perpX: number
	perpY: number
	swipe: number
	baseRadius: number
	stretch: number
	burstCount: number
	inertiaBase: number
	inheritScale: number
	lag: number
}
