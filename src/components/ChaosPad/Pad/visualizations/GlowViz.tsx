'use client'

import { usePadEvents } from '@/state/hooks/usePadEvents'
import type { WireMessage } from '@/type'
import { padEventStore, type PadEventStoreState } from '@/state/padEventStore'
import { useCallback, useEffect } from 'react'
import { usePadSurface } from '../PadSurfaceContext'
import { useParticles } from './useParticles'

const SIZE = 50
const REMOTE_TICK_MS = 50
const REMOTE_THROTTLE_MS = 50

export default function GlowViz() {
	const { width, height } = usePadSurface()
	const { particles, spawn } = useParticles()

	const onLocal = useCallback(
		(e: { nx: number; ny: number; color: string }) => spawn(e.nx, e.ny, e.color),
		[spawn],
	)
	const onRemote = useCallback((msg: WireMessage) => {
		if (msg.type === 'stop') spawn(msg.nx, msg.ny, msg.color)
	}, [spawn])

	usePadEvents({ onLocal, onRemote })

	useEffect(() => {
		let prevRemotes: PadEventStoreState['remotes'] | undefined
		let intervalId: number | null = null
		const lastPulseByUser = new Map<string, number>()
		const prevUpdatedAt = new Map<string, number>()

		const tick = () => {
			const now = Date.now()
			const remotes = padEventStore.getState().remotes
			let anyHeld = false
			for (const [uid, r] of Object.entries(remotes)) {
				if (r.type !== 'start' && r.type !== 'move') continue
				anyHeld = true
				const last = lastPulseByUser.get(uid) ?? 0
				if (now - last < REMOTE_THROTTLE_MS) continue
				lastPulseByUser.set(uid, now)
				spawn(r.nx, r.ny, r.color)
			}
			for (const uid of [...lastPulseByUser.keys()]) {
				const cr = remotes[uid]
				if (!cr || (cr.type !== 'start' && cr.type !== 'move')) lastPulseByUser.delete(uid)
			}
			if (!anyHeld && intervalId != null) {
				window.clearInterval(intervalId)
				intervalId = null
			}
		}

		const onStore = (s: PadEventStoreState) => {
			if (prevRemotes !== undefined && s.remotes === prevRemotes) return
			prevRemotes = s.remotes

			const now = Date.now()
			for (const [uid, r] of Object.entries(s.remotes)) {
				if (r.type !== 'start' && r.type !== 'move') continue
				if (prevUpdatedAt.get(uid) === r.updatedAt) continue
				prevUpdatedAt.set(uid, r.updatedAt)
				spawn(r.nx, r.ny, r.color)
				lastPulseByUser.set(uid, now)
			}
			for (const uid of [...prevUpdatedAt.keys()]) {
				if (!s.remotes[uid]) prevUpdatedAt.delete(uid)
			}

			const hasHeld = Object.values(s.remotes).some(
				(r) => r.type === 'start' || r.type === 'move',
			)
			if (hasHeld && intervalId == null) {
				intervalId = window.setInterval(tick, REMOTE_TICK_MS)
			}
			if (!hasHeld && intervalId != null) {
				window.clearInterval(intervalId)
				intervalId = null
			}
		}

		const unsub = padEventStore.subscribe(onStore)
		onStore(padEventStore.getState())

		return () => {
			unsub()
			if (intervalId != null) window.clearInterval(intervalId)
		}
	}, [spawn])

	return (
		<div className='absolute inset-0 pointer-events-none overflow-hidden'>
			{particles.map((p) => (
				<div
					key={p.id}
					className={`absolute rounded-full border-4 opacity-60 blur-xs ${p.color}`}
					style={{
						left: p.nx * width - SIZE / 2,
						top: p.ny * height - SIZE / 2,
						width: SIZE,
						height: SIZE,
						animation: 'glow-effect .5s ease-in-out',
					}}
				/>
			))}
		</div>
	)
}
