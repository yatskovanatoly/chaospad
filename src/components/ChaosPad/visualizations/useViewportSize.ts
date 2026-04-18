import { getViewportSize } from '@/components/AudioEngineContext/helpers/getSoundParams'
import { useEffect, useState } from 'react'

export function useViewportSize() {
	const [size, setSize] = useState(() => getViewportSize())

	useEffect(() => {
		const update = () => setSize(getViewportSize())
		window.addEventListener('resize', update)
		const vv = window.visualViewport
		vv?.addEventListener('resize', update)
		vv?.addEventListener('scroll', update)
		return () => {
			window.removeEventListener('resize', update)
			vv?.removeEventListener('resize', update)
			vv?.removeEventListener('scroll', update)
		}
	}, [])

	return size
}
