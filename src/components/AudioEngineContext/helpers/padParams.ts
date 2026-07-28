import { getSoundParamsFromXY } from './getSoundParams'
import { quantizeFreq, type QuantizeMode } from './quantizeFreq'

export type PadParams = {
	freq: number
	amp: number
	pan: number
	reverbSend: number
}

export function getPadParams(
	nx: number,
	ny: number,
	quantize: QuantizeMode = 'none',
): PadParams {
	const { freq: rawFreq, amp } = getSoundParamsFromXY(nx, ny)
	return {
		freq: quantizeFreq(rawFreq, quantize),
		amp: amp * 0.5,
		pan: nx * 2 - 1,
		reverbSend: ny * 0.75,
	}
}
