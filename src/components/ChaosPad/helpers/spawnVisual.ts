import {
	spawnVisualSplat,
	type PadMotionState,
} from './padVisualBridge'
import spawnGlow from './spawnGlow'

export type SpawnVisualOpts = {
	motion?: PadMotionState
	stopped?: boolean
}

const spawnVisual = (
	container: HTMLElement,
	nx: number,
	ny: number,
	color: string,
	size: number,
	key?: string,
	opts?: SpawnVisualOpts,
) => {
	if (spawnVisualSplat(nx, ny, color, size, key, opts)) return

	const { width, height } = container.getBoundingClientRect()
	spawnGlow(container, nx * width, ny * height, color, size)
}

export default spawnVisual
