const SILENT_WAV =
	'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

let silentAudio: HTMLAudioElement | null = null
let gestureRitualDone = false

export function createAudioContext(): AudioContext {
	const w = window as Window & { webkitAudioContext?: typeof AudioContext }
	const AC = window.AudioContext ?? w.webkitAudioContext
	if (!AC) throw new Error('Web Audio API unavailable')
	return new AC({ latencyHint: 'interactive' })
}

function setPlaybackAudioSession() {
	const nav = navigator as Navigator & { audioSession?: { type: string } }
	if (!nav.audioSession) return
	try {
		nav.audioSession.type = 'playback'
	} catch {}
}

function primeDisposableContext() {
	try {
		const temp = createAudioContext()
		void temp.resume().catch(() => {}).finally(() => {
			void temp.close().catch(() => {})
		})
	} catch {}
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

function primeSilentBuffer(ctx: AudioContext) {
	try {
		const buffer = ctx.createBuffer(1, 1, 22050)
		const source = ctx.createBufferSource()
		source.buffer = buffer
		source.connect(ctx.destination)
		source.start(0)
	} catch {}
}

export function unlockAudioForGesture(ctx?: AudioContext | null) {
	if (!gestureRitualDone) {
		gestureRitualDone = true
		setPlaybackAudioSession()
		primeDisposableContext()
		playSilentHtmlAudio()
		if (ctx) primeSilentBuffer(ctx)
	}

	if (ctx && ctx.state !== 'running') void ctx.resume().catch(() => {})
}

export function resetGestureUnlock() {
	gestureRitualDone = false
}
