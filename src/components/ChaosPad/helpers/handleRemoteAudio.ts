import type { RemoteUserType } from '@/components/ChaosPad/hooks/useChaosWs'
import type { AudioEngine } from '@/components/AudioEngineContext/AudioEngine'
import type { QuantizeMode } from '@/components/AudioEngineContext/helpers/quantizeFreq'

const REMOTE_RELEASE = 0.5

const handleRemoteEvent = ({
	userId,
	type,
	x,
	y,
	engine,
	remoteUsersRef,
	quantize,
}: RemoteProps) => {
	void engine.ctx.resume()

	if (type === 'start') {
		const existing = remoteUsersRef[userId]
		if (existing) {
			existing.stop(REMOTE_RELEASE)
		}
		remoteUsersRef[userId] = engine.createVoice({ x, y }, quantize)
	}

	if (type === 'move') {
		remoteUsersRef[userId]?.updatePosition(x, y)
	}

	if (type === 'stop') {
		const user = remoteUsersRef[userId]
		if (user) {
			user.stop(REMOTE_RELEASE)
			delete remoteUsersRef[userId]
		}
	}
}

type RemoteProps = {
	userId: string
	type: string
	x: number
	y: number
	engine: AudioEngine
	remoteUsersRef: RemoteUserType
	quantize: QuantizeMode
}

export default handleRemoteEvent
