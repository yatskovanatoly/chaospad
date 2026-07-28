'use client'

import { useChaospadConfig } from '@/context/ChaospadConfigContext'
import { trackMotion } from '@/components/ChaosPad/visual/motionTracker'
import { createThrottledSpawn } from '@/components/ChaosPad/visual/throttledSpawn'
import { emitSplat } from '@/components/ChaosPad/visual/bridge'
import useWebSocket from '@/components/WsContext/useWebSocket'
import { useEffect, useMemo, useRef } from 'react'

const LOCAL_KEY = '__local__'

export function usePadVisual() {
	const { color, message, subscribeMotion } = useWebSocket()
	const { glowIntervalMs } = useChaospadConfig()
	const colorRef = useRef(color)
	colorRef.current = color

	const spawn = useMemo(
		() => createThrottledSpawn(glowIntervalMs),
		[glowIntervalMs],
	)

	useEffect(() => {
		return subscribeMotion(({ pos, type }) => {
			if (!pos) return
			if (type === 'stop') {
				emitSplat(pos.nx, pos.ny, colorRef.current, LOCAL_KEY, { stopped: true })
				return
			}
			spawn(
				pos.nx,
				pos.ny,
				colorRef.current,
				type,
				LOCAL_KEY,
				trackMotion(pos.nx, pos.ny, LOCAL_KEY),
			)
		})
	}, [spawn, subscribeMotion])

	useEffect(() => {
		if (!message?.userId) return
		const { nx, ny, color: c, type, userId } = message
		if (type === 'stop') {
			emitSplat(nx, ny, c, userId, { stopped: true })
			return
		}
		spawn(nx, ny, c, type, userId, trackMotion(nx, ny, userId))
	}, [message, spawn])
}
