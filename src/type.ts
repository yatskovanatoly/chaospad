import type { MotionType } from './components/WsContext/WsContextProvider'

export type Position = {
	nx: number
	ny: number
}

/** Motion fields always sent locally; on the wire they may be absent on legacy clients. */
export type PadMotionEnrichment = {
	/** cursor speed, normalized [0, 1] along last segment */
	gestureSpeed01: number
	/** ms from previous point in the same gesture */
	dtMs: number
}

export type WireMessage = {
	userId: string
	color: string
	type: MotionType
	nx: number
	ny: number
	gestureSpeed01?: number
	dtMs?: number
}

export type WSContextType = {
	userId: string
	color: string
	send: (msg: WireMessage) => void
	subscribe: (listener: (msg: WireMessage) => void) => () => void
}
