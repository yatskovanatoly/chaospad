import { padEventStore } from '@/state/padEventStore'
import type { SoundMode } from '../types'

const vToPitchMul = (v: number): number => {
	const t = Math.max(0, Math.min(1, v))
	const shaped = t ** 2.75
	return 1 + 1.5 * shaped
}

export const speedPitchMode: SoundMode = {
	id: 'speedPitch',
	label: 'Speed-pitch',
	attach({ voice }) {
		let raf = 0
		const tick = () => {
			raf = requestAnimationFrame(tick)
			const v = padEventStore.getState().local?.gestureSpeed01 ?? 0
			voice.setPitchLfoMul(vToPitchMul(v))
		}
		raf = requestAnimationFrame(tick)
		return {
			dispose: () => {
				cancelAnimationFrame(raf)
				voice.setPitchLfoMul(1)
			},
		}
	},
}
