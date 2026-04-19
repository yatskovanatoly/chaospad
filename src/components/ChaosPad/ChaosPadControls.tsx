'use client'

import { useSettingsStore } from '@/state/settingsStore'
import { soundModes } from '@/audio'
import { SpectralDebugPanel } from './spectralDebug'
import { visualizations } from './Pad/visualizations'

export function ChaosPadControls() {
	const vizId = useSettingsStore((s) => s.vizId)
	const setVizId = useSettingsStore((s) => s.setVizId)
	const spectralDebugOpen = useSettingsStore((s) => s.spectralDebugOpen)
	const setSpectralDebugOpen = useSettingsStore((s) => s.setSpectralDebugOpen)
	const soundModeId = useSettingsStore((s) => s.soundModeId)
	const setSoundModeId = useSettingsStore((s) => s.setSoundModeId)

	return (
		<div className='w-full max-w-xl shrink-0 px-6 py-4 z-10 text-sm text-white flex flex-row gap-4 items-stretch'>
			<div className='flex flex-col gap-2 flex-1 min-w-0'>
				<div className='flex flex-wrap gap-2'>
					{visualizations.map((v) => (
						<button
							key={v.id}
							onClick={() => setVizId(v.id)}
							className={`px-3 py-1 rounded border text-xs transition-colors ${vizId === v.id
									? 'border-white bg-white text-black'
									: 'border-gray-600 text-gray-400 hover:border-gray-400'
								}`}
						>
							{v.label}
						</button>
					))}
				</div>
				<label className='flex items-center gap-2 cursor-pointer'>
					<input
						type='checkbox'
						checked={spectralDebugOpen}
						onChange={(e) => setSpectralDebugOpen(e.target.checked)}
						className='rounded border-gray-600'
					/>
					<span className='text-neutral-400'>Spectrum</span>
				</label>
				<div className='flex flex-wrap gap-2'>
					{soundModes.map((s) => (
						<button
							key={s.id}
							onClick={() => setSoundModeId(s.id)}
							className={`px-3 py-1 rounded border text-xs transition-colors ${soundModeId === s.id
									? 'border-amber-200 bg-amber-100 text-black'
									: 'border-gray-600 text-gray-400 hover:border-gray-400'
								}`}
						>
							{s.label}
						</button>
					))}
				</div>
			</div>
			{spectralDebugOpen && (
				<div className='flex-1 min-h-32 min-w-[10rem] max-w-sm flex flex-col'>
					<SpectralDebugPanel open className='h-full' />
				</div>
			)}
		</div>
	)
}
