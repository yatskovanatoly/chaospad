import { WSContextType } from '@/type'
import { createContext } from 'react'

export const WebSocketContext = createContext<WSContextType | null>(null)
