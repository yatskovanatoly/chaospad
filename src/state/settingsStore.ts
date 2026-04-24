'use client'

import { create } from 'zustand'
import type { QuantizeMode } from '@/audio/engine/helpers/quantizeFreq'
import { defaultSoundModeId, type SoundModeId } from '@/audio'

export type SettingsState = {
	spectralDebugOpen: boolean
	release: number
	reverbLevel: number
	volume: number
	quantize: QuantizeMode
	soundModeId: SoundModeId
	setSpectralDebugOpen: (open: boolean) => void
	setRelease: (v: number) => void
	setReverbLevel: (v: number) => void
	setVolume: (v: number) => void
	setQuantize: (v: QuantizeMode) => void
	setSoundModeId: (id: SoundModeId) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
	spectralDebugOpen: false,
	release: 0.5,
	reverbLevel: 0.5,
	volume: 1,
	quantize: 'chromatic',
	soundModeId: defaultSoundModeId,
	setSpectralDebugOpen: (open) => set({ spectralDebugOpen: open }),
	setRelease: (release) => set({ release }),
	setReverbLevel: (reverbLevel) => set({ reverbLevel }),
	setVolume: (volume) => set({ volume }),
	setQuantize: (quantize) => set({ quantize }),
	setSoundModeId: (soundModeId) => set({ soundModeId }),
}))

export const settingsStore = useSettingsStore
