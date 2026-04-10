'use client'

import throttledSpawn from '@/components/ChaosPad/helpers/throttledSpawn'
import React, { PropsWithChildren, useEffect, useRef } from 'react'
import useWebSocket from '../WsContext/useWebSocket'

const GlowEffect: React.FC<PropsWithChildren> = ({ children }) => {
	const { color, pos, type, message } = useWebSocket()
	const posRef = useRef(pos)
	const typeRef = useRef(type)
	const colorRef = useRef(color)
	posRef.current = pos
	typeRef.current = type
	colorRef.current = color

	useEffect(() => {
		if (!pos || type === 'stop') return
		throttledSpawn(pos.x, pos.y, color, type)
		const id = window.setInterval(() => {
			const p = posRef.current
			const t = typeRef.current
			const c = colorRef.current
			if (!p || t === 'stop') return
			throttledSpawn(p.x, p.y, c, t)
		}, 50)
		return () => window.clearInterval(id)
	}, [pos, type, color])

	useEffect(() => {
		if (!message) return
		const { x, y, color, type } = message
		throttledSpawn(x, y, color, type)
	}, [message])

	return <div>{children}</div>
}

export default GlowEffect
