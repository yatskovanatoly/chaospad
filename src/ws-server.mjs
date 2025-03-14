import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 3003 })

wss.on('listening', () => {
	console.log('Successfully started on port 3003')
})

wss.on('error', (error) => {
	console.error('WebSocket server error:', error)
})

wss.on('connection', (ws) => {
	console.log('New client connected')

	ws.on('message', (data) => {
		console.log('Received message:', data.toString())

		wss.clients.forEach((client) => {
			if (client !== ws && client.readyState === client.OPEN) {
				client.send(data.toString())
			}
		})
	})

	ws.on('close', () => {
		console.log('Client disconnected')
	})
})
