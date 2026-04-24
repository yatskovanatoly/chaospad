import type { ComponentType } from 'react'
import type { SoundModeId } from '@/audio'
import GlowViz from './GlowViz'
import SquaresViz from './SquaresViz'
import WebGLViz from './WebGLViz'
import SpeedViz from './SpeedViz'

export const vizBySoundMode: Record<SoundModeId, ComponentType> = {
	sine: GlowViz,
	padWaveform: WebGLViz,
	volumeLfoBuffer: SquaresViz,
	pitchLfoBuffer: GlowViz,
	speedPitch: SpeedViz,
}
