import { getSoundParamsFromNormalized } from './getSoundParams'
import { quantizeFreq, type QuantizeMode } from './quantizeFreq'

const SMOOTH_S = 0.045

export const updateSoundFromNormalized = (
	nx: number,
	ny: number,
	ctx: AudioContext | null,
	osc: OscillatorNode | null,
	gain: GainNode | null,
	quantize: QuantizeMode = 'none',
	gainMul = 1,
	pitchMul = 1,
) => {
	if (!ctx || !osc || !gain) return

	const { freq: rawFreq, amp } = getSoundParamsFromNormalized(nx, ny)
	const freq = quantizeFreq(rawFreq, quantize) * pitchMul
	const now = ctx.currentTime
	const end = now + SMOOTH_S
	const targetGain = amp * 0.5 * gainMul

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
