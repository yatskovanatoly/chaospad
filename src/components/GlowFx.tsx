'use client'

import React, { PropsWithChildren, useEffect } from 'react'

const GlowEffect: React.FC<PropsWithChildren> = ({ children }) => {
	useEffect(() => {
		// Function to create the glow effect at specific coordinates
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

			// Set the initial position and size of the glow
			glow.style.left = `${x - 25}px` // Subtract half the size to center the glow
			glow.style.top = `${y - 25}px` // Subtract half the size to center the glow
			glow.style.width = '50px'
			glow.style.height = '50px'

			// Add continuous animation while the user interacts
			glow.style.animation = 'glow-effect .5s infinite'

			return glow
		}

		// Event listener for touch events (to track touch movements)
		const handleTouchMove = (e: TouchEvent) => {
			const touch = e.touches[0]
			const glow = createGlowEffect(touch.clientX, touch.clientY)

			// Update the position continuously as the user moves their finger
			const handleTouchMoveUpdate = (e: TouchEvent) => {
				const touch = e.touches[0]
				glow.style.left = `${touch.clientX - 5}px`
				glow.style.top = `${touch.clientY - 5}px`
			}

			document.body.addEventListener('touchmove', handleTouchMoveUpdate)

			// Cleanup on touchend
			if (e && e.target)
				e.target.addEventListener('touchend', () => {
					glow.remove()
					document.body.removeEventListener('touchmove', handleTouchMoveUpdate)
				})
		}

		// Event listener for mouse events (to track mouse movements)
		const handleMouseMove = (e: MouseEvent) => {
			const glow = createGlowEffect(e.clientX, e.clientY)

			// Update the position continuously as the user moves the mouse
			const handleMouseMoveUpdate = (e: MouseEvent) => {
				glow.style.left = `${e.clientX - 5}px`
				glow.style.top = `${e.clientY - 5}px`
			}

			document.body.addEventListener('mousemove', handleMouseMoveUpdate)

			// Cleanup on mouseup
			document.body.addEventListener('mouseup', () => {
				glow.remove()
				document.body.removeEventListener('mousemove', handleMouseMoveUpdate)
			})
		}

		// Attach event listeners
		document.body.addEventListener('touchstart', handleTouchMove)
		document.body.addEventListener('mousedown', handleMouseMove)

		// Cleanup event listeners on component unmount
		return () => {
			document.body.removeEventListener('touchstart', handleTouchMove)
			document.body.removeEventListener('mousedown', handleMouseMove)
		}
	}, [])

	return <div>{children}</div>
}

export default GlowEffect
