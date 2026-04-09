import type { AudioEngine } from '@/components/AudioEngineContext/AudioEngine'
import { createContext } from 'react'

export const AudioEngineContext = createContext<AudioEngine | null>(null)

