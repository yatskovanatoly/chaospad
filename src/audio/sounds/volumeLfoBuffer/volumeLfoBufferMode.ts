import { startBufferLfoLoop } from '../shared/bufferLfoLoop'
import type { SoundMode } from '../types'

const PERIOD_S = 2
const GAIN_SMOOTH_TAU_S = 0.04

export const volumeLfoBufferMode: SoundMode = {
	id: 'volumeLfoBuffer',
	label: 'Volume LFO',
	attach({ engine, getXyArray }) {
		const smoothGain = (target: number) => {
			const g = engine.tremoloGain.gain
			g.setTargetAtTime(target, engine.ctx.currentTime, GAIN_SMOOTH_TAU_S)
		}

		const loop = startBufferLfoLoop({
			engine,
			getBins: getXyArray,
			rateHz: 1 / PERIOD_S,
			onSample: (v) => {
				smoothGain(Math.max(0, Math.min(1, v)))
			},
			onEmpty: () => {
				smoothGain(0)
			},
		})

		return {
			dispose: () => {
				loop.stop()
				smoothGain(1)
			},
		}
	},
}
