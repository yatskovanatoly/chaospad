'use client'

import { WS_URL } from '@/config'
import { colors, getColorForUser, getUserId } from '@/components/WsContext/helpers/getUserParams'
import { Position } from '@/type'
import { useEffect, useMemo, useRef, useState } from 'react'
import { WebSocketContext } from './WsContext'

const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
	const [pos, setPos] = useState<Position | undefined>(undefined)
	const [type, setType] = useState<'start' | 'move' | 'stop'>('stop')
	const wsRef = useRef<WebSocket | null>(null)
	const userId = useMemo(() => getUserId(), [])
	const color = getColorForUser(userId) || colors[0]
	const [message, setMessage] = useState(undefined)

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
			wsRef.current?.send(
				JSON.stringify({ userId, type, x: pos?.x, y: pos?.y, color })
			)
		}
	}, [pos, type, userId, color])

	return (
		<WebSocketContext.Provider
			value={{ wsRef, type, setType, userId, color, pos, setPos, message }}
		>
			{children}
		</WebSocketContext.Provider>
	)
}

export type MotionType = 'start' | 'stop' | 'move'

export default WebSocketProvider
