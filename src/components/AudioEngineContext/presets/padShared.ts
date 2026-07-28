export const PAD_SMOOTH = 0.11

export type PadVoiceOptions = {
	toneHz: number
	toneQ: number
	warmthHz: number
	warmthQ: number
	resonanceHz?: number
	resonanceQ?: number
	resonanceGain?: number
	grainLevel: number
	grainBrightLevel?: number
}

function createGrainBuffer(ctx: AudioContext, seconds = 2.4) {
	const len = Math.floor(ctx.sampleRate * seconds)
	const buf = ctx.createBuffer(1, len, ctx.sampleRate)
	const data = buf.getChannelData(0)
	let last = 0
	for (let i = 0; i < len; i++) {
		const white = Math.random() * 2 - 1
		last = last * 0.91 + white * 0.09
		if (Math.random() < 0.0018) last += (Math.random() - 0.5) * 0.35
		data[i] = last
	}
	return buf
}

function connectChorusLfo(
	ctx: AudioContext,
	lfoRate: number,
	depthCents: number,
	targets: OscillatorNode[],
) {
	const lfo = ctx.createOscillator()
	const depth = ctx.createGain()
	lfo.frequency.value = lfoRate
	depth.gain.value = depthCents
	lfo.connect(depth)
	targets.forEach((osc) => depth.connect(osc.detune))
	return lfo
}

function addGrainLayer(
	ctx: AudioContext,
	source: AudioBuffer,
	out: GainNode,
	filter: BiquadFilterNode,
	level: number,
) {
	const node = ctx.createBufferSource()
	node.buffer = source
	node.loop = true
	const gain = ctx.createGain()
	gain.gain.value = level
	node.connect(filter)
	filter.connect(gain)
	gain.connect(out)
	return { node, gain, filter }
}

const BASE_VOICES = [
	{ detune: 0, level: 0.26 },
	{ detune: -8, level: 0.18 },
	{ detune: 8, level: 0.18 },
	{ detune: -16, level: 0.1 },
	{ detune: 16, level: 0.1 },
]

const HARMONIC_VOICES = [
	{ detune: 2, level: 0.048, octave: 2 },
	{ detune: -3, level: 0.032, octave: 3 },
	{ detune: 1, level: 0.02, octave: 4 },
	{ detune: -5, level: 0.014, octave: 5 },
]

