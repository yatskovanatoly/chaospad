import type { PadMotionEnrichment } from '@/type'
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
} & PadMotionEnrichment

export type VisEvent = {
	nx: number
	ny: number
	color: string
	type: MotionType
} & Partial<PadMotionEnrichment>

export type RemotePadEvent = VisEvent & { userId: string }

export type PadGestureEvent = { kind: 'gesture' } & PadMotionEnrichment & {
		type: MotionType
		nx: number
		ny: number
	}

export type PadInputEvent =
	| PadGestureEvent
	| { kind: 'hover'; nx: number; ny: number }
	| { kind: 'hoverLeave' }
