export const getSoundParamsFromXY = (nx: number, ny: number) => {
	const minFreq = 256
	const maxFreq = 512

	const x = Math.min(1, Math.max(0, nx))
	const y = Math.min(1, Math.max(0, ny))

	const freq = minFreq * Math.pow(maxFreq / minFreq, x)
	const amp = 1 - y

	return { freq, amp, x, y }
}
