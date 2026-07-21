/** iOS / Safari: resume and play a silent buffer inside the user-gesture stack. */
export function unlockAudioContext(ctx: AudioContext) {
	if (ctx.state === 'running') return

	const buffer = ctx.createBuffer(1, 1, 22050)
	const source = ctx.createBufferSource()
	source.buffer = buffer
	source.connect(ctx.destination)
	source.start(0)
	void ctx.resume()
}
