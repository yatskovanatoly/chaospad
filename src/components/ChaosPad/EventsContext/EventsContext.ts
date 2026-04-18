import { createContext } from 'react'
import type { PadEventsApi } from './padEvents.types'

export const EventsContext = createContext<PadEventsApi | null>(null)

export type { PadEventsApi, PadHoverNorm, RemotePadEvent, VisEvent } from './padEvents.types'
