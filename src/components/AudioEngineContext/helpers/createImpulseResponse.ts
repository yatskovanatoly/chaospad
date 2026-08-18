const cache = new Map<string, AudioBuffer>()

export const createImpulseResponse = (
	ctx: AudioContext,
	duration = 5,
	decay = 3.2
) => {
	const key = `${ctx.sampleRate}:${duration}:${decay}`
	const cached = cache.get(key)
	if (cached) return cached

	const rate = ctx.sampleRate
	const length = rate * duration
	const impulse = ctx.createBuffer(2, length, rate)
	for (let c = 0; c < 2; c++) {
		const channel = impulse.getChannelData(c)
		for (let i = 0; i < length; i++) {
			channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
		}
	}

	cache.set(key, impulse)
	return impulse
}
