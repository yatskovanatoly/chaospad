import { Dispatch, RefObject, SetStateAction } from 'react'
import { MotionType } from './components/WsContext/WsContextProvider'

export type PadMotion = {
	pos: Position | undefined
	type: MotionType
}

export type PadMotionListener = (motion: PadMotion) => void

export type WSContextType = {
	wsRef: RefObject<WebSocket | null>
	type: MotionType
	setType: Dispatch<SetStateAction<MotionType>>
	userId: string | undefined
	color: string
	pos: Position | undefined
	setPos: Dispatch<SetStateAction<Position | undefined>>
	message: Message
	emitMotion: (pos: Position | undefined, type: MotionType) => void
	subscribeMotion: (listener: PadMotionListener) => () => void
}

type Message =
	| (Pick<WSContextType, 'color' | 'userId' | 'type'> & {
			nx: number
			ny: number
			seq?: number
	  })
	| undefined

export type Position = {
	nx: number
	ny: number
}
