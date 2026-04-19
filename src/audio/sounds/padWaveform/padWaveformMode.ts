import { binsToPeriodicWave } from '@/audio/engine/helpers/binsToPeriodicWave'
import { createThrottledTrigger } from '../shared/throttle'
import type { SoundMode } from '../types'

const WAVE_THROTTLE_MS = 110

export const padWaveformMode: SoundMode = {
	id: 'padWaveform',
	label: 'Buffer',
	attach({ engine, voice, getXyArray }) {
		const applyWave = () => {
			const bins = getXyArray()
			if (!bins) return
			voice.setOscillatorWave(binsToPeriodicWave(engine.ctx, bins))
			voice.refreshPosition()
		}

		applyWave()

		const throttled = createThrottledTrigger(applyWave, WAVE_THROTTLE_MS)

		return {
			onXyUpdate: throttled.trigger,
			dispose: () => {
				throttled.cancel()
				voice.setOscillatorType('sine')
			},
		}
	},
}
