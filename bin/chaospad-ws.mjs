#!/usr/bin/env node

import { WebSocketServer } from 'ws'

const port = Number(process.env.PORT ?? 3003)
const host = process.env.HOST ?? '0.0.0.0'

const wss = new WebSocketServer({ port, host })

wss.on('listening', () => {
	console.log(`chaospad ws relay listening on ws://${host}:${port}`)
})

wss.on('error', (error) => {
	console.error('WebSocket server error:', error)
	process.exit(1)
})

wss.on('connection', (ws) => {
	ws.on('message', (data) => {
		wss.clients.forEach((client) => {
			if (client !== ws && client.readyState === client.OPEN) {
				client.send(data.toString())
			}
		})
	})
})
