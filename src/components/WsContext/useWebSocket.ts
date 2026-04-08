import { useContext } from 'react'
import { WebSocketContext } from './WsContext'

const useWebSocket = () => {
	const ctx = useContext(WebSocketContext)
	if (!ctx)
		throw new Error('useWebSocket must be used inside WebSocketProvider')
	return ctx
}

export default useWebSocket
