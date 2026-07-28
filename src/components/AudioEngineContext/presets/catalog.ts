import { hashUserIndex } from '@/components/WsContext/helpers/getUserParams'
import { createFmBell } from './fmBell'
import { createFilteredSaw } from './filteredSaw'
import { createNoiseRes } from './noiseRes'
import { createSineChorus } from './sineChorus'
import type { PresetFactory, PresetId, PresetVoice } from './types'

const PRESETS: PresetFactory[] = [
	createSineChorus,
	createFmBell,
	createFilteredSaw,
	createNoiseRes,
]

export const PRESET_COUNT = PRESETS.length

export function getPresetForUser(userId: string | undefined): PresetId {
	const index = hashUserIndex(userId, PRESET_COUNT)
	return index as PresetId
}

export function createPresetVoice(
	ctx: AudioContext,
	presetId: PresetId,
): PresetVoice {
	return PRESETS[presetId](ctx)
}

export type { PresetId, PresetVoice }
