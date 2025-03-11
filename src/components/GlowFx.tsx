'use client'

import { WS_URL } from '@/config'
import React, { PropsWithChildren, useEffect, useRef } from 'react'

const GlowEffect: React.FC<PropsWithChildren> = ({ children }) => {
	const wsRef = useRef<WebSocket | null>(null)

	useEffect(() => {
		// Connect to your WebSocket server
		const ws = new WebSocket(`ws://${WS_URL}`) // replace with your actual server
		wsRef.current = ws

		// Show incoming glow effects from other users
		ws.onmessage = (event) => {
      console.log(event)
			try {
				const data = JSON.parse(event.data)
				if (
					data.type === 'glow' &&
					typeof data.x === 'number' &&
					typeof data.y === 'number'
				) {
					const glow = createGlowEffect(data.x, data.y)
					setTimeout(() => glow.remove(), 500) // auto-remove after animation
				}
			} catch (err) {
				console.error('Invalid WS message', err)
			}
		}

		// Cleanup on unmount
		return () => {
			ws.close()
		}
	}, [])

	// Create a single glow div
	const createGlowEffect = (x: number, y: number) => {
		const glow = document.createElement('div')
		glow.classList.add(
			'glow',
			'absolute',
			'rounded-full',
			'border-4',
			'border-cyan-300',
			'opacity-60',
			'transition-all',
			'pointer-events-none',
			'ease-in-out',
			'blur-xs'
		)
		document.body.appendChild(glow)

		glow.style.left = `${x - 25}px`
		glow.style.top = `${y - 25}px`
		glow.style.width = '50px'
		glow.style.height = '50px'
		glow.style.animation = 'glow-effect .5s ease-in-out'

		return glow
	}

	// Broadcast your glow location
	const broadcastGlow = (x: number, y: number) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify({ type: 'glow', x, y }))
		}
	}

	useEffect(() => {
		const handleTouchMove = (e: TouchEvent) => {
			const touch = e.touches[0]
			const glow = createGlowEffect(touch.clientX, touch.clientY)
			broadcastGlow(touch.clientX, touch.clientY)

			const update = (e: TouchEvent) => {
				const t = e.touches[0]
				glow.style.left = `${t.clientX - 25}px`
				glow.style.top = `${t.clientY - 25}px`
				broadcastGlow(t.clientX, t.clientY)
			}

			document.body.addEventListener('touchmove', update)

			if (e.target)
				e.target.addEventListener('touchend', () => {
					glow.remove()
					document.body.removeEventListener('touchmove', update)
				})
		}

		const handleMouseMove = (e: MouseEvent) => {
			const glow = createGlowEffect(e.clientX, e.clientY)
			broadcastGlow(e.clientX, e.clientY)

			const update = (e: MouseEvent) => {
				glow.style.left = `${e.clientX - 25}px`
				glow.style.top = `${e.clientY - 25}px`
				broadcastGlow(e.clientX, e.clientY)
			}

			document.body.addEventListener('mousemove', update)
			document.body.addEventListener(
				'mouseup',
				() => {
					glow.remove()
					document.body.removeEventListener('mousemove', update)
				},
				{ once: true }
			)
		}

		document.body.addEventListener('touchstart', handleTouchMove)
		document.body.addEventListener('mousedown', handleMouseMove)

		return () => {
			document.body.removeEventListener('touchstart', handleTouchMove)
			document.body.removeEventListener('mousedown', handleMouseMove)
		}
	}, [])

	return <div>{children}</div>
}

export default GlowEffect
