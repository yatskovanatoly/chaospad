import type { SoundMode } from '../types'

export const sineMode: SoundMode = {
	id: 'sine',
	label: 'Sine',
	attach({ voice }) {
		voice.setOscillatorType('sine')
		return { dispose: () => {} }
	},
}
