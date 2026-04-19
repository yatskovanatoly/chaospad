'use client'

import { useSettingsStore } from '@/state/settingsStore'
import { visualizations } from './visualizations'

export function ActiveViz() {
	const vizId = useSettingsStore((s) => s.vizId)
	const Comp = visualizations.find((v) => v.id === vizId)?.component ?? visualizations[0].component
	return <Comp />
}
