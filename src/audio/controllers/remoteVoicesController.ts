'use client'

import { getOrCreateEngine } from '@/audio/engine/audioEngineSingleton'
import { padEventStore } from '@/state/padEventStore'
import { useSettingsStore } from '@/state/settingsStore'
import { VoiceController } from './VoiceController'

const REMOTE_RELEASE = 0.5

export function attachRemoteVoicesController(): () => void {
	const vcs = new Map<string, VoiceController>()

	const getXyArray = (userId: string) => () =>
		padEventStore.getState().remotes[userId]?.xyArray

	const unsubRemote = padEventStore.getState().onRemote((msg) => {
		const engine = getOrCreateEngine()
		void engine.ctx.resume()
		const settings = useSettingsStore.getState()
		const { userId, type, nx, ny } = msg

		if (type === 'start') {
			vcs.get(userId)?.stop(REMOTE_RELEASE)
			vcs.set(
				userId,
				new VoiceController({
					engine,
					position: { nx, ny },
					quantize: settings.quantize,
					modeId: settings.soundModeId,
					getXyArray: getXyArray(userId),
				}),
			)
			return
		}

		const vc = vcs.get(userId)
		if (!vc) return

		if (type === 'move') {
			vc.setPosition(nx, ny)
			vc.notifyXyUpdate()
			return
		}

		if (type === 'stop') {
			vc.stop(REMOTE_RELEASE)
			vcs.delete(userId)
		}
	})

	let prevSettings = useSettingsStore.getState()
	const unsubSettings = useSettingsStore.subscribe((s) => {
		const ps = prevSettings
		prevSettings = s
		if (s.quantize !== ps.quantize) {
			for (const vc of vcs.values()) vc.setQuantize(s.quantize)
		}
		if (s.soundModeId !== ps.soundModeId) {
			for (const vc of vcs.values()) vc.setMode(s.soundModeId)
		}
	})

	return () => {
		unsubRemote()
		unsubSettings()
		for (const vc of vcs.values()) vc.stop(REMOTE_RELEASE)
		vcs.clear()
	}
}
