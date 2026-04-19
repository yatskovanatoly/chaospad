'use client'

import { AudioEngine } from './AudioEngine'

let engine: AudioEngine | null = null
const listeners = new Set<(engine: AudioEngine | null) => void>()

const notify = () => {
	for (const l of listeners) l(engine)
}

export const getEngine = (): AudioEngine | null => engine

export const getOrCreateEngine = (): AudioEngine => {
	if (!engine) {
		engine = new AudioEngine()
		notify()
	}
	return engine
}

export const closeEngine = (): void => {
	if (!engine) return
	void engine.ctx.close()
	engine = null
	notify()
}

export const subscribeEngine = (cb: (engine: AudioEngine | null) => void): (() => void) => {
	listeners.add(cb)
	return () => {
		listeners.delete(cb)
	}
}
