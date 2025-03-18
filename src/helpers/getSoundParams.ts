export const getSoundParamsFromXY = (clientX: number, clientY: number) => {
	const minFreq = 100
	const maxFreq = 1000

	const x = clientX / window.innerWidth
	const freq = minFreq * Math.pow(maxFreq / minFreq, x) // Logarithmic scale

	const y = clientY / window.innerHeight
	const amp = 1 - y

	return { freq, amp, x, y }
}
