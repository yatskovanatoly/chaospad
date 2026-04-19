'use client'

import { create } from 'zustand'
import type { QuantizeMode } from '@/audio/engine/helpers/quantizeFreq'
import { defaultSoundModeId, type SoundModeId } from '@/audio'
import { visualizations } from '@/components/ChaosPad/Pad/visualizations'

export type SettingsState = {
	vizId: string
	spectralDebugOpen: boolean
	release: number
	reverbLevel: number
	volume: number
	quantize: QuantizeMode
	soundModeId: SoundModeId
	setVizId: (id: string) => void
	setSpectralDebugOpen: (open: boolean) => void
	setRelease: (v: number) => void
	setReverbLevel: (v: number) => void
	setVolume: (v: number) => void
	setQuantize: (v: QuantizeMode) => void
	setSoundModeId: (id: SoundModeId) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
	vizId: visualizations[0].id,
	spectralDebugOpen: false,
	release: 0.5,
	reverbLevel: 0.5,
	volume: 1,
	quantize: 'chromatic',
	soundModeId: defaultSoundModeId,
	setVizId: (id) => {
		if (visualizations.some((v) => v.id === id)) set({ vizId: id })
	},
	setSpectralDebugOpen: (open) => set({ spectralDebugOpen: open }),
	setRelease: (release) => set({ release }),
	setReverbLevel: (reverbLevel) => set({ reverbLevel }),
	setVolume: (volume) => set({ volume }),
	setQuantize: (quantize) => set({ quantize }),
	setSoundModeId: (soundModeId) => set({ soundModeId }),
}))

export const settingsStore = useSettingsStore
