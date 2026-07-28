import { createImpulseResponse } from './helpers/createImpulseResponse'
import { createAudioContext, unlockAudioForGesture } from './helpers/unlockAudioContext'
import type { QuantizeMode } from './helpers/quantizeFreq'
import type { PresetId } from './presets/catalog'
import { Voice } from './Voice'

export class AudioEngine {
	private ctx: AudioContext | null = null
	private masterGain: GainNode | null = null
	private convolver: ConvolverNode | null = null
	private convolverGain: GainNode | null = null
	private graphReady = false
	private volumeValue = 1
	private reverbLevelValue = 0.5

	unlock(): AudioContext {
		if (!this.ctx) this.ctx = createAudioContext()
		if (!this.graphReady) {
			this.initGraph()
			this.graphReady = true
		}
		unlockAudioForGesture(this.ctx)
		return this.ctx
	}

	close() {
		if (!this.ctx) return
		void this.ctx.close()
		this.ctx = null
		this.masterGain = null
		this.convolver = null
		this.convolverGain = null
		this.graphReady = false
	}

	setVolume(v: number) {
		this.volumeValue = v
		if (this.masterGain) this.masterGain.gain.value = v
	}

	setReverbLevel(v: number) {
		this.reverbLevelValue = v
		if (this.convolverGain) this.convolverGain.gain.value = v
	}

	createVoice(
		position: { nx: number; ny: number },
		quantize: QuantizeMode = 'none',
		presetId: PresetId = 0,
	) {
		this.unlock()
		return new Voice(this, position, quantize, presetId)
	}

	connectDry(node: AudioNode) {
		node.connect(this.masterGain!)
	}

	connectWet(node: AudioNode) {
		if (this.convolver) node.connect(this.convolver)
	}

	getContextForVoice() {
		if (!this.ctx || !this.masterGain) {
			throw new Error('AudioEngine.unlock() must be called before playback')
		}
		return this.ctx
	}

	private initGraph() {
		const ctx = this.ctx!
		this.masterGain = ctx.createGain()
		this.masterGain.gain.value = this.volumeValue
		this.masterGain.connect(ctx.destination)

		try {
			const impulse = createImpulseResponse(ctx)
			this.convolver = ctx.createConvolver()
			this.convolver.buffer = impulse
			this.convolverGain = ctx.createGain()
			this.convolverGain.gain.value = this.reverbLevelValue
			this.convolver.connect(this.convolverGain)
			this.convolverGain.connect(this.masterGain)
		} catch {
			this.convolver = null
			this.convolverGain = null
		}
	}
}

export { Voice } from './Voice'
