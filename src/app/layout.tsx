import MkCodeCredit from '@/components/MkcodeCredit'
import WebSocketProvider from '@/components/WsContextProvider'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
	title: 'chaos pad',
	description: 'A simple ws-powered chaos pad',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en'>
			<body>
				<WebSocketProvider>{children}</WebSocketProvider>
				<MkCodeCredit />
			</body>
		</html>
	)
}
