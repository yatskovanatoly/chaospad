const SMOOTH = 0.03
const MOD_RATIO = 4.07

/** Inharmonic FM — bright metallic bell, clearly non-sine. */
export function createFmBell(ctx: AudioContext) {
	const output = ctx.createGain()
	const carrier = ctx.createOscillator()
	const mod = ctx.createOscillator()
	const modGain = ctx.createGain()
	const high = ctx.createBiquadFilter()

	carrier.type = 'sine'
	mod.type = 'sine'
	high.type = 'highpass'
	high.frequency.value = 380
	high.Q.value = 0.7

	carrier.connect(output)
	carrier.connect(high)
	high.connect(output)
	mod.connect(modGain)
	modGain.connect(carrier.frequency)

	return {
		output,
		setParams(p: { freq: number; amp: number }) {
			const t = ctx.currentTime
			carrier.frequency.setTargetAtTime(p.freq, t, SMOOTH)
			mod.frequency.setTargetAtTime(p.freq * MOD_RATIO, t, SMOOTH)
			modGain.gain.setTargetAtTime(600 + p.freq * 6.5, t, SMOOTH)
			high.frequency.setTargetAtTime(280 + p.freq * 0.6, t, SMOOTH)
			output.gain.setTargetAtTime(p.amp * 0.72, t, SMOOTH)
		},
		start(when: number) {
			carrier.start(when)
			mod.start(when)
		},
		stop(release: number, when: number) {
			output.gain.cancelScheduledValues(when)
			output.gain.setValueAtTime(output.gain.value, when)
			output.gain.linearRampToValueAtTime(0, when + release)
			const end = when + release + 0.05
			carrier.stop(end)
			mod.stop(end)
		},
		dispose() {
			carrier.disconnect()
			mod.disconnect()
			modGain.disconnect()
			high.disconnect()
			output.disconnect()
		},
	}
}
