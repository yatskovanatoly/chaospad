'use client'

import React, { PropsWithChildren, useCallback, useEffect } from 'react'
import useWebSocket from './hooks/useWebSocket'

const GlowEffect: React.FC<PropsWithChildren> = ({ children }) => {
	const { color, pos, type, message } = useWebSocket()
	const x = Math.floor(pos.x)
	const y = Math.floor(pos.y)

	const useThrottledGlow = (
		trigger: any,
		x?: number,
		y?: number,
		color?: string
	) => {
		useEffect(() => {
			if (!trigger) return
			let lastGlowTime = 0
			const throttledSpawn = () => {
				const now = Date.now()
				if (now - lastGlowTime < 50) return
				lastGlowTime = now
				x && y && color && spawnGlow(x, y, color)
			}

			throttledSpawn()
		}, [trigger])
	}

	useThrottledGlow(message, message?.x, message?.y, message?.color)
	useThrottledGlow(pos, x, y, color)

	const spawnGlow = useCallback(
		(x: number, y: number, color: string) => {
			const glow = document.createElement('div')
			glow.classList.add(
				'glow',
				'absolute',
				'rounded-full',
				'border-4',
				'opacity-60',
				'transition-all',
				'pointer-events-none',
				'ease-in-out',
				'blur-xs',
				color
			)
			glow.style.left = `${x - 25}px`
			glow.style.top = `${y - 25}px`
			glow.style.width = '50px'
			glow.style.height = '50px'
			glow.style.animation = 'glow-effect .5s ease-in-out'

			document.body.appendChild(glow)
			setTimeout(() => glow.remove(), 500)

			if (type === 'stop') glow.remove()
		},
		[pos]
	)

	return <div>{children}</div>
}

export default GlowEffect
