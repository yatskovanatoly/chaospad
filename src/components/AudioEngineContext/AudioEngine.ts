import { binsToPeriodicWave } from './helpers/binsToPeriodicWave'
import { createImpulseResponse } from './helpers/createImpulseResponse'
import { getSoundParamsFromNormalized } from './helpers/getSoundParams'
import { quantizeFreq, type QuantizeMode } from './helpers/quantizeFreq'
import { updateSoundFromNormalized } from './helpers/updateSoundFromPosition'

const ATTACK_S = 0.1

export class AudioEngine {
	readonly ctx: AudioContext
	readonly convolver: ConvolverNode
	readonly convolverGain: GainNode
	readonly masterGain: GainNode
	readonly masterAnalyser: AnalyserNode

	constructor() {
		this.ctx = new AudioContext({ latencyHint: 'playback' })
		const impulse = createImpulseResponse(this.ctx)
		this.convolver = this.ctx.createConvolver()
		this.convolver.buffer = impulse
		this.convolverGain = this.ctx.createGain()
		this.masterGain = this.ctx.createGain()
		this.masterAnalyser = this.ctx.createAnalyser()
		this.masterAnalyser.fftSize = 1024
		this.masterAnalyser.smoothingTimeConstant = 0.45
		this.convolver.connect(this.convolverGain)
		this.convolverGain.connect(this.masterGain)
		this.masterGain.connect(this.masterAnalyser)
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

export class Voice {
	readonly oscillator: OscillatorNode
	private readonly gain: GainNode
	private readonly engine: AudioEngine
	private releaseTimer?: ReturnType<typeof setTimeout>
	quantize: QuantizeMode

	constructor(engine: AudioEngine, position: { nx: number; ny: number }, quantize: QuantizeMode = 'none') {
		this.engine = engine
		this.quantize = quantize
		const ctx = engine.ctx

		this.oscillator = ctx.createOscillator()
		this.gain = ctx.createGain()
		this.oscillator.type = 'sine'
		const { freq: rawFreq, amp } = getSoundParamsFromNormalized(position.nx, position.ny)
		this.oscillator.frequency.value = quantizeFreq(rawFreq, quantize)
		const target = amp * 0.5
		const now = ctx.currentTime
		this.gain.gain.value = 0
		this.gain.gain.setValueAtTime(0, now)
		this.gain.gain.linearRampToValueAtTime(target, now + ATTACK_S)
		this.oscillator.connect(this.gain)
		this.gain.connect(engine.masterGain)
		this.gain.connect(engine.convolver)
		this.oscillator.start(now)
	}

	updatePosition(nx: number, ny: number) {
		const gainMul = this.oscillator.type === 'custom' ? 1.38 : 1
		updateSoundFromNormalized(
			nx,
			ny,
			this.engine.ctx,
			this.oscillator,
			this.gain,
			this.quantize,
			gainMul,
		)
	}

	setSoundMode(mode: 'sine' | 'padWaveform', bins?: Float32Array) {
		if (mode === 'sine') {
			this.oscillator.type = 'sine'
			return
		}
		if (!bins) return
		this.oscillator.setPeriodicWave(binsToPeriodicWave(this.engine.ctx, bins))
	}

	stop(releaseSeconds: number) {
		const ctx = this.engine.ctx
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

