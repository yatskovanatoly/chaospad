export type PresetParams = {
	freq: number
	amp: number
}

export type PresetVoice = {
	readonly output: GainNode
	setParams: (p: PresetParams) => void
	start: (when: number) => void
	stop: (release: number, when: number) => void
	dispose: () => void
}

export type PresetId = 0 | 1

export type PresetFactory = (ctx: AudioContext) => PresetVoice
