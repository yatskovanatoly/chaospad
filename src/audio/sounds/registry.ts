import { padWaveformMode } from './padWaveform/padWaveformMode'
import { pitchLfoBufferMode } from './pitchLfoBuffer/pitchLfoBufferMode'
import { sineMode } from './sine/sineMode'
import { speedPitchMode } from './speedPitch/speedPitchMode'
import type { SoundMode, SoundModeId } from './types'
import { volumeLfoBufferMode } from './volumeLfoBuffer/volumeLfoBufferMode'

export const SOUND_MODES: SoundMode[] = [
	sineMode,
	padWaveformMode,
	volumeLfoBufferMode,
	pitchLfoBufferMode,
	speedPitchMode,
]

const byId = new Map(SOUND_MODES.map((m) => [m.id, m]))

export const getSoundMode = (id: SoundModeId): SoundMode => {
	const m = byId.get(id)
	if (!m) throw new Error(`Unknown sound mode: ${id}`)
	return m
}
