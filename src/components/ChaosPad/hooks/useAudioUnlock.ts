import { useAudioEngine } from '@/components/AudioEngineContext/useAudioEngine'
import { useLayoutEffect } from 'react'

const UNLOCK_OPTS = { capture: true, passive: true } as const

/** iOS / Safari require a user gesture before AudioContext can run. */
export function useAudioUnlock() {
	const engine = useAudioEngine()

	useLayoutEffect(() => {
		const unlock = () => {
			engine.unlock()
		}

		const onVisible = () => {
			if (document.visibilityState === 'visible') unlock()
		}

		document.addEventListener('touchstart', unlock, UNLOCK_OPTS)
		document.addEventListener('touchend', unlock, UNLOCK_OPTS)
		document.addEventListener('pointerdown', unlock, UNLOCK_OPTS)
		document.addEventListener('pointerup', unlock, UNLOCK_OPTS)
		document.addEventListener('click', unlock, UNLOCK_OPTS)
		document.addEventListener('visibilitychange', onVisible)

		return () => {
			document.removeEventListener('touchstart', unlock, UNLOCK_OPTS)
			document.removeEventListener('touchend', unlock, UNLOCK_OPTS)
			document.removeEventListener('pointerdown', unlock, UNLOCK_OPTS)
			document.removeEventListener('pointerup', unlock, UNLOCK_OPTS)
			document.removeEventListener('click', unlock, UNLOCK_OPTS)
			document.removeEventListener('visibilitychange', onVisible)
		}
	}, [engine])
}