export function createPadVoice(ctx: AudioContext, opts: PadVoiceOptions) {
	const out = ctx.createGain()
	out.gain.value = 1

	const padBus = ctx.createGain()
	const voices = [...BASE_VOICES, ...HARMONIC_VOICES]

	const oscs = voices.map((v) => {
		const osc = ctx.createOscillator()
		const gain = ctx.createGain()
		osc.type = 'sine'
		osc.detune.value = v.detune
		gain.gain.value = v.level
		osc.connect(gain)
		gain.connect(padBus)
		return { osc, gain, octave: v.octave ?? 1 }
	})

	const chorusA = connectChorusLfo(
		ctx,
		0.06,
		6.5,
		oscs.slice(0, 3).map(({ osc }) => osc),
	)
	const chorusB = connectChorusLfo(
		ctx,
		0.11,
		5,
		oscs.slice(3, 5).map(({ osc }) => osc),
	)

	const breath = ctx.createOscillator()
	const breathDepth = ctx.createGain()
	breath.frequency.value = 0.05
	breathDepth.gain.value = 0.075
	breath.connect(breathDepth)
	breathDepth.connect(padBus.gain)

	const tone = ctx.createBiquadFilter()
	tone.type = 'lowpass'
	tone.frequency.value = opts.toneHz
	tone.Q.value = opts.toneQ

	const warmth = ctx.createBiquadFilter()
	warmth.type = 'lowpass'
	warmth.frequency.value = opts.warmthHz
	warmth.Q.value = opts.warmthQ

	padBus.connect(tone)
	tone.connect(warmth)

	let tail: AudioNode = warmth
	if (opts.resonanceHz != null && opts.resonanceQ != null && opts.resonanceGain != null) {
		const peak = ctx.createBiquadFilter()
		peak.type = 'peaking'
		peak.frequency.value = opts.resonanceHz
		peak.Q.value = opts.resonanceQ
		peak.gain.value = opts.resonanceGain
		warmth.connect(peak)
		tail = peak
	}

	tail.connect(out)

	const grainBuffer = createGrainBuffer(ctx)
	const grainBus = ctx.createGain()
	grainBus.connect(out)

	const bodyFilter = ctx.createBiquadFilter()
	bodyFilter.type = 'lowpass'
	bodyFilter.frequency.value = 460
	bodyFilter.Q.value = 0.35

	const brightFilter = ctx.createBiquadFilter()
	brightFilter.type = 'bandpass'
	brightFilter.frequency.value = 1180
	brightFilter.Q.value = 0.65

	const bodyGrain = addGrainLayer(
		ctx,
		grainBuffer,
		grainBus,
		bodyFilter,
		opts.grainLevel,
	)
	const brightGrain = addGrainLayer(
		ctx,
		grainBuffer,
		grainBus,
		brightFilter,
		opts.grainBrightLevel ?? opts.grainLevel * 0.55,
	)

	const grainDrift = ctx.createOscillator()
	const grainDriftDepth = ctx.createGain()
	grainDrift.frequency.value = 0.35
	grainDriftDepth.gain.value = opts.grainLevel * 0.55
	grainDrift.connect(grainDriftDepth)
	grainDriftDepth.connect(bodyGrain.gain.gain)

	const grainShimmer = ctx.createOscillator()
	const grainShimmerDepth = ctx.createGain()
	grainShimmer.frequency.value = 6.2
	grainShimmerDepth.gain.value = (opts.grainBrightLevel ?? opts.grainLevel * 0.55) * 0.35
	grainShimmer.connect(grainShimmerDepth)
	grainShimmerDepth.connect(brightGrain.gain.gain)

	const lfos = [chorusA, chorusB, breath, grainDrift, grainShimmer]
	const grains = [bodyGrain, brightGrain]

	return {
		output: out,
		setParams(p: { freq: number; amp: number }) {
			const t = ctx.currentTime
			const bright = 0.3 + p.amp * 0.55
			oscs.forEach(({ osc, octave }) =>
				osc.frequency.setTargetAtTime(p.freq * octave, t, PAD_SMOOTH),
			)
			tone.frequency.setTargetAtTime(
				opts.toneHz * 0.65 + p.freq * bright * 1.2,
				t,
				PAD_SMOOTH,
			)
			warmth.frequency.setTargetAtTime(
				opts.warmthHz * 0.68 + p.freq * bright * 0.48,
				t,
				PAD_SMOOTH,
			)
			if (tail instanceof BiquadFilterNode && tail.type === 'peaking') {
				tail.frequency.setTargetAtTime(p.freq * 1.01, t, PAD_SMOOTH)
			}
			bodyFilter.frequency.setTargetAtTime(360 + p.freq * 0.85, t, PAD_SMOOTH)
			brightFilter.frequency.setTargetAtTime(860 + p.freq * 1.6, t, PAD_SMOOTH)
			bodyGrain.gain.gain.setTargetAtTime(
				opts.grainLevel * (0.82 + p.amp * 0.55),
				t,
				PAD_SMOOTH,
			)
			brightGrain.gain.gain.setTargetAtTime(
				(opts.grainBrightLevel ?? opts.grainLevel * 0.55) * (0.78 + p.amp * 0.62),
				t,
				PAD_SMOOTH,
			)
		},
		start(when: number) {
			oscs.forEach(({ osc }) => osc.start(when))
			lfos.forEach((lfo) => lfo.start(when))
			grains.forEach(({ node }) => node.start(when))
		},
		stop(_release: number, when: number) {
			const end = when + _release + 0.08
			oscs.forEach(({ osc }) => osc.stop(end))
			lfos.forEach((lfo) => lfo.stop(end))
			grains.forEach(({ node }) => node.stop(end))
		},
		dispose() {
			oscs.forEach(({ osc, gain }) => {
				osc.disconnect()
				gain.disconnect()
			})
			lfos.forEach((lfo) => lfo.disconnect())
			breathDepth.disconnect()
			grainDriftDepth.disconnect()
			grainShimmerDepth.disconnect()
			grains.forEach(({ node, gain, filter }) => {
				node.disconnect()
				gain.disconnect()
				filter.disconnect()
			})
			grainBus.disconnect()
			tone.disconnect()
			warmth.disconnect()
			if (tail !== warmth) tail.disconnect()
			padBus.disconnect()
			out.disconnect()
		},
	}
}
