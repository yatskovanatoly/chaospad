'use client'

import {
	resolveChaospadConfig,
	type ChaospadConfig,
	type ResolvedChaospadConfig,
} from '@/types/config'
import { createContext, useContext, useMemo, type ReactNode } from 'react'

const ChaospadConfigContext = createContext<ResolvedChaospadConfig | null>(
	null,
)

export function ChaospadConfigProvider({
	config,
	children,
}: {
	config?: ChaospadConfig
	children: ReactNode
}) {
	const resolved = useMemo(() => resolveChaospadConfig(config), [config])

	return (
		<ChaospadConfigContext.Provider value={resolved}>
			{children}
		</ChaospadConfigContext.Provider>
	)
}

export function useChaospadConfig() {
	const ctx = useContext(ChaospadConfigContext)
	if (!ctx) {
		throw new Error(
			'useChaospadConfig must be used within ChaospadConfigProvider',
		)
	}
	return ctx
}
