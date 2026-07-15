'use client'

import { Chaospad } from '@/Chaospad'

const Page = () => (
	<div style={{ width: '100%', height: '100dvh', background: 'linear-gradient(to top, #1f2937, #000)' }}>
		<Chaospad
			config={{
				volume: 1,
				reverbLevel: 0.5,
				release: 0.5,
				quantize: 'chromatic',
			}}
		/>
	</div>
)

export default Page
