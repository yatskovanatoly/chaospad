import { createImpulseResponse } from './helpers/createImpulseResponse'
import { createAudioContext, unlockAudioForGesture } from './helpers/unlockAudioContext'
import type { QuantizeMode } from './helpers/quantizeFreq'
import type { PresetId } from './presets/catalog'
import { Voice } from './Voice'

type VoiceRoute = {
	dry: GainNode
	send: GainNode
}

export class AudioEngine {
	private ctx: AudioContext | null = null
	private masterGain: GainNode | null = null
	private limiter: DynamicsCompressorNode | null = null
	private drySum: GainNode | null = null
	private reverbSendSum: GainNode | null = null
	private reverbSendTrim: GainNode | null = null
	private convolver: ConvolverNode | null = null
	private convolverGain: GainNode | null = null
	private graphReady = false
	private volumeValue = 1
	private reverbLevelValue = 0.5
	private voiceRoutes: VoiceRoute[] = []

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
		this.limiter = null
		this.drySum = null
		this.reverbSendSum = null
		this.reverbSendTrim = null
		this.convolver = null
		this.convolverGain = null
		this.voiceRoutes = []
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

	createVoiceRoute(): VoiceRoute {
		const ctx = this.getContextForVoice()
		const dry = ctx.createGain()
		const send = ctx.createGain()
		dry.connect(this.drySum!)
		send.connect(this.reverbSendSum!)
		const route = { dry, send }
		this.voiceRoutes.push(route)
		this.rebalanceVoices(ctx)
		return route
	}

	releaseVoiceRoute(route: VoiceRoute) {
		const idx = this.voiceRoutes.indexOf(route)
		if (idx === -1) return
		this.voiceRoutes.splice(idx, 1)
		route.dry.disconnect()
		route.send.disconnect()
		if (this.ctx) this.rebalanceVoices(this.ctx)
	}

	getContextForVoice() {
		if (!this.ctx || !this.masterGain) {
			throw new Error('AudioEngine.unlock() must be called before playback')
		}
		return this.ctx
	}

	private rebalanceVoices(ctx: AudioContext) {
		const n = Math.max(1, this.voiceRoutes.length)
		const scale = 1 / Math.sqrt(n)
		const t = ctx.currentTime
		for (const route of this.voiceRoutes) {
			route.dry.gain.setTargetAtTime(scale, t, 0.06)
			route.send.gain.setTargetAtTime(scale, t, 0.06)
		}
	}

	private initGraph() {
		const ctx = this.ctx!

		this.drySum = ctx.createGain()
		this.reverbSendSum = ctx.createGain()
		this.reverbSendTrim = ctx.createGain()
		this.reverbSendTrim.gain.value = 0.72

		this.masterGain = ctx.createGain()
		this.masterGain.gain.value = this.volumeValue

		this.limiter = ctx.createDynamicsCompressor()
		this.limiter.threshold.value = -14
		this.limiter.knee.value = 12
		this.limiter.ratio.value = 4
		this.limiter.attack.value = 0.004
		this.limiter.release.value = 0.22

		this.drySum.connect(this.masterGain)

		try {
			const impulse = createImpulseResponse(ctx)
			this.convolver = ctx.createConvolver()
			this.convolver.buffer = impulse
			this.convolverGain = ctx.createGain()
			this.convolverGain.gain.value = this.reverbLevelValue

			this.reverbSendSum.connect(this.reverbSendTrim)
			this.reverbSendTrim.connect(this.convolver)
			this.convolver.connect(this.convolverGain)
			this.convolverGain.connect(this.masterGain)
		} catch {
			this.convolver = null
			this.convolverGain = null
		}

		this.masterGain.connect(this.limiter)
		this.limiter.connect(ctx.destination)
	}
}

export { Voice } from './Voice'
