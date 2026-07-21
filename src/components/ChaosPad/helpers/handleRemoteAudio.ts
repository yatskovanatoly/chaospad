import type { RemoteUserType } from '@/components/ChaosPad/hooks/useChaosWs'
import type { AudioEngine } from '@/components/AudioEngineContext/AudioEngine'
import { unlockAudioContext } from '@/components/AudioEngineContext/helpers/unlockAudioContext'
import type { QuantizeMode } from '@/components/AudioEngineContext/helpers/quantizeFreq'

const handleRemoteEvent = ({
	userId,
	type,
	nx,
	ny,
	engine,
	remoteUsersRef,
	quantize,
	remoteRelease,
}: RemoteProps) => {
	unlockAudioContext(engine.ctx)

	if (type === 'start') {
		const existing = remoteUsersRef[userId]
		if (existing) {
			existing.stop(remoteRelease)
		}
		remoteUsersRef[userId] = engine.createVoice({ nx, ny }, quantize)
	}

	if (type === 'move') {
		remoteUsersRef[userId]?.updatePosition(nx, ny)
	}

	if (type === 'stop') {
		const user = remoteUsersRef[userId]
		if (user) {
			user.stop(remoteRelease)
			delete remoteUsersRef[userId]
		}
	}
}

type RemoteProps = {
	userId: string
	type: string
	nx: number
	ny: number
	engine: AudioEngine
	remoteUsersRef: RemoteUserType
	quantize: QuantizeMode
	remoteRelease: number
}

export default handleRemoteEvent
