import type { AudioEngine } from '@/audio/engine/AudioEngine'
import { EMPTY_EPS, maxBin, sampleBinsAtPhase } from './bins'

export type BufferLfoLoopOptions = {
	engine: AudioEngine
	getBins: () => Float32Array | undefined
	rateHz: number
	onSample: (v: number) => void
	onEmpty: () => void
}

export type BufferLfoLoopHandle = {
	stop: () => void
}

export const startBufferLfoLoop = ({
	engine,
	getBins,
	rateHz,
	onSample,
	onEmpty,
}: BufferLfoLoopOptions): BufferLfoLoopHandle => {
	const ctx = engine.ctx
	const t0 = ctx.currentTime
	let raf = 0

	const tick = () => {
		raf = requestAnimationFrame(tick)
		const bins = getBins()
		if (!bins || maxBin(bins) < EMPTY_EPS) {
			onEmpty()
			return
		}
		const phase = ((ctx.currentTime - t0) * rateHz) % 1
		onSample(sampleBinsAtPhase(bins, phase))
	}

	raf = requestAnimationFrame(tick)

	return { stop: () => cancelAnimationFrame(raf) }
}
