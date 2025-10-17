import { createImpulseResponse } from './createImpulseResponse'
import { getSoundParamsFromXY } from './getSoundParams'

function createSoundChain({
	ctx,
	type = 'sine',
	volume = 0.2,
	reverbLevel = 0.4,
	position = { x: 0, y: 0 },
	impulseResponse,
}: OscillatorOptions): OscillatorResult {
	const oscillator = ctx.createOscillator()
	const gainNode = ctx.createGain()
	const convolver = ctx.createConvolver()
	const convolverGain = ctx.createGain()
	const masterGain = ctx.createGain()

	const { freq, amp } = getSoundParamsFromXY(position.x, position.y)

	convolver.buffer = impulseResponse || createImpulseResponse(ctx)
	convolverGain.gain.value = reverbLevel
	masterGain.gain.value = volume

	oscillator.connect(gainNode)
	gainNode.connect(masterGain)
	gainNode.connect(convolver)
	convolver.connect(convolverGain)
	convolverGain.connect(masterGain)
	masterGain.connect(ctx.destination)

	oscillator.type = type
	oscillator.frequency.value = freq
	gainNode.gain.value = amp * 0.5
	oscillator.start()

	const stop = () => {
		oscillator.stop()
		oscillator.disconnect()
		gainNode.disconnect()
		convolver.disconnect()
		convolverGain.disconnect()
		masterGain.disconnect()
	}

	return {
		oscillator,
		gainNode,
		convolver,
		convolverGain,
		stop,
	}
}

type OscillatorOptions = {
	ctx: AudioContext
	type?: OscillatorType
	volume?: number
	reverbLevel?: number
	position?: { x: number; y: number }
	impulseResponse?: AudioBuffer
}

type OscillatorResult = {
	oscillator: OscillatorNode
	gainNode: GainNode
	convolver: ConvolverNode
	convolverGain: GainNode
	stop: () => void
}

export default createSoundChain
