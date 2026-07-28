const SMOOTH = 0.03

export type SpatialChain = {
	input: GainNode
	setParams: (pan: number, reverbSend: number) => void
	dispose: () => void
}

export function createSpatialChain(
	ctx: AudioContext,
	dryTarget: AudioNode,
	sendTarget: AudioNode,
): SpatialChain {
	const input = ctx.createGain()
	const panner = ctx.createStereoPanner()
	const sendGain = ctx.createGain()

	input.connect(panner)
	panner.connect(dryTarget)
	panner.connect(sendGain)
	sendGain.connect(sendTarget)

	const setParams = (pan: number, reverbSend: number) => {
		const t = ctx.currentTime
		panner.pan.setTargetAtTime(pan, t, SMOOTH)
		sendGain.gain.setTargetAtTime(reverbSend, t, SMOOTH)
	}

	return {
		input,
		setParams,
		dispose: () => {
			input.disconnect()
			panner.disconnect()
			sendGain.disconnect()
		},
	}
}
