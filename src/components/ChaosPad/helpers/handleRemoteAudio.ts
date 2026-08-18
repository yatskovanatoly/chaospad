import type { RemoteUserType } from '@/components/ChaosPad/hooks/useChaosWs'
import type { AudioEngine } from '@/components/AudioEngineContext/AudioEngine'
import { getPresetForUser } from '@/components/AudioEngineContext/presets/catalog'
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
	engine.ensureReady()

	if (type === 'start') {
		remoteUsersRef[userId]?.stop(remoteRelease)
		remoteUsersRef[userId] = engine.createVoice(
			{ nx, ny },
			quantize,
			getPresetForUser(userId),
		)
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
