export const VOLUME_PER_HEIGHT = 2.5

export const getSoundParamsFromXY = (nx: number, ny: number) => {
	const minFreq = 174
	const maxFreq = 349

	const x = Math.min(1, Math.max(0, nx))
	const y = Math.min(1, Math.max(0, ny))

	const freq = minFreq * Math.pow(maxFreq / minFreq, x)
	const amp = Math.min(1, (1 - y) * VOLUME_PER_HEIGHT)

	return { freq, amp, x, y }
}
