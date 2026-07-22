'use client'

import { Chaospad } from '@/Chaospad'

/** Blank local-dev surface: black screen + invisible pad overlay. */
const Page = () => (
	<div style={{ width: '100%', height: '100dvh', background: '#000' }}>
		<Chaospad />
	</div>
)

export default Page
