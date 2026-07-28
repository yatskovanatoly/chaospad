import type { AudioEngine } from './AudioEngine'
import { getPadParams } from './helpers/padParams'
import type { QuantizeMode } from './helpers/quantizeFreq'
import { createSpatialChain } from './helpers/spatialChain'
import { createPresetVoice, type PresetId } from './presets/catalog'
import type { PresetVoice } from './presets/types'

const ATTACK_S = 0.72

export class Voice {
	private readonly preset: PresetVoice
	private readonly presetId: PresetId
	private readonly spatial: ReturnType<typeof createSpatialChain>
	private readonly engine: AudioEngine
	private readonly route: ReturnType<AudioEngine['createVoiceRoute']>
	private releaseTimer?: ReturnType<typeof setTimeout>
	quantize: QuantizeMode

	constructor(
		engine: AudioEngine,
		position: { nx: number; ny: number },
		quantize: QuantizeMode,
		presetId: PresetId,
	) {
		this.engine = engine
		this.quantize = quantize
		this.presetId = presetId
		const ctx = engine.getContextForVoice()

		this.route = engine.createVoiceRoute()
		this.preset = createPresetVoice(ctx, presetId)
		this.spatial = createSpatialChain(ctx, this.route.dry, this.route.send)
		this.preset.output.connect(this.spatial.input)

		const params = getPadParams(position.nx, position.ny, quantize, presetId)
		this.spatial.setParams(params.pan, params.reverbSend)
		const now = ctx.currentTime
		this.preset.setParams({ freq: params.freq, amp: 0 })
		this.preset.output.gain.setValueAtTime(0, now)
		this.preset.output.gain.linearRampToValueAtTime(params.amp, now + ATTACK_S)
		this.preset.start(now + 0.001)
	}

	updatePosition(nx: number, ny: number) {
		this.applyParams(getPadParams(nx, ny, this.quantize, this.presetId))
	}

	stop(releaseSeconds: number) {
		const ctx = this.engine.getContextForVoice()
		const now = ctx.currentTime
		this.preset.output.gain.cancelScheduledValues(now)
		this.preset.output.gain.setValueAtTime(this.preset.output.gain.value, now)
		this.preset.output.gain.linearRampToValueAtTime(0, now + releaseSeconds)
		this.preset.stop(releaseSeconds, now)
		if (this.releaseTimer) clearTimeout(this.releaseTimer)
		this.releaseTimer = setTimeout(() => this.dispose(), releaseSeconds * 1000 + 100)
	}

	private applyParams(params: ReturnType<typeof getPadParams>) {
		this.preset.setParams({ freq: params.freq, amp: params.amp })
		this.spatial.setParams(params.pan, params.reverbSend)
	}

	private dispose() {
		this.preset.dispose()
		this.spatial.dispose()
		this.engine.releaseVoiceRoute(this.route)
	}
}
