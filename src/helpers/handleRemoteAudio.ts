import { RemoteUserType } from '@/components/hooks/useChaosWs'
import { createSoundChain } from './createSoundChain'
import { getSoundParamsFromXY } from './getSoundParams'

const handleRemoteEvent = ({
	userId,
	type,
	x,
	y,
	ctx,
	remoteUsersRef,
}: RemoteProps) => {
	if (!ctx) {
		ctx = new AudioContext()
	}

	

	if (type === 'start') {
		const { osc, gain } = createSoundChain(ctx, x, y)
		osc.start()
		remoteUsersRef[userId] = { osc, gain }
	}

	if (type === 'move') {
		const user = remoteUsersRef[userId]
    const { freq, amp } = getSoundParamsFromXY(x, y)
		if (user) {
			user.osc.frequency.setValueAtTime(freq, ctx.currentTime)
			user.gain.gain.cancelScheduledValues(ctx.currentTime)
			user.gain.gain.setValueAtTime(amp * 0.5, ctx.currentTime)
		}
	}

	if (type === 'stop') {
		const user = remoteUsersRef[userId]
		if (user) {
			user.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
			user.osc.stop(ctx.currentTime + 0.6)
			delete remoteUsersRef[userId]
		}
	}
}

type RemoteProps = {
	userId: string
	type: string
	x: number
	y: number
	ctx: AudioContext | null
	remoteUsersRef: RemoteUserType
}

export default handleRemoteEvent
