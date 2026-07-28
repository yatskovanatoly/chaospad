const SMOOTH = 0.03

/** Dreamy warm-pad variant — sine stack, wide chorus, slow drift. */
export function createNoiseRes(ctx: AudioContext) {
	const output = ctx.createGain()
	const voices = [
		{ detune: 0, level: 0.46 },
		{ detune: -22, level: 0.27 },
		{ detune: 22, level: 0.27 },
		{ detune: -8, level: 0.14, octave: 0.5 },
		{ detune: 5, level: 0.1, octave: 2 },
	]

	const oscs = voices.map((v) => {
		const osc = ctx.createOscillator()
		const gain = ctx.createGain()
		osc.type = 'sine'
		osc.detune.value = v.detune
		gain.gain.value = v.level
		osc.connect(gain)
		gain.connect(output)
		return { osc, gain, octave: v.octave ?? 1 }
	})

	const vibrato = ctx.createOscillator()
	const vibratoDepth = ctx.createGain()
	vibrato.frequency.value = 3.1
	vibratoDepth.gain.value = 14
	vibrato.connect(vibratoDepth)
	oscs.forEach(({ osc }) => vibratoDepth.connect(osc.detune))

	const tone = ctx.createBiquadFilter()
	tone.type = 'lowpass'
	tone.frequency.value = 1600
	tone.Q.value = 0.45
	output.connect(tone)
	const out = ctx.createGain()
	tone.connect(out)

	return {
		output: out,
		setParams(p: { freq: number; amp: number }) {
			const t = ctx.currentTime
			oscs.forEach(({ osc, octave }) =>
				osc.frequency.setTargetAtTime(p.freq * octave, t, SMOOTH),
			)
			tone.frequency.setTargetAtTime(680 + p.freq * 2.1, t, SMOOTH)
			out.gain.setTargetAtTime(p.amp * 0.92, t, SMOOTH)
		},
		start(when: number) {
			oscs.forEach(({ osc }) => osc.start(when))
			vibrato.start(when)
		},
		stop(release: number, when: number) {
			out.gain.cancelScheduledValues(when)
			out.gain.setValueAtTime(out.gain.value, when)
			out.gain.linearRampToValueAtTime(0, when + release)
			const end = when + release + 0.05
			oscs.forEach(({ osc }) => osc.stop(end))
			vibrato.stop(end)
		},
		dispose() {
			oscs.forEach(({ osc, gain }) => {
				osc.disconnect()
				gain.disconnect()
			})
			vibrato.disconnect()
			tone.disconnect()
			out.disconnect()
		},
	}
}
