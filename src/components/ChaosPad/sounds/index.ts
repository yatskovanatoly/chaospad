export type SoundModeId = 'sine' | 'padWaveform'

type SoundMode = {
	id: SoundModeId
	label: string
}

export const soundModes: SoundMode[] = [
	{ id: 'sine', label: 'Sine' },
	{ id: 'padWaveform', label: 'Buffer' },
]

export const defaultSoundModeId: SoundModeId = 'sine'
