'use client'

import { useChaospadConfig } from '@/context/ChaospadConfigContext'
import { colors, getColorForUser, getUserId } from '@/components/WsContext/helpers/getUserParams'
import {
	buildWsPayload,
	parseWsMessage,
} from '@/components/WsContext/helpers/wsMessage'
import { resolveWebSocketUrl } from '@/types/config'
import type { PadMotionListener, Position, WSContextType } from '@/type'
import { useCallback, useEffect, useRef, useState } from 'react'
import { WebSocketContext } from './WsContext'

const RECONNECT_MS = 1500

const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
	const { wsUrl, userId: configUserId } = useChaospadConfig()
	const [pos, setPos] = useState<Position | undefined>(undefined)
	const [type, setType] = useState<'start' | 'move' | 'stop'>('stop')
	const wsRef = useRef<WebSocket | null>(null)
	const userIdRef = useRef(configUserId ?? getUserId())
	const userId = userIdRef.current
	const color = getColorForUser(userId) || colors[0]
	const [message, setMessage] = useState<WSContextType['message']>(undefined)
	const messageSeqRef = useRef(0)

	const typeRef = useRef(type)
	const posRef = useRef(pos)
	const colorRef = useRef(color)
	typeRef.current = type
	posRef.current = pos
	colorRef.current = color

	const motionListenersRef = useRef(new Set<PadMotionListener>())

	const pendingPayloadRef = useRef<string | null>(null)

	const sendNow = () => {
		const ws = wsRef.current
		if (!ws) return

		const payload = buildWsPayload({
			userId: userIdRef.current,
			type: typeRef.current,
			pos: posRef.current,
			color: colorRef.current,
		})

		if (ws.readyState === WebSocket.OPEN) {
			ws.send(payload)
			pendingPayloadRef.current = null
			return
		}

		if (ws.readyState === WebSocket.CONNECTING) {
			pendingPayloadRef.current = payload
		}
	}

	const sendNowRef = useRef(sendNow)
	sendNowRef.current = sendNow

	const emitMotion = useCallback((nextPos: Position | undefined, nextType: 'start' | 'move' | 'stop') => {
		posRef.current = nextPos
		typeRef.current = nextType
		setPos(nextPos)
		setType(nextType)
		sendNowRef.current()
		for (const listener of motionListenersRef.current) {
			listener({ pos: nextPos, type: nextType })
		}
	}, [])

	const subscribeMotion = useCallback((listener: PadMotionListener) => {
		motionListenersRef.current.add(listener)
		return () => {
			motionListenersRef.current.delete(listener)
		}
	}, [])

	useEffect(() => {
		let alive = true
		let reconnectTimer: ReturnType<typeof setTimeout> | undefined
		let ws: WebSocket | null = null

		const connect = () => {
			if (!alive) return

			const url = resolveWebSocketUrl(wsUrl)
			ws = new WebSocket(url)
			wsRef.current = ws

			ws.onopen = () => {
				if (pendingPayloadRef.current) {
					ws?.send(pendingPayloadRef.current)
					pendingPayloadRef.current = null
				}
				sendNowRef.current()
			}

			ws.onmessage = (event) => {
				try {
					const parsed = parseWsMessage(JSON.parse(event.data))
					if (!parsed || parsed.userId === userIdRef.current) return

					messageSeqRef.current += 1
					setMessage({ ...parsed, seq: messageSeqRef.current })
				} catch (error) {
					console.warn('[chaospad] failed to parse ws message', error)
				}
			}

			ws.onerror = () => {
				console.warn(`[chaospad] ws error (${url})`)
			}

			ws.onclose = () => {
				wsRef.current = null
				if (!alive) return
				reconnectTimer = setTimeout(connect, RECONNECT_MS)
			}
		}

		connect()

		return () => {
			alive = false
			if (reconnectTimer) clearTimeout(reconnectTimer)
			ws?.close()
			wsRef.current = null
		}
	}, [wsUrl])

	return (
		<WebSocketContext.Provider
			value={{
				wsRef,
				type,
				setType,
				userId,
				color,
				pos,
				setPos,
				message,
				emitMotion,
				subscribeMotion,
			}}
		>
			{children}
		</WebSocketContext.Provider>
	)
}

export type MotionType = 'start' | 'stop' | 'move'

export default WebSocketProvider
