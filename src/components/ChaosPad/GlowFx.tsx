'use client'

import { useChaospadConfig } from '@/context/ChaospadConfigContext'
import createThrottledSpawn from '@/components/ChaosPad/helpers/throttledSpawn'
import { trackPadMotion } from '@/components/ChaosPad/helpers/padVisualBridge'
import spawnVisual from '@/components/ChaosPad/helpers/spawnVisual'
import useWebSocket from '@/components/WsContext/useWebSocket'
import React, { useEffect, useMemo, useRef } from 'react'

type GlowEffectProps = {
	containerRef: React.RefObject<HTMLDivElement | null>
}

const LOCAL_GLOW_KEY = '__local__'

const GlowEffect: React.FC<GlowEffectProps> = ({ containerRef }) => {
	const { color, message, subscribeMotion } = useWebSocket()
	const { glowIntervalMs, glowSize } = useChaospadConfig()
	const colorRef = useRef(color)
	colorRef.current = color

	const throttledSpawn = useMemo(
		() => createThrottledSpawn(glowIntervalMs, glowSize),
		[glowIntervalMs, glowSize],
	)

	useEffect(() => {
		return subscribeMotion(({ pos, type }) => {
			const container = containerRef.current
			if (!pos || !container) return

			if (type === 'stop') {
				spawnVisual(
					container,
					pos.nx,
					pos.ny,
					colorRef.current,
					glowSize,
					LOCAL_GLOW_KEY,
					{ stopped: true },
				)
				return
			}

			const motion = trackPadMotion(pos.nx, pos.ny, LOCAL_GLOW_KEY)
			throttledSpawn(
				container,
				pos.nx,
				pos.ny,
				colorRef.current,
				type,
				LOCAL_GLOW_KEY,
				motion,
			)
		})
	}, [containerRef, glowSize, subscribeMotion, throttledSpawn])

	useEffect(() => {
		const container = containerRef.current
		if (!message || !container || !message.userId) return

		if (message.type === 'stop') {
			spawnVisual(
				container,
				message.nx,
				message.ny,
				message.color,
				glowSize,
				message.userId,
				{ stopped: true },
			)
			return
		}

		const motion = trackPadMotion(message.nx, message.ny, message.userId)
		throttledSpawn(
			container,
			message.nx,
			message.ny,
			message.color,
			message.type,
			message.userId,
			motion,
		)
	}, [message, containerRef, glowSize, throttledSpawn])

	return null
}

export default GlowEffect
