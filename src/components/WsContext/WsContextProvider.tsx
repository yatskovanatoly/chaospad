'use client'

import { useChaospadConfig } from '@/context/ChaospadConfigContext'
import { colors, getColorForUser, getUserId } from '@/components/WsContext/helpers/getUserParams'
import {
	buildWsPayload,
	parseWsMessage,
} from '@/components/WsContext/helpers/wsMessage'
import { resolveWebSocketUrl } from '@/types/config'
import type { Position, WSContextType } from '@/type'
import { useEffect, useRef, useState } from 'react'
import { WebSocketContext } from './WsContext'

const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
	const { wsUrl, userId: configUserId } = useChaospadConfig()
	const [pos, setPos] = useState<Position | undefined>(undefined)
	const [type, setType] = useState<'start' | 'move' | 'stop'>('stop')
	const wsRef = useRef<WebSocket | null>(null)
	const userIdRef = useRef(configUserId ?? getUserId())
	const userId = userIdRef.current
	const color = getColorForUser(userId) || colors[0]
	const [message, setMessage] = useState<WSContextType['message']>(undefined)

	const typeRef = useRef(type)
	const posRef = useRef(pos)
	const colorRef = useRef(color)
	typeRef.current = type
	posRef.current = pos
	colorRef.current = color

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

	useEffect(() => {
		const ws = new WebSocket(resolveWebSocketUrl(wsUrl))
		wsRef.current = ws

		ws.onopen = () => {
			if (pendingPayloadRef.current) {
				ws.send(pendingPayloadRef.current)
				pendingPayloadRef.current = null
			}
			sendNowRef.current()
		}

		ws.onmessage = (event) => {
			const parsed = parseWsMessage(JSON.parse(event.data))
			if (!parsed) return

			setMessage((currentMessage) => {
				if (parsed.userId === userIdRef.current) return currentMessage

				const isSame =
					currentMessage &&
					currentMessage.userId === parsed.userId &&
					currentMessage.type === parsed.type &&
					currentMessage.nx === parsed.nx &&
					currentMessage.ny === parsed.ny &&
					currentMessage.color === parsed.color

				return isSame ? currentMessage : parsed
			})
		}

		return () => {
			ws.close()
			wsRef.current = null
		}
	}, [wsUrl])

	useEffect(() => {
		sendNow()
	}, [pos, type, color])

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
