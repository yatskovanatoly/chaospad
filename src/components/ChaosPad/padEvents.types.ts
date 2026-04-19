import type { MotionType } from '@/components/WsContext/WsContextProvider'

export type PadHoverNorm = { nx: number; ny: number }

export type UserPadState = {
	userId: string
	color: string
	type: MotionType
	nx: number
	ny: number
	updatedAt: number
	xyArray: Float32Array
}

export type VisEvent = {
	nx: number
	ny: number
	color: string
	type: MotionType
}

export type RemotePadEvent = VisEvent & { userId: string }

export type PadInputEvent =
	| { kind: 'gesture'; type: MotionType; nx: number; ny: number }
	| { kind: 'hover'; nx: number; ny: number }
	| { kind: 'hoverLeave' }
