'use client'

import { useChaospadConfig } from '@/context/ChaospadConfigContext'
import createThrottledSpawn from '@/components/ChaosPad/helpers/throttledSpawn'
import type { Position } from '@/type'
import React, { useEffect, useMemo, useRef } from 'react'
import useWebSocket from '../WsContext/useWebSocket'

type GlowEffectProps = {
	containerRef: React.RefObject<HTMLDivElement | null>
}

const toPixel = (container: HTMLElement, pos: Position) => {
	const { width, height } = container.getBoundingClientRect()
	return {
		x: pos.nx * width,
		y: pos.ny * height,
	}
}

const LOCAL_GLOW_KEY = '__local__'

const GlowEffect: React.FC<GlowEffectProps> = ({ containerRef }) => {
	const { color, pos, type, message } = useWebSocket()
	const { glowIntervalMs, glowSize } = useChaospadConfig()
	const posRef = useRef(pos)
	const typeRef = useRef(type)
	const colorRef = useRef(color)
	posRef.current = pos
	typeRef.current = type
	colorRef.current = color

	const throttledSpawn = useMemo(
		() => createThrottledSpawn(glowIntervalMs, glowSize),
		[glowIntervalMs, glowSize],
	)

	const isPointerActive = type !== 'stop' && pos != null

	// Interval only while pointer is held — do not restart on every pos change.
	useEffect(() => {
		if (!isPointerActive) return

		const tick = () => {
			const p = posRef.current
			const t = typeRef.current
			const c = colorRef.current
			const container = containerRef.current
			if (!p || t === 'stop' || !container) return
			const pixel = toPixel(container, p)
			throttledSpawn(container, pixel.x, pixel.y, c, t, LOCAL_GLOW_KEY)
		}

		tick()
		const id = window.setInterval(tick, glowIntervalMs)
		return () => window.clearInterval(id)
	}, [isPointerActive, containerRef, throttledSpawn, glowIntervalMs])

	useEffect(() => {
		if (!message || message.type === 'stop') return
		const container = containerRef.current
		if (!container) return
		const { nx, ny, color, type, userId } = message
		if (!userId) return
		const { width, height } = container.getBoundingClientRect()
		throttledSpawn(container, nx * width, ny * height, color, type, userId)
	}, [message, containerRef, throttledSpawn])

	return null
}

export default GlowEffect
