/** Minimal silent WAV — unlocks iOS media/audio session via HTMLAudioElement. */
const SILENT_WAV =
	'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

let silentAudio: HTMLAudioElement | null = null

export function createAudioContext(): AudioContext {
	const w = window as Window & { webkitAudioContext?: typeof AudioContext }
	const AC = window.AudioContext ?? w.webkitAudioContext
	if (!AC) throw new Error('Web Audio API unavailable')
	return new AC()
}

function setPlaybackAudioSession() {
	const nav = navigator as Navigator & { audioSession?: { type: string } }
	if (!nav.audioSession) return
	try {
		nav.audioSession.type = 'playback'
	} catch {
		// ignore
	}
}

/** iOS: prime gesture permission with a throwaway context (same handler stack). */
function primeDisposableContext() {
	try {
		const temp = createAudioContext()
		void temp.resume().finally(() => {
			void temp.close()
		})
	} catch {
		// ignore
	}
}

function playSilentHtmlAudio() {
	if (typeof Audio === 'undefined') return
	if (!silentAudio) {
		silentAudio = new Audio(SILENT_WAV)
		silentAudio.preload = 'auto'
		silentAudio.volume = 0.001
	}
	silentAudio.currentTime = 0
	void silentAudio.play().catch(() => {})
}

/** Call synchronously at the top of every user-gesture handler. */
export function unlockAudioForGesture(ctx?: AudioContext | null) {
	setPlaybackAudioSession()
	primeDisposableContext()
	playSilentHtmlAudio()

	if (!ctx) return

	void ctx.resume()

	try {
		const buffer = ctx.createBuffer(1, 1, 22050)
		const source = ctx.createBufferSource()
		source.buffer = buffer
		source.connect(ctx.destination)
		source.start(0)
	} catch {
		// iOS may reject start() while context is still suspended.
	}
}

/** @deprecated Use unlockAudioForGesture via AudioEngine.unlock() */
export function unlockAudioContext(ctx: AudioContext) {
	unlockAudioForGesture(ctx)
}
