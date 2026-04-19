'use client'

import { getPublicWebSocketUrl } from '@/config'
import { colors, getColorForUser, getUserId } from '@/components/WsContext/helpers/getUserParams'
import type { WireMessage } from '@/type'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { WebSocketContext } from './WsContext'

export type MotionType = 'start' | 'stop' | 'move'

const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
	const userIdRef = useRef(getUserId())
	const userId = userIdRef.current
	const color = getColorForUser(userId) || colors[0]

	const wsRef = useRef<WebSocket | null>(null)
	const listenersRef = useRef<Set<(msg: WireMessage) => void>>(new Set())
	const queueRef = useRef<string[]>([])

	useEffect(() => {
		const ws = new WebSocket(getPublicWebSocketUrl())
		wsRef.current = ws

		ws.onopen = () => {
			for (const payload of queueRef.current) ws.send(payload)
			queueRef.current = []
		}

		ws.onmessage = (event) => {
			let parsed: WireMessage | null = null
			try {
				parsed = JSON.parse(event.data) as WireMessage
			} catch {
				return
			}
			if (!parsed || !parsed.userId) return
			if (parsed.userId === userIdRef.current) return
			for (const l of listenersRef.current) l(parsed)
		}

		return () => {
			ws.close()
			wsRef.current = null
		}
	}, [])

	const send = useCallback((msg: WireMessage) => {
		const payload = JSON.stringify(msg)
		const ws = wsRef.current
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(payload)
		} else {
			queueRef.current.push(payload)
		}
	}, [])

	const subscribe = useCallback((listener: (msg: WireMessage) => void) => {
		listenersRef.current.add(listener)
		return () => {
			listenersRef.current.delete(listener)
		}
	}, [])

	const value = useMemo(
		() => ({ userId, color, send, subscribe }),
		[userId, color, send, subscribe],
	)

	return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

export default WebSocketProvider
