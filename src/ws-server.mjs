import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 3003 })

wss.on('connection', (ws) => {
	ws.on('message', (data) => {
		// broadcast to everyone else
		wss.clients.forEach((client) => {
			if (client !== ws && client.readyState === client.OPEN) {
				client.send(data.toString()) // Convert Buffer to string if needed
			}
		})
	})
})
