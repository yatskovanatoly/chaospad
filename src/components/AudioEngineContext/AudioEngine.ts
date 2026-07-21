import { createImpulseResponse } from './helpers/createImpulseResponse'
import { createAudioContext, unlockAudioForGesture } from './helpers/unlockAudioContext'
import { getSoundParamsFromXY } from './helpers/getSoundParams'
import { quantizeFreq, type QuantizeMode } from './helpers/quantizeFreq'
import { updateSoundFromPosition } from './helpers/updateSoundFromPosition'

const ATTACK_S = 0.1

export class AudioEngine {
	private ctx: AudioContext | null = null
	private masterGain: GainNode | null = null
	private convolver: ConvolverNode | null = null
	private convolverGain: GainNode | null = null
	private graphReady = false
	private volumeValue = 1
	private reverbLevelValue = 0.5

	/** Create/resume AudioContext inside a user-gesture handler (required on iOS). */
	unlock(): AudioContext {
		if (!this.ctx) {
			this.ctx = createAudioContext()
		}
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

	private getContext(): AudioContext {
		if (!this.ctx || !this.masterGain) {
			throw new Error('AudioEngine.unlock() must be called before playback')
		}
		return this.ctx
	}

	setVolume(v: number) {
		this.volumeValue = v
		if (this.masterGain) this.masterGain.gain.value = v
	}

	setReverbLevel(v: number) {
		this.reverbLevelValue = v
		if (this.convolverGain) this.convolverGain.gain.value = v
	}

	createVoice(position: { nx: number; ny: number }, quantize: QuantizeMode = 'none') {
		this.unlock()
		return new Voice(this, position, quantize)
	}

	connectVoiceOutput(gain: GainNode) {
		gain.connect(this.masterGain!)
		if (this.convolver) gain.connect(this.convolver)
	}

	getContextForVoice() {
		return this.getContext()
	}
}

export class Voice {
	readonly oscillator: OscillatorNode
	private readonly gain: GainNode
	private readonly engine: AudioEngine
	private releaseTimer?: ReturnType<typeof setTimeout>
	quantize: QuantizeMode

	constructor(engine: AudioEngine, position: { nx: number; ny: number }, quantize: QuantizeMode = 'none') {
		this.engine = engine
		this.quantize = quantize
		const ctx = engine.getContextForVoice()

		this.oscillator = ctx.createOscillator()
		this.gain = ctx.createGain()
		this.oscillator.type = 'sine'
		const { freq: rawFreq, amp } = getSoundParamsFromXY(position.nx, position.ny)
		this.oscillator.frequency.value = quantizeFreq(rawFreq, quantize)
		const target = amp * 0.5
		const now = ctx.currentTime
		this.gain.gain.value = 0
		this.gain.gain.setValueAtTime(0, now)
		this.gain.gain.linearRampToValueAtTime(target, now + ATTACK_S)
		this.oscillator.connect(this.gain)
		engine.connectVoiceOutput(this.gain)
		this.oscillator.start(now + 0.001)
	}

	updatePosition(nx: number, ny: number) {
		updateSoundFromPosition(
			nx,
			ny,
			this.engine.getContextForVoice(),
			this.oscillator,
			this.gain,
			this.quantize
		)
	}

	stop(releaseSeconds: number) {
		const ctx = this.engine.getContextForVoice()
		const now = ctx.currentTime
		const g = this.gain.gain
		g.cancelScheduledValues(now)
		g.setValueAtTime(g.value, now)
		g.linearRampToValueAtTime(0, now + releaseSeconds)
		this.oscillator.stop(now + releaseSeconds + 0.05)
		if (this.releaseTimer) clearTimeout(this.releaseTimer)
		this.releaseTimer = setTimeout(() => {
			this.gain.disconnect()
			this.oscillator.disconnect()
		}, releaseSeconds * 1000 + 100)
	}
}
