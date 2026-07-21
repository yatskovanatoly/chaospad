import { unlockAudioContext } from '@/components/AudioEngineContext/helpers/unlockAudioContext'
import { useAudioEngine } from '@/components/AudioEngineContext/useAudioEngine'
import { useLayoutEffect } from 'react'

const UNLOCK_OPTS = { capture: true, passive: true } as const

/** iOS / Safari require a user gesture before AudioContext can run. */
export function useAudioUnlock() {
	const engine = useAudioEngine()

	useLayoutEffect(() => {
		const unlock = () => {
			unlockAudioContext(engine.ctx)
		}

		document.addEventListener('touchstart', unlock, UNLOCK_OPTS)
		document.addEventListener('pointerdown', unlock, UNLOCK_OPTS)
		document.addEventListener('click', unlock, UNLOCK_OPTS)

		return () => {
			document.removeEventListener('touchstart', unlock, UNLOCK_OPTS)
			document.removeEventListener('pointerdown', unlock, UNLOCK_OPTS)
			document.removeEventListener('click', unlock, UNLOCK_OPTS)
		}
	}, [engine])
}
