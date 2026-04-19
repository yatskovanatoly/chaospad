import type { AudioEngine } from './AudioEngine'
import { getSoundParamsFromNormalized } from './helpers/getSoundParams'
import { quantizeFreq, type QuantizeMode } from './helpers/quantizeFreq'
import { updateSoundFromNormalized } from './helpers/updateSoundFromPosition'

const ATTACK_S = 0.1

export class Voice {
	readonly oscillator: OscillatorNode
	private readonly gain: GainNode
	private readonly engine: AudioEngine
	private releaseTimer?: ReturnType<typeof setTimeout>
	quantize: QuantizeMode
	private lastNx: number
	private lastNy: number
	pitchLfoMul = 1

	constructor(
		engine: AudioEngine,
		position: { nx: number; ny: number },
		quantize: QuantizeMode = 'none',
	) {
		this.engine = engine
		this.quantize = quantize
		this.lastNx = position.nx
		this.lastNy = position.ny
		const ctx = engine.ctx

		this.oscillator = ctx.createOscillator()
		this.gain = ctx.createGain()
		this.oscillator.type = 'sine'
		const { freq: rawFreq, amp } = getSoundParamsFromNormalized(position.nx, position.ny)
		this.oscillator.frequency.value = quantizeFreq(rawFreq, quantize) * this.pitchLfoMul
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
		this.lastNx = nx
		this.lastNy = ny
		const gainMul = this.oscillator.type === 'custom' ? 1.38 : 1
		updateSoundFromNormalized(
			nx,
			ny,
			this.engine.ctx,
			this.oscillator,
			this.gain,
			this.quantize,
			gainMul,
			this.pitchLfoMul,
		)
	}

	setPitchLfoMul(m: number) {
		this.pitchLfoMul = m
		const gainMul = this.oscillator.type === 'custom' ? 1.38 : 1
		updateSoundFromNormalized(
			this.lastNx,
			this.lastNy,
			this.engine.ctx,
			this.oscillator,
			this.gain,
			this.quantize,
			gainMul,
			this.pitchLfoMul,
		)
	}

	setOscillatorType(type: 'sine') {
		this.oscillator.type = type
	}

	setOscillatorWave(wave: PeriodicWave) {
		this.oscillator.setPeriodicWave(wave)
	}

	refreshPosition() {
		this.updatePosition(this.lastNx, this.lastNy)
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
