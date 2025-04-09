import { Dispatch, RefObject, SetStateAction } from 'react'
import { MotionType } from './components/WsContextProvider'

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
			x: number
			y: number
	  })
	| undefined

export type Position = {
	x: number
	y: number
}
