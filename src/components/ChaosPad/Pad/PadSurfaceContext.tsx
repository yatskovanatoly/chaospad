'use client'

import {
	createContext,
	useContext,
	useLayoutEffect,
	useRef,
	useState,
	type RefObject,
} from 'react'

type PadSurfaceValue = {
	padRef: RefObject<HTMLDivElement | null>
	width: number
	height: number
}

const PadSurfaceContext = createContext<PadSurfaceValue | null>(null)

export function PadSurfaceProvider({ children }: { children: React.ReactNode }) {
	const padRef = useRef<HTMLDivElement>(null)
	const [size, setSize] = useState({ width: 0, height: 0 })

	useLayoutEffect(() => {
		const el = padRef.current
		if (!el) return
		const ro = new ResizeObserver(() => {
			const r = el.getBoundingClientRect()
			setSize({ width: r.width, height: r.height })
		})
		ro.observe(el)
		return () => ro.disconnect()
	}, [])

	return (
		<PadSurfaceContext.Provider value={{ padRef, ...size }}>
			<div ref={padRef} className='relative flex-1 min-h-0 w-full overflow-hidden'>
				{children}
			</div>
		</PadSurfaceContext.Provider>
	)
}

export function usePadSurface() {
	const ctx = useContext(PadSurfaceContext)
	if (!ctx) throw new Error('usePadSurface must be used within PadSurfaceProvider')
	return ctx
}
