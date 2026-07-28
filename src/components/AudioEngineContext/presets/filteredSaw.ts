const SMOOTH = 0.03

/** Soft mellow voice — sine + triangle through a gentle lowpass. */
export function createFilteredSaw(ctx: AudioContext) {
	const output = ctx.createGain()
	const sine = ctx.createOscillator()
	const tri = ctx.createOscillator()
	const sineGain = ctx.createGain()
	const triGain = ctx.createGain()
	const filter = ctx.createBiquadFilter()

	sine.type = 'sine'
	tri.type = 'triangle'
	sineGain.gain.value = 0.62
	triGain.gain.value = 0.28
	filter.type = 'lowpass'
	filter.Q.value = 0.45

	sine.connect(sineGain)
	tri.connect(triGain)
	sineGain.connect(filter)
	triGain.connect(filter)
	filter.connect(output)

	const vibrato = ctx.createOscillator()
	const vibratoDepth = ctx.createGain()
	vibrato.frequency.value = 2.8
	vibratoDepth.gain.value = 5
	vibrato.connect(vibratoDepth)
	vibratoDepth.connect(sine.detune)
	vibratoDepth.connect(tri.detune)

	return {
		output,
		setParams(p: { freq: number; amp: number }) {
			const t = ctx.currentTime
			sine.frequency.setTargetAtTime(p.freq, t, SMOOTH)
			tri.frequency.setTargetAtTime(p.freq, t, SMOOTH)
			filter.frequency.setTargetAtTime(520 + p.freq * 1.6, t, SMOOTH)
			output.gain.setTargetAtTime(p.amp * 0.88, t, SMOOTH)
		},
		start(when: number) {
			sine.start(when)
			tri.start(when)
			vibrato.start(when)
		},
		stop(release: number, when: number) {
			output.gain.cancelScheduledValues(when)
			output.gain.setValueAtTime(output.gain.value, when)
			output.gain.linearRampToValueAtTime(0, when + release)
			const end = when + release + 0.05
			sine.stop(end)
			tri.stop(end)
			vibrato.stop(end)
		},
		dispose() {
			sine.disconnect()
			tri.disconnect()
			sineGain.disconnect()
			triGain.disconnect()
			filter.disconnect()
			vibrato.disconnect()
			output.disconnect()
		},
	}
}
