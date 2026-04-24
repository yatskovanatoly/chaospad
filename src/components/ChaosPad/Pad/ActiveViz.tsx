'use client'

import { useSettingsStore } from '@/state/settingsStore'
import { vizBySoundMode } from './visualizations'

export function ActiveViz() {
	const soundModeId = useSettingsStore((s) => s.soundModeId)
	const Comp = vizBySoundMode[soundModeId] ?? vizBySoundMode.sine
	return <Comp />
}
