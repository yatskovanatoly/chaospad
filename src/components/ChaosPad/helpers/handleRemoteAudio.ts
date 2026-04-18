import type { RemoteUserType } from '@/components/ChaosPad/hooks/useChaosWs'
import type { SoundModeId } from '@/components/ChaosPad/sounds'
import type { AudioEngine, Voice } from '@/components/AudioEngineContext/AudioEngine'
import type { QuantizeMode } from '@/components/AudioEngineContext/helpers/quantizeFreq'

const REMOTE_RELEASE = 0.5

export const applyVoiceSoundMode = (
	voice: Voice,
	soundModeId: SoundModeId,
	getBinsForUser: (userId: string) => Float32Array | undefined,
	userId: string,
) => {
	if (soundModeId === 'sine') {
		voice.setSoundMode('sine')
		return
	}
	const bins = getBinsForUser(userId)
	if (bins) voice.setSoundMode('padWaveform', bins)
}

const handleRemoteEvent = ({
	userId,
	type,
	nx,
	ny,
	engine,
	remoteUsersRef,
	quantize,
	soundModeId,
	getBinsForUser,
}: RemoteProps) => {
	void engine.ctx.resume()

	if (type === 'start') {
		const existing = remoteUsersRef[userId]
		if (existing) {
			existing.stop(REMOTE_RELEASE)
		}
		const voice = engine.createVoice({ nx, ny }, quantize)
		remoteUsersRef[userId] = voice
		applyVoiceSoundMode(voice, soundModeId, getBinsForUser, userId)
	}

	if (type === 'move') {
		const voice = remoteUsersRef[userId]
		voice?.updatePosition(nx, ny)
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
	nx: number
	ny: number
	engine: AudioEngine
	remoteUsersRef: RemoteUserType
	quantize: QuantizeMode
	soundModeId: SoundModeId
	getBinsForUser: (userId: string) => Float32Array | undefined
}

export default handleRemoteEvent
