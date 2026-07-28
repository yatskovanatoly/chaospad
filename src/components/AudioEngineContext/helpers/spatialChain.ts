const SMOOTH = 0.03

export type SpatialChain = {
	input: GainNode
	dryOut: GainNode
	wetOut: GainNode
	setParams: (pan: number, reverbSend: number) => void
	dispose: () => void
}

export function createSpatialChain(ctx: AudioContext): SpatialChain {
	const input = ctx.createGain()
	const panner = ctx.createStereoPanner()
	const dryOut = ctx.createGain()
	const wetOut = ctx.createGain()

	input.connect(panner)
	panner.connect(dryOut)
	panner.connect(wetOut)

	const setParams = (pan: number, reverbSend: number) => {
		const t = ctx.currentTime
		panner.pan.setTargetAtTime(pan, t, SMOOTH)
		dryOut.gain.setTargetAtTime(1 - reverbSend * 0.65, t, SMOOTH)
		wetOut.gain.setTargetAtTime(reverbSend, t, SMOOTH)
	}

	return {
		input,
		dryOut,
		wetOut,
		setParams,
		dispose: () => {
			input.disconnect()
			panner.disconnect()
			dryOut.disconnect()
			wetOut.disconnect()
		},
	}
}
