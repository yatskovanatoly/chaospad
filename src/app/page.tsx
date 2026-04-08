'use client'

import { AudioEngineProvider } from '@/components/AudioEngineContext'
import ChaosPad from '@/components/ChaosPad/ChaosPad'
import WebSocketProvider from '@/components/WsContext/WsContextProvider'

const Page = () => (
	<WebSocketProvider>
		<AudioEngineProvider>
			<ChaosPad />
		</AudioEngineProvider>
	</WebSocketProvider>
)

export default Page
