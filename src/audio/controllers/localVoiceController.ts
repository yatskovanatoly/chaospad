'use client'

import { getEngine, getOrCreateEngine } from '@/audio/engine/audioEngineSingleton'
import { padEventStore } from '@/state/padEventStore'
import { useSettingsStore } from '@/state/settingsStore'
import { VoiceController } from './VoiceController'

export function attachLocalVoiceController(): () => void {
	let vc: VoiceController | null = null
	let pendingMove: { nx: number; ny: number } | null = null
	let moveRaf: number | null = null

	const getXyArray = () => padEventStore.getState().local?.xyArray

	const stopVoice = () => {
		const { release } = useSettingsStore.getState()
		if (vc) {
			vc.stop(release)
			vc = null
		}
		if (moveRaf != null) {
			cancelAnimationFrame(moveRaf)
			moveRaf = null
		}
		pendingMove = null
	}

	const startVoice = (nx: number, ny: number) => {
		const engine = getOrCreateEngine()
		const settings = useSettingsStore.getState()
		engine.setVolume(settings.volume)
		engine.setReverbLevel(settings.reverbLevel)
		const run = () => {
			vc = new VoiceController({
				engine,
				position: { nx, ny },
				quantize: settings.quantize,
				modeId: settings.soundModeId,
				getXyArray,
			})
		}
		if (engine.ctx.state === 'suspended') {
			void engine.ctx.resume().then(run)
		} else {
			run()
		}
	}

	let prevLocal = padEventStore.getState().local
	const unsubPadLocal = padEventStore.subscribe((s) => {
		const local = s.local
		if (local === prevLocal) return
		prevLocal = local
		if (!local) return

		if (local.type === 'start' && !vc) {
			startVoice(local.nx, local.ny)
			return
		}

		if (local.type === 'move' && vc) {
			pendingMove = { nx: local.nx, ny: local.ny }
			if (moveRaf == null) {
				moveRaf = requestAnimationFrame(() => {
					moveRaf = null
					if (pendingMove && vc) vc.setPosition(pendingMove.nx, pendingMove.ny)
				})
			}
			return
		}

		if (local.type === 'stop' && vc) {
			if (pendingMove) vc.setPosition(pendingMove.nx, pendingMove.ny)
			stopVoice()
		}
	})

	let prevXyVersion = padEventStore.getState().xyVersion
	const unsubPadWave = padEventStore.subscribe((s) => {
		if (s.xyVersion === prevXyVersion) return
		prevXyVersion = s.xyVersion
		vc?.notifyXyUpdate()
	})

	let prevSettings = useSettingsStore.getState()
	const unsubSettings = useSettingsStore.subscribe((s) => {
		const ps = prevSettings
		prevSettings = s
		const engine = getEngine()
		if (engine) {
			if (s.volume !== ps.volume) engine.setVolume(s.volume)
			if (s.reverbLevel !== ps.reverbLevel) engine.setReverbLevel(s.reverbLevel)
		}
		if (vc && s.quantize !== ps.quantize) vc.setQuantize(s.quantize)
		if (vc && s.soundModeId !== ps.soundModeId) vc.setMode(s.soundModeId)
	})

	return () => {
		unsubPadLocal()
		unsubPadWave()
		unsubSettings()
		stopVoice()
	}
}
