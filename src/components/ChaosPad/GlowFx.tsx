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

	useEffect(() => {
		const container = containerRef.current
		if (!container || !pos || type === 'stop') return

		const { x, y } = toPixel(container, pos)
		throttledSpawn(container, x, y, color, type)
		const id = window.setInterval(() => {
			const p = posRef.current
			const t = typeRef.current
			const c = colorRef.current
			if (!p || t === 'stop' || !containerRef.current) return
			const pixel = toPixel(containerRef.current, p)
			throttledSpawn(containerRef.current, pixel.x, pixel.y, c, t)
		}, glowIntervalMs)
		return () => window.clearInterval(id)
	}, [pos, type, color, containerRef, throttledSpawn, glowIntervalMs])

	useEffect(() => {
		const container = containerRef.current
		if (!container || !message) return
		const { nx, ny, color, type } = message
		const { width, height } = container.getBoundingClientRect()
		throttledSpawn(container, nx * width, ny * height, color, type)
	}, [message, containerRef, throttledSpawn])

	return null
}

export default GlowEffect
