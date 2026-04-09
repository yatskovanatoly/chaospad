import { useContext } from "react"
import { AudioEngineContext } from "./AudioEngineContext"

export function useAudioEngine() {
    const engine = useContext(AudioEngineContext)
    if (!engine) {
        throw new Error('useAudioEngine must be used within AudioEngineProvider')
    }
    return engine
}
