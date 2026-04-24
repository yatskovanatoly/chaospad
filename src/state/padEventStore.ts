'use client'

import { create } from 'zustand'
import type { MotionType } from '@/components/WsContext/WsContextProvider'
import { applySegment, PAD_WAVEFORM_BINS } from '@/audio/padWaveform'
import type { UserPadState } from '@/components/ChaosPad/padEvents.types'
import { gestureSpeed01FromSegment } from '@/pad/padMotionMetrics'
import type { PadMotionEnrichment, WireMessage } from '@/type'

export type SelfUser = { userId: string; color: string }

export type GestureInput = { type: MotionType; nx: number; ny: number } & PadMotionEnrichment

export type RemoteListener = (msg: WireMessage) => void

type PadState = {
	selfUser: SelfUser | null
	wsSend: ((msg: WireMessage) => void) | null
	local: UserPadState | null
	remotes: Record<string, UserPadState>
	xyVersion: number
}

type PadActions = {
	wsBind: (params: { selfUser: SelfUser; wsSend: (msg: WireMessage) => void }) => void
	publishGesture: (g: GestureInput) => void
	publishHover: (n: { nx: number; ny: number } | null) => void
	applyRemoteEvent: (msg: WireMessage) => void
	onRemote: (cb: RemoteListener) => () => void
}

export type PadEventStoreState = PadState & PadActions

const lastHover: { current: { nx: number; ny: number } | null } = { current: null }
const lastLocal: { current: { nx: number; ny: number } | null } = { current: null }
const lastByUser: Record<string, { nx: number; ny: number } | null> = {}
const lastRemoteSampleAt: Record<string, number> = {}
const remoteListeners = new Set<RemoteListener>()

export const padEventStore = create<PadEventStoreState>((set, get) => ({
	selfUser: null,
	wsSend: null,
	local: null,
	remotes: {},
	xyVersion: 0,

	wsBind: ({ selfUser, wsSend }) =>
		set({
			selfUser,
			wsSend,
			local: {
				userId: selfUser.userId,
				color: selfUser.color,
				type: 'stop',
				nx: 0.5,
				ny: 0.5,
				updatedAt: 0,
				xyArray: new Float32Array(PAD_WAVEFORM_BINS),
				gestureSpeed01: 0,
				dtMs: 0,
			},
		}),

	publishHover: (n) => {
		const local = get().local
		if (!local) return
		if (!n) {
			lastHover.current = null
			return
		}
		const prev = lastHover.current
		applySegment(local.xyArray, prev?.nx ?? n.nx, prev?.ny ?? n.ny, n.nx, n.ny)
		lastHover.current = { nx: n.nx, ny: n.ny }
		set({ xyVersion: get().xyVersion + 1 })
	},

	publishGesture: (g) => {
		const { type, nx, ny, gestureSpeed01, dtMs } = g
		const state = get()
		const self = state.selfUser
		if (!self) return

		const xyArray = state.local?.xyArray ?? new Float32Array(PAD_WAVEFORM_BINS)

		if (type === 'start') {
			lastLocal.current = null
			lastHover.current = null
		}
		if (type === 'start' || type === 'move') {
			const prev = lastLocal.current
			applySegment(xyArray, prev?.nx ?? nx, prev?.ny ?? ny, nx, ny)
			lastLocal.current = { nx, ny }
		}
		if (type === 'stop') {
			lastLocal.current = null
			lastHover.current = { nx, ny }
		}

		const next: UserPadState = {
			userId: self.userId,
			color: self.color,
			type,
			nx,
			ny,
			updatedAt: performance.now(),
			xyArray,
			gestureSpeed01,
			dtMs,
		}

		set({ local: next, xyVersion: state.xyVersion + 1 })
		state.wsSend?.({
			userId: self.userId,
			color: self.color,
			type,
			nx,
			ny,
			gestureSpeed01,
			dtMs,
		})
	},

	applyRemoteEvent: (msg) => {
		const state = get()
		const uid = msg.userId

		if (msg.type === 'stop') {
			delete lastByUser[uid]
			delete lastRemoteSampleAt[uid]
			const remotes = { ...state.remotes }
			delete remotes[uid]
			set({ remotes, xyVersion: state.xyVersion + 1 })
			for (const l of remoteListeners) l(msg)
			return
		}

		if (msg.type === 'start') {
			lastByUser[uid] = null
			lastRemoteSampleAt[uid] = performance.now()
		}

		let buf = state.remotes[uid]?.xyArray
		if (!buf) buf = new Float32Array(PAD_WAVEFORM_BINS)

		const prev = lastByUser[uid] ?? null
		let inSpeed = 0
		let inDt = 0
		if (typeof msg.gestureSpeed01 === 'number') {
			inSpeed = msg.gestureSpeed01
			inDt = typeof msg.dtMs === 'number' ? msg.dtMs : 0
		} else if (msg.type === 'move' && prev) {
			const now = performance.now()
			const t0 = lastRemoteSampleAt[uid] ?? now
			const dtMs = now - t0
			inSpeed = gestureSpeed01FromSegment(prev, { nx: msg.nx, ny: msg.ny }, dtMs)
			inDt = dtMs
		}
		applySegment(buf, prev?.nx ?? msg.nx, prev?.ny ?? msg.ny, msg.nx, msg.ny)
		lastByUser[uid] = { nx: msg.nx, ny: msg.ny }
		if (msg.type === 'start' || msg.type === 'move') {
			lastRemoteSampleAt[uid] = performance.now()
		}

		const next: UserPadState = {
			userId: uid,
			color: msg.color,
			type: msg.type,
			nx: msg.nx,
			ny: msg.ny,
			updatedAt: performance.now(),
			xyArray: buf,
			gestureSpeed01: inSpeed,
			dtMs: inDt,
		}

		const remotes = { ...state.remotes, [uid]: next }
		set({ remotes, xyVersion: state.xyVersion + 1 })
		for (const l of remoteListeners) l(msg)
	},

	onRemote: (cb) => {
		remoteListeners.add(cb)
		return () => {
			remoteListeners.delete(cb)
		}
	},
}))

