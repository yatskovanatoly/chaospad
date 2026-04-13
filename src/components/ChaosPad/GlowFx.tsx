'use client'

import throttledSpawn from '@/components/ChaosPad/helpers/throttledSpawn'
import React, { PropsWithChildren, useEffect } from 'react'
import useWebSocket from '../WsContext/useWebSocket'

const GlowEffect: React.FC<PropsWithChildren> = ({ children }) => {
	const { color, pos, type, message } = useWebSocket()

	useEffect(() => {
		if (!pos) return
		const { x, y } = pos
		throttledSpawn(x, y, color, type)
	}, [color, pos, type])

	useEffect(() => {
		if (!message) return
		const { x, y, color, type } = message
		throttledSpawn(x, y, color, type)
	}, [message])

	return <div>{children}</div>
}

export default GlowEffect
