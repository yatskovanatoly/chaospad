import { useContext } from 'react'
import type { PadEventsApi, RemotePadEvent, VisEvent } from './padEvents.types'
import { EventsContext } from './EventsContext'

export function useEvents(): PadEventsApi {
	const ctx = useContext(EventsContext)
	if (!ctx) throw new Error('useEvents must be used within EventsContextProvider')
	return ctx
}

export function usePadLocal(): VisEvent | null {
	return useEvents().local
}

export function usePadRemote(): RemotePadEvent | undefined {
	return useEvents().remote
}

export { usePadEventHandlers, type PadEventHandlersOptions } from './usePadEventHandlers'
export { usePadWaveform } from './usePadWaveform'
