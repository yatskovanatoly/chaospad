import type { AudioEngine } from '@/audio/engine/AudioEngine'
import type { QuantizeMode } from '@/audio/engine/helpers/quantizeFreq'
import type { Voice } from '@/audio/engine/Voice'
import { getSoundMode } from '@/audio/sounds/registry'
import type { SoundAttachment, SoundContext, SoundModeId } from '@/audio/sounds/types'

export type VoiceControllerOptions = {
	engine: AudioEngine
	position: { nx: number; ny: number }
	quantize: QuantizeMode
	modeId: SoundModeId
	getXyArray: () => Float32Array | undefined
}

export class VoiceController {
	private readonly engine: AudioEngine
	private readonly voice: Voice
	private readonly getXyArray: () => Float32Array | undefined
	private attachment: SoundAttachment
	private modeId: SoundModeId

	constructor({ engine, position, quantize, modeId, getXyArray }: VoiceControllerOptions) {
		this.engine = engine
		this.getXyArray = getXyArray
		this.voice = engine.createVoice(position, quantize)
		this.modeId = modeId
		this.attachment = this.attachMode(modeId)
	}

	setMode(modeId: SoundModeId) {
		if (modeId === this.modeId) return
		this.attachment.dispose()
		this.modeId = modeId
		this.attachment = this.attachMode(modeId)
	}

	setPosition(nx: number, ny: number) {
		this.voice.updatePosition(nx, ny)
	}

	setQuantize(q: QuantizeMode) {
		this.voice.quantize = q
	}

	notifyXyUpdate() {
		this.attachment.onXyUpdate?.()
	}

	stop(release: number) {
		this.attachment.dispose()
		this.voice.stop(release)
	}

	private attachMode(modeId: SoundModeId): SoundAttachment {
		const ctx: SoundContext = {
			engine: this.engine,
			voice: this.voice,
			getXyArray: this.getXyArray,
		}
		return getSoundMode(modeId).attach(ctx)
	}
}
