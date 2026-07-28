import { hashUserIndex } from '@/components/WsContext/helpers/getUserParams'
import { createAmbientPad } from './ambientPad'
import { createResonantPad } from './resonantPad'
import type { PresetFactory, PresetId, PresetVoice } from './types'

const PRESETS: PresetFactory[] = [createAmbientPad, createResonantPad]

export const PRESET_COUNT = PRESETS.length

export function getPresetForUser(userId: string | undefined): PresetId {
	return hashUserIndex(userId, PRESET_COUNT) as PresetId
}

export function createPresetVoice(ctx: AudioContext, presetId: PresetId): PresetVoice {
	return PRESETS[presetId](ctx)
}

export type { PresetId, PresetVoice }
