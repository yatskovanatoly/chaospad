export const getSoundParamsFromXY = (clientX: number, clientY: number) => {
	const minFreq = 256
	const maxFreq = 512

	const x = (clientX / window.innerWidth) * 1.5 // Normalize x relative to the element's width
	const y = (clientY / window.innerHeight) * 1.5 // Normalize y relative to the element's height

	// Apply logarithmic scaling for frequency based on normalized x value
	const freq = minFreq * Math.pow(maxFreq / minFreq, x)

	// Amplitude decreases as y increases, within the range [0, 1]
	const amp = 1 - y

	return { freq, amp, x, y }
}
