/** iOS / Safari: resume inside the user-gesture stack; silent buffer is best-effort. */
export function unlockAudioContext(ctx: AudioContext) {
	if (ctx.state === 'running') return

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
