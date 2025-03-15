import { Dispatch, RefObject, SetStateAction } from 'react'

export type WSContextType = {
	wsRef: RefObject<WebSocket | null>
	type: 'start' | 'move' | 'stop'
	setType: Dispatch<SetStateAction<'start' | 'move' | 'stop'>>
	userId: string | undefined
	color: string
	pos: { x: number; y: number }
	setPos: Dispatch<SetStateAction<{ x: number; y: number }>>
	message: Message
}

type Message =
	| (Pick<WSContextType, 'color' | 'userId' | 'type'> & {
			x: number
			y: number
	  })
	| undefined
