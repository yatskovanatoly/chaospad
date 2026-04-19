import { useCallback, useRef, useState } from 'react'

export type Particle = { id: number; nx: number; ny: number; color: string }

const LIFETIME_MS = 500

export function useParticles() {
	const [particles, setParticles] = useState<Particle[]>([])
	const counter = useRef(0)

	const spawn = useCallback((nx: number, ny: number, color: string) => {
		const id = counter.current++
		setParticles((prev) => [...prev, { id, nx, ny, color }])
		setTimeout(() => setParticles((prev) => prev.filter((p) => p.id !== id)), LIFETIME_MS)
	}, [])

	return { particles, spawn }
}
