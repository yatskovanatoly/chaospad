import type { PresetId } from '@/components/AudioEngineContext/presets/types'
import { getSoundParamsFromXY } from './getSoundParams'
import { quantizeFreq, type QuantizeMode } from './quantizeFreq'

export type PadParams = {
	freq: number
	amp: number
	pan: number
	reverbSend: number
}

const MAX_AMP = 0.56

const REVERB_BY_PRESET: Record<PresetId, { base: number; range: number }> = {
	0: { base: 0.68, range: 0.3 },
	1: { base: 0.48, range: 0.24 },
}

export function getPadParams(
	nx: number,
	ny: number,
	quantize: QuantizeMode = 'none',
	presetId: PresetId = 0,
): PadParams {
	const { freq: rawFreq, amp } = getSoundParamsFromXY(nx, ny)
	const reverb = REVERB_BY_PRESET[presetId]
	return {
		freq: quantizeFreq(rawFreq, quantize),
		amp: amp * MAX_AMP,
		pan: (nx - 0.5) * 1.2,
		reverbSend: reverb.base + ny * reverb.range,
	}
}
