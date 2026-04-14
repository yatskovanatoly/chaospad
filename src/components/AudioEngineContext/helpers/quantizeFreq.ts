export type QuantizeMode = 'none' | 'chromatic'

export const quantizeFreq = (freq: number, mode: QuantizeMode): number => {
	if (mode === 'none') return freq
	return 440 * Math.pow(2, Math.round(12 * Math.log2(freq / 440)) / 12)
}
