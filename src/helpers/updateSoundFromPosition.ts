import { getSoundParamsFromXY } from './getSoundParams'

export const updateSoundFromPosition = (
	clientX: number,
	clientY: number,
	ctx: AudioContext | null,
	osc: OscillatorNode | null,
	gain: GainNode | null
) => {
	if (!ctx || !osc || !gain) return // Early return if any parameter is null

	// Get frequency and amplitude from position
	const { freq, amp, x, y } = getSoundParamsFromXY(clientX, clientY)
	console.log(x, y)

	// Update frequency if it has changed significantly
	const currentFreq = osc.frequency.value
	if (Math.abs(currentFreq - freq) > 0.1) {
		osc.frequency.setValueAtTime(freq, ctx.currentTime)
	}

	// Update gain amplitude if it has changed significantly
	const g = gain.gain
	const targetGain = amp * 0.5
	if (Math.abs(g.value - targetGain) > 0.01) {
		const now = ctx.currentTime
		g.cancelScheduledValues(now) // Cancel any scheduled gain changes
		g.setValueAtTime(targetGain, now) // Apply the new gain
	}
}
