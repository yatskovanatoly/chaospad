'use client'

import { PadInputProvider } from './PadInputContext'
import { PadLayer } from './PadLayer'
import { PadSurfaceProvider } from './PadSurfaceContext'

export function Pad() {
	return (
		<PadSurfaceProvider>
			<PadInputProvider>
				<PadLayer />
			</PadInputProvider>
		</PadSurfaceProvider>
	)
}
