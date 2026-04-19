import { startBufferLfoLoop } from '../shared/bufferLfoLoop'
import type { SoundMode } from '../types'

const PERIOD_S = 2

const vToPitchMul = (v: number): number => {
	const t = Math.max(0, Math.min(1, v))
	return 0.5 + t * 1.5
}

export const pitchLfoBufferMode: SoundMode = {
	id: 'pitchLfoBuffer',
	label: 'Pitch LFO',
	attach({ engine, voice, getXyArray }) {
		const loop = startBufferLfoLoop({
			engine,
			getBins: getXyArray,
			rateHz: 1 / PERIOD_S,
			onSample: (v) => {
				engine.tremoloGain.gain.value = 1
				voice.setPitchLfoMul(vToPitchMul(v))
			},
			onEmpty: () => {
				engine.tremoloGain.gain.value = 0
			},
		})

		return {
			dispose: () => {
				loop.stop()
				engine.tremoloGain.gain.value = 1
				voice.setPitchLfoMul(1)
			},
		}
	},
}
