'use client'

import React, { PropsWithChildren, useEffect } from 'react'
import useWebSocket from './WsContext'

const GlowEffect: React.FC<PropsWithChildren> = ({ children }) => {
	const { userId, color, pos } = useWebSocket()
	const x = Math.floor(pos.x)
	const y = Math.floor(pos.y)

	console.log(x, y)

	const spawnGlow = (x: number, y: number, color: string) => {
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
	}

	// Pointer event handling
	useEffect(() => {
		let lastGlowTime = 0

		const throttledSpawn = () => {
			const now = Date.now()
			if (now - lastGlowTime < 50) return
			lastGlowTime = now

			spawnGlow(x, y, color)
		}

		throttledSpawn()
	}, [pos])

	return <div>{children}</div>
}

export default GlowEffect
