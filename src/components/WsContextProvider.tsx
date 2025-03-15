'use client'

import { WS_URL } from '@/config'
import { useEffect, useMemo, useRef, useState } from 'react'
import { WebSocketContext } from './WsContext'

const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
	const [pos, setPos] = useState({ x: 0, y: 0 })
	const [type, setType] = useState<'start' | 'move' | 'stop'>('stop')
	const wsRef = useRef<WebSocket | null>(null)
	const userId = useMemo(() => getUserId(), [])
	const color = getColorForUser(userId) || colors[0]
	const { x, y } = pos
	const [message, setMessage] = useState(undefined)
	console.log(message)

	useEffect(() => {
		const ws = new WebSocket(`ws://${WS_URL}`)
		wsRef.current = ws

		ws.onmessage = (event) => {
			const parsedData = JSON.parse(event.data)
			if (
				parsedData.userId !== userId &&
				JSON.stringify(parsedData) !== JSON.stringify(message)
			) {
				setMessage(parsedData)
			}
		}

		return () => ws.close()
	}, [])

	useEffect(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current?.send(JSON.stringify({ userId, type, x, y, color }))
		}
	}, [pos, type, userId, color, x, y])

	return (
		<WebSocketContext.Provider
			value={{ wsRef, type, setType, userId, color, pos, setPos, message }}
		>
			{children}
		</WebSocketContext.Provider>
	)
}

const getUserId = () => {
	try {
		return crypto.randomUUID()
	} catch (e) {
		console.log(e)
    return Math.random().toFixed()
	}
}

const colors = [
	'border-blue-500',
	'border-red-500',
	'border-green-500',
	'border-yellow-500',
	'border-purple-500',
]

// Hash function to pick a consistent color based on user ID
const getColorForUser = (id: string | undefined) => {
	if (!id) return undefined

	let hash = 0
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash)
	}
	const index = Math.abs(hash) % colors.length
	return colors[index]
}

export default WebSocketProvider
