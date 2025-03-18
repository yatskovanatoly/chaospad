'use client'

import throttledSpawn from '@/helpers/vision/throttledSpawn'
import React, { PropsWithChildren, useEffect } from 'react'
import useWebSocket from './hooks/useWebSocket'

const GlowEffect: React.FC<PropsWithChildren> = ({ children }) => {
	const { color, pos, type, message } = useWebSocket()

	useEffect(() => {
		throttledSpawn(type, pos.x, pos.y, color)
	}, [pos])

	useEffect(() => {
		if (!message) return
		const { type, x, y, color } = message
		throttledSpawn(type, x, y, color)
	}, [message])

	return <div>{children}</div>
}

export default GlowEffect
