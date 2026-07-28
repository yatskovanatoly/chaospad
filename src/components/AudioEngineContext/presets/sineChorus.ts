const SMOOTH = 0.03

/** Warm triangle pad with chorus and a soft upper harmonic. */
export function createSineChorus(ctx: AudioContext) {
	const output = ctx.createGain()
	const voices = [
		{ type: 'triangle' as OscillatorType, detune: 0, level: 0.5 },
		{ type: 'triangle' as OscillatorType, detune: -14, level: 0.28 },
		{ type: 'triangle' as OscillatorType, detune: 14, level: 0.28 },
		{ type: 'sine' as OscillatorType, detune: 0, level: 0.12, octave: 2 },
	]

	const oscs = voices.map((v) => {
		const osc = ctx.createOscillator()
		const gain = ctx.createGain()
		osc.type = v.type
		osc.detune.value = v.detune
		gain.gain.value = v.level
		osc.connect(gain)
		gain.connect(output)
		return { osc, gain, octave: v.octave ?? 1 }
	})

	const vibrato = ctx.createOscillator()
	const vibratoDepth = ctx.createGain()
	vibrato.frequency.value = 5.2
	vibratoDepth.gain.value = 10
	vibrato.connect(vibratoDepth)
	oscs.forEach(({ osc }) => vibratoDepth.connect(osc.detune))

	const tone = ctx.createBiquadFilter()
	tone.type = 'lowpass'
	tone.frequency.value = 2200
	tone.Q.value = 0.6
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
			tone.frequency.setTargetAtTime(900 + p.freq * 2.8, t, SMOOTH)
			out.gain.setTargetAtTime(p.amp * 0.95, t, SMOOTH)
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
