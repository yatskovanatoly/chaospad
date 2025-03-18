export const getSoundParamsFromXY = (clientX: number, clientY: number) => {
	const minFreq = 256
	const maxFreq = 512

	// Get the bounds of the element
	const { left, top, width, height } =
		window.document.body.getBoundingClientRect()

	// Normalize the clientX and clientY values based on the element's position and size
	const x = (clientX - left) / width // Normalize x relative to the element's width
	const y = (clientY - top) / height // Normalize y relative to the element's height

	// Apply logarithmic scaling for frequency based on normalized x value
	const freq = minFreq * Math.pow(maxFreq / minFreq, x)

	// Amplitude decreases as y increases, within the range [0, 1]
	const amp = 1 - y

	return { freq, amp, x, y }
}
