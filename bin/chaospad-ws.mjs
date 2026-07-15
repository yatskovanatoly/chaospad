#!/usr/bin/env node

import { WebSocketServer } from 'ws'

const port = Number(process.env.PORT ?? 3003)
const host = process.env.HOST ?? '0.0.0.0'
const verbose = process.env.CHAOSPAD_WS_LOG !== '0'

let clientSeq = 0

const log = (...args) => {
	if (verbose) console.log('[chaospad-ws]', ...args)
}

const wss = new WebSocketServer({ port, host })

wss.on('listening', () => {
	console.log(`chaospad ws relay listening on ws://localhost:${port}`)
	console.log(`LAN clients: ws://<this-machine-ip>:${port}`)
	log(`bind ${host}:${port}`)
})

wss.on('error', (error) => {
	if (error?.code === 'EADDRINUSE') {
		console.error(
			`[chaospad-ws] port ${port} is already in use — stop the other process or set PORT`,
		)
	} else {
		console.error('[chaospad-ws] error:', error)
	}
	process.exit(1)
})

wss.on('connection', (ws) => {
	const id = ++clientSeq
	log(`client #${id} connected (${wss.clients.size} total)`)

	ws.on('message', (data) => {
		const payload = typeof data === 'string' ? data : data.toString()
		let relayed = 0

		wss.clients.forEach((client) => {
			if (client !== ws && client.readyState === client.OPEN) {
				client.send(payload)
				relayed++
			}
		})

		log(
			`#${id} recv -> relayed to ${relayed} client(s)`,
			relayed === 0 ? '(no other clients connected)' : '',
			payload.length > 160 ? `${payload.slice(0, 160)}…` : payload,
		)
	})

	ws.on('close', () => {
		log(`client #${id} disconnected (${wss.clients.size} total)`)
	})
})

process.on('SIGINT', () => {
	log('shutting down')
	wss.close(() => process.exit(0))
})
