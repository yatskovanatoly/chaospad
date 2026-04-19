import type { MotionType } from './components/WsContext/WsContextProvider'

export type Position = {
	nx: number
	ny: number
}

export type WireMessage = {
	userId: string
	color: string
	type: MotionType
	nx: number
	ny: number
}

export type WSContextType = {
	userId: string
	color: string
	send: (msg: WireMessage) => void
	subscribe: (listener: (msg: WireMessage) => void) => () => void
}
