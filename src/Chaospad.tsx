'use client'

import { ChaospadConfigProvider } from '@/context/ChaospadConfigContext'
import AudioEngineProvider from '@/components/AudioEngineContext/AudioEngineProvider'
import ChaosPad from '@/components/ChaosPad/ChaosPad'
import WebSocketProvider from '@/components/WsContext/WsContextProvider'
import { injectChaospadStyles } from '@/injectStyles'
import type { ChaospadConfig } from '@/types/config'
import { useEffect, type CSSProperties } from 'react'

export type ChaospadProps = {
	config?: ChaospadConfig
	className?: string
	style?: CSSProperties
}

export function Chaospad({ config, className, style }: ChaospadProps) {
	useEffect(() => {
		injectChaospadStyles()
	}, [])

	return (
		<ChaospadConfigProvider config={config}>
			<WebSocketProvider>
				<AudioEngineProvider>
					<ChaosPad className={className} style={style} />
				</AudioEngineProvider>
			</WebSocketProvider>
		</ChaospadConfigProvider>
	)
}

export default Chaospad
