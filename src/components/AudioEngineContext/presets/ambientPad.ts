import { createPadVoice } from './padShared'

/** Soft atmospheric pad — wide, wet-friendly. */
export function createAmbientPad(ctx: AudioContext) {
	return createPadVoice(ctx, {
		toneHz: 760,
		toneQ: 0.28,
		warmthHz: 460,
		warmthQ: 0.22,
		grainLevel: 0.042,
		grainBrightLevel: 0.024,
	})
}
