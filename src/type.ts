import { Dispatch, RefObject, SetStateAction } from 'react'
import { MotionType } from './components/WsContext/WsContextProvider'

export type WSContextType = {
	wsRef: RefObject<WebSocket | null>
	type: MotionType
	setType: Dispatch<SetStateAction<MotionType>>
	userId: string | undefined
	color: string
	pos: Position | undefined
	setPos: Dispatch<SetStateAction<Position | undefined>>
	message: Message
}

type Message =
	| (Pick<WSContextType, 'color' | 'userId' | 'type'> & {
			nx: number
			ny: number
	  })
	| undefined

export type Position = {
	nx: number
	ny: number
}
