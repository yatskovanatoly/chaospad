import { createImpulseResponse } from './helpers/createImpulseResponse'
import { type QuantizeMode } from './helpers/quantizeFreq'
import { Voice } from './Voice'

export class AudioEngine {
	readonly ctx: AudioContext
	readonly convolver: ConvolverNode
	readonly convolverGain: GainNode
	readonly masterGain: GainNode
	readonly tremoloGain: GainNode
	readonly masterAnalyser: AnalyserNode

	constructor() {
		this.ctx = new AudioContext({ latencyHint: 'playback' })
		const impulse = createImpulseResponse(this.ctx)
		this.convolver = this.ctx.createConvolver()
		this.convolver.buffer = impulse
		this.convolverGain = this.ctx.createGain()
		this.masterGain = this.ctx.createGain()
		this.tremoloGain = this.ctx.createGain()
		this.tremoloGain.gain.value = 1
		this.masterAnalyser = this.ctx.createAnalyser()
		this.masterAnalyser.fftSize = 1024
		this.masterAnalyser.smoothingTimeConstant = 0.12
		this.convolver.connect(this.convolverGain)
		this.convolverGain.connect(this.masterGain)
		this.masterGain.connect(this.tremoloGain)
		this.tremoloGain.connect(this.masterAnalyser)
		this.masterAnalyser.connect(this.ctx.destination)
	}

	setVolume(v: number) {
		this.masterGain.gain.value = v
	}

	setReverbLevel(v: number) {
		this.convolverGain.gain.value = v
	}

	createVoice(position: { nx: number; ny: number }, quantize: QuantizeMode = 'none') {
		return new Voice(this, position, quantize)
	}
}

export { Voice }
