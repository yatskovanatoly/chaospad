import type { AudioEngine } from '@/audio/engine/AudioEngine'
import type { Voice } from '@/audio/engine/Voice'

export type SoundModeId =
	| 'sine'
	| 'padWaveform'
	| 'volumeLfoBuffer'
	| 'pitchLfoBuffer'
	| 'speedPitch'

export type SoundContext = {
	engine: AudioEngine
	voice: Voice
	getXyArray: () => Float32Array | undefined
}

export type SoundAttachment = {
	onXyUpdate?: () => void
	dispose: () => void
}

export type SoundMode = {
	id: SoundModeId
	label: string
	attach(ctx: SoundContext): SoundAttachment
}
