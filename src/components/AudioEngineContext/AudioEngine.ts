import { createImpulseResponse } from './helpers/createImpulseResponse'
import { getSoundParamsFromXY } from './helpers/getSoundParams'
import { updateSoundFromPosition } from './helpers/updateSoundFromPosition'

const ATTACK_S = 0.1

export class AudioEngine {
	readonly ctx: AudioContext
	readonly convolver: ConvolverNode
	readonly convolverGain: GainNode
	readonly masterGain: GainNode

	constructor() {
		this.ctx = new AudioContext()
		const impulse = createImpulseResponse(this.ctx)
		this.convolver = this.ctx.createConvolver()
		this.convolver.buffer = impulse
		this.convolverGain = this.ctx.createGain()
		this.masterGain = this.ctx.createGain()
		this.convolver.connect(this.convolverGain)
		this.convolverGain.connect(this.masterGain)
		this.masterGain.connect(this.ctx.destination)
	}

	setVolume(v: number) {
		this.masterGain.gain.value = v
	}

	setReverbLevel(v: number) {
		this.convolverGain.gain.value = v
	}

	createVoice(position: { x: number; y: number }) {
		return new Voice(this, position)
	}
}

export class Voice {
	readonly oscillator: OscillatorNode
	private readonly gain: GainNode
	private readonly engine: AudioEngine
	private releaseTimer?: ReturnType<typeof setTimeout>

	constructor(engine: AudioEngine, position: { x: number; y: number }) {
		this.engine = engine
		const ctx = engine.ctx
		this.oscillator = ctx.createOscillator()
		this.gain = ctx.createGain()
		this.oscillator.type = 'sine'
		const { freq, amp } = getSoundParamsFromXY(position.x, position.y)
		this.oscillator.frequency.value = freq
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

	updatePosition(x: number, y: number) {
		updateSoundFromPosition(
			x,
			y,
			this.engine.ctx,
			this.oscillator,
			this.gain
		)
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

