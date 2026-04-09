'use client'

import { AudioEngine } from '@/components/AudioEngineContext/AudioEngine'
import { useEffect, useState } from 'react'
import { AudioEngineContext } from './AudioEngineContext'

export default function AudioEngineProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [engine, setEngine] = useState<AudioEngine | null>(null)

	useEffect(() => {
		const _engine = new AudioEngine()
		setEngine(_engine)

		return () => {
			_engine.ctx.close()
		}
	}, [])

	if (!engine) return null

	return (
		<AudioEngineContext.Provider value={engine}>
			{children}
		</AudioEngineContext.Provider>
	)
}
