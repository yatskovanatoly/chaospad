import type { MotionType } from '@/components/WsContext/WsContextProvider'
import type { PadWaveformStore } from './padWaveform'

/** Нормализованная точка на паде (0…1). */
export type PadHoverNorm = { nx: number; ny: number }

/** Локальное событие: позиция + тип жеста (start / move при нажатии / stop). */
export type VisEvent = {
	nx: number
	ny: number
	color: string
	type: MotionType
}

/** Удалённое событие того же формата, что и локальное. */
export type RemotePadEvent = VisEvent & { userId: string }

/**
 * Публичный API контекста событий пада.
 *
 * - **local** / **remote** — снимки последних событий из WebSocket (локальный и удалённый пользователь).
 * - **padWaveform** — стор буфера формы волны для режима Buffer.
 * - **emitPadHover** — вызывается из UI при движении по паду без зажатой кнопки мыши (или touch); пишет в буфер waveform.
 */
export interface PadEventsApi {
	local: VisEvent | null
	remote: RemotePadEvent | undefined
	padWaveform: PadWaveformStore
	emitPadHover: (norm: PadHoverNorm | null) => void
}
