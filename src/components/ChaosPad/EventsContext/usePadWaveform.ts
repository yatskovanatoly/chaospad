import { useContext, useSyncExternalStore } from 'react'
import { EventsContext } from './EventsContext'

/** Подписка на буфер формы волны (bins + version). */
export function usePadWaveform() {
	const ctx = useContext(EventsContext)
	if (!ctx) throw new Error('usePadWaveform must be used within EventsContextProvider')
	const { padWaveform } = ctx

	const version = useSyncExternalStore(
		padWaveform.subscribe,
		() => padWaveform.getVersion(),
		() => padWaveform.getVersion(),
	)

	return { bins: padWaveform.getBins(), version }
}
