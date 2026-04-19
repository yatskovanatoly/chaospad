'use client'

import ChaosPad from '@/components/ChaosPad/ChaosPad'
import WebSocketProvider from '@/components/WsContext/WsContextProvider'

const Page = () => (
	<WebSocketProvider>
		<ChaosPad />
	</WebSocketProvider>
)

export default Page
