import { getSoundParamsFromXY } from './getSoundParams'
import { quantizeFreq, type QuantizeMode } from './quantizeFreq'

const SMOOTH_S = 0.03

export const updateSoundFromPosition = (
	clientX: number,
	clientY: number,
	ctx: AudioContext | null,
	osc: OscillatorNode | null,
	gain: GainNode | null,
	quantize: QuantizeMode = 'none'
) => {
	if (!ctx || !osc || !gain) return

	const { freq: rawFreq, amp } = getSoundParamsFromXY(clientX, clientY)
	const freq = quantizeFreq(rawFreq, quantize)
	const now = ctx.currentTime
	const end = now + SMOOTH_S
	const targetGain = amp * 0.5

	const currentFreq = osc.frequency.value
	if (Math.abs(currentFreq - freq) > 0.1) {
		osc.frequency.cancelScheduledValues(now)
		osc.frequency.setValueAtTime(currentFreq, now)
		osc.frequency.exponentialRampToValueAtTime(Math.max(freq, 1e-6), end)
	}

	const g = gain.gain
	const currentGain = g.value
	if (Math.abs(currentGain - targetGain) > 0.01) {
		g.cancelScheduledValues(now)
		g.setValueAtTime(currentGain, now)
		g.linearRampToValueAtTime(targetGain, end)
	}
}
