import { attachLocalVoiceController } from './localVoiceController'
import { attachRemoteVoicesController } from './remoteVoicesController'

export const attachAudioControllers = (): (() => void) => {
	const detachLocal = attachLocalVoiceController()
	const detachRemote = attachRemoteVoicesController()
	return () => {
		detachLocal()
		detachRemote()
	}
}
