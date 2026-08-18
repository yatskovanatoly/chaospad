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
		const w = window as Window & {
			requestIdleCallback?: (cb: () => void) => number
			cancelIdleCallback?: (handle: number) => void
		}
		const prewarm = () => engine.prewarm()
		const idle = w.requestIdleCallback?.(prewarm)
		const timer = idle == null ? setTimeout(prewarm, 400) : undefined

		return () => {
			if (idle != null) w.cancelIdleCallback?.(idle)
			if (timer) clearTimeout(timer)
			engine.close()
		}
	}, [engine])

	return (
		<AudioEngineContext.Provider value={engine}>
			{children}
		</AudioEngineContext.Provider>
	)
}
