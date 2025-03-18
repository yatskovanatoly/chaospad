import { createImpulseResponse } from "./createImpulseResponse";

export const createSoundChain = (
	ctx: AudioContext,
	x: number,
	y: number
): { osc: OscillatorNode; gain: GainNode; convolver: ConvolverNode } => {
	const osc = ctx.createOscillator()
	const gain = ctx.createGain()
	const convolver = ctx.createConvolver()

	convolver.buffer = createImpulseResponse(ctx)

	const freq = 100 + x * 1000
	const amp = 1 - y

	osc.type = 'sine'
	osc.frequency.setValueAtTime(freq, ctx.currentTime)
	gain.gain.setValueAtTime(amp * 0.5, ctx.currentTime) // match local scaling

	osc.connect(gain).connect(convolver).connect(ctx.destination)

	return { osc, gain, convolver }
}
