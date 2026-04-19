import { SOUND_MODES } from './registry'
import type { SoundModeId } from './types'

export { getSoundMode, SOUND_MODES } from './registry'
export type { SoundAttachment, SoundContext, SoundMode, SoundModeId } from './types'

export const soundModes = SOUND_MODES.map(({ id, label }) => ({ id, label }))

export const defaultSoundModeId: SoundModeId = 'sine'
