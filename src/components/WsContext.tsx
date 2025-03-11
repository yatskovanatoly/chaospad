'use client'

import { WS_URL } from '@/config'
// WebSocketContext.tsx
import { createContext, useContext, useEffect, useRef } from 'react'

type WSContextType = {
	sendEvent: (type: 'start' | 'move' | 'stop', x: number, y: number) => void
}

const WebSocketContext = createContext<WSContextType | null>(null)

export const WebSocketProvider = ({
	children,
}: {
	children: React.ReactNode
}) => {
	const wsRef = useRef<WebSocket | null>(null)

	useEffect(() => {
		const ws = new WebSocket(`ws://${WS_URL}`)
		wsRef.current = ws

		return () => ws.close()
	}, [])

	const sendEvent = (type: 'start' | 'move' | 'stop', x: number, y: number) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify({ userId: 'your-user-id', type, x, y }))
		}
	}

	return (
		<WebSocketContext.Provider value={{ sendEvent }}>
			{children}
		</WebSocketContext.Provider>
	)
}

export const useWebSocket = () => {
	const ctx = useContext(WebSocketContext)
	if (!ctx)
		throw new Error('useWebSocket must be used inside WebSocketProvider')
	return ctx
}
