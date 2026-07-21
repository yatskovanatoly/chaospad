'use client'

import { AudioEngine } from '@/components/AudioEngineContext/AudioEngine'
import { useEffect, useState } from 'react'
import { AudioEngineContext } from './AudioEngineContext'

export default function AudioEngineProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [engine] = useState(() => new AudioEngine())

	useEffect(() => {
		return () => {
			void engine.ctx.close()
		}
	}, [engine])

	return (
		<AudioEngineContext.Provider value={engine}>
			{children}
		</AudioEngineContext.Provider>
	)
}
