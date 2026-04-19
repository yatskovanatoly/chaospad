import { startBufferLfoLoop } from '../shared/bufferLfoLoop'
import type { SoundMode } from '../types'

const PERIOD_S = 2

export const volumeLfoBufferMode: SoundMode = {
	id: 'volumeLfoBuffer',
	label: 'Volume LFO',
	attach({ engine, getXyArray }) {
		const loop = startBufferLfoLoop({
			engine,
			getBins: getXyArray,
			rateHz: 1 / PERIOD_S,
			onSample: (v) => {
				engine.tremoloGain.gain.value = Math.max(0, Math.min(1, v))
			},
			onEmpty: () => {
				engine.tremoloGain.gain.value = 0
			},
		})

		return {
			dispose: () => {
				loop.stop()
				engine.tremoloGain.gain.value = 1
			},
		}
	},
}
