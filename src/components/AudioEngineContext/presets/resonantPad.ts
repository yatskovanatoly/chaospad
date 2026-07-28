import { createPadVoice } from './padShared'

/** Resonant body with ambient grain — closer but still hazy. */
export function createResonantPad(ctx: AudioContext) {
	return createPadVoice(ctx, {
		toneHz: 940,
		toneQ: 0.42,
		warmthHz: 580,
		warmthQ: 0.34,
		resonanceHz: 220,
		resonanceQ: 2.1,
		resonanceGain: 3.6,
		grainLevel: 0.036,
		grainBrightLevel: 0.021,
	})
}
