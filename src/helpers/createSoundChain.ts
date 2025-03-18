import { createImpulseResponse } from './createImpulseResponse'
import { getSoundParamsFromXY } from './getSoundParams'

// Updated createSoundChain function
export const createSoundChain = (
	ctx: AudioContext,
	x: number,
	y: number
): {
	osc: OscillatorNode
	gain: GainNode
	convolver: ConvolverNode
	convolverGain: GainNode
} => {
	const osc = ctx.createOscillator()
	const gain = ctx.createGain()
	const convolver = ctx.createConvolver()
	const convolverGain = ctx.createGain()
	const masterGain = ctx.createGain()

	convolver.buffer = createImpulseResponse(ctx)
	const { freq, amp } = getSoundParamsFromXY(x, y)

	// const freq = 100 + x * 1000 // or calculate dynamically
	// const amp = 1 - y

	osc.type = 'sine'
	osc.frequency.setValueAtTime(freq, ctx.currentTime)
	gain.gain.setValueAtTime(amp * 0.5, ctx.currentTime) // match local scaling

	osc.connect(gain).connect(masterGain)

	gain
		.connect(convolver)
		.connect(convolverGain)
		.connect(masterGain)
		.connect(ctx.destination)

	return { osc, gain, convolver, convolverGain }
}
