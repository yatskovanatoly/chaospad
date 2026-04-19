'use client'

import { ChaosBootstrap } from './ChaosBootstrap'
import { ChaosPadControls } from './ChaosPadControls'
import { Pad } from './Pad/Pad'

export default function ChaosPad() {
	return (
		<>
			<ChaosBootstrap />
			<div className='w-full h-dvh bg-gradient-to-t from-gray-800 to-black flex flex-col items-center justify-center select-none'>
				<Pad />
				<ChaosPadControls />
			</div>
		</>
	)
}
