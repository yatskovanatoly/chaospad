'use client'

import { WS_URL } from '@/config'
import { createContext, RefObject, useContext, useEffect, useRef } from 'react'

type WSContextType = {
  wsRef: RefObject<WebSocket | null>
	sendEvent: (type: 'start' | 'move' | 'stop', x: number, y: number) => void
  userId: string | undefined
}

const WebSocketContext = createContext<WSContextType | null>(null)

export const WebSocketProvider = ({
	children,
}: {
	children: React.ReactNode
}) => {
	const wsRef = useRef<WebSocket | null>(null)
  const userId = getUserId()

	useEffect(() => {
		const ws = new WebSocket(`ws://${WS_URL}`)
		wsRef.current = ws

		return () => ws.close()
	}, [])

	const sendEvent = (type: 'start' | 'move' | 'stop', x: number, y: number) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify({ userId: getUserId(), type, x, y }))
		}
	}

	return (
		<WebSocketContext.Provider value={{ wsRef, sendEvent, userId }}>
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

const getUserId = () => {
	try {
		return crypto.randomUUID()
	} catch (e) {
		console.log(e)
	}
}
