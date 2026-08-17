'use client'

import { Chaospad } from '@/Chaospad'
import type { CSSProperties } from 'react'

/**
 * Local-dev surface: pad overlay on top of deliberately scrollable content,
 * so pass-through scrolling can be checked on a real phone.
 */
const SECTIONS = [
	{
		title: 'chaospad',
		body: 'Проведи пальцем где угодно по странице. Пятно частиц тянется за пальцем по инерции и отстаёт от него.',
	},
	{
		title: 'scroll',
		body: 'Эта страница длиннее экрана. Вертикальный свайп по обычному контенту скроллит её нативно — пад при этом продолжает рисовать.',
	},
	{
		title: 'no scroll',
		body: 'Если скроллить нечего (короткая страница или overflow: hidden), жест целиком достаётся паду: браузер не уводит его в резинку и pull-to-refresh.',
	},
	{
		title: 'nested scroll',
		body: 'А внутри рамки ниже свой скролл-контейнер — свайп по нему прокручивает список, а не страницу.',
	},
	{
		title: 'audio',
		body: 'Первое касание разблокирует AudioContext. Дальше каждый свайп — своя нота с пространственной панорамой.',
	},
]

const section: CSSProperties = {
	minHeight: '70dvh',
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	gap: 12,
	padding: '10dvh 24px',
	borderTop: '1px solid rgba(216, 199, 166, 0.12)',
}

const nested: CSSProperties = {
	height: 180,
	overflowY: 'auto',
	border: '1px solid rgba(216, 199, 166, 0.25)',
	borderRadius: 8,
	padding: 12,
	fontSize: 14,
	lineHeight: 1.8,
}

const Page = () => (
	<div style={{ minHeight: '100dvh', background: '#000' }}>
		<Chaospad />
		{/* без position/z-index: пад остаётся поверх контента, как в бою */}
		<main
			style={{
				maxWidth: 720,
				margin: '0 auto',
				fontFamily: 'system-ui, sans-serif',
			}}
		>
			{SECTIONS.map(({ title, body }) => (
				<section key={title} style={section}>
					<h2 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>{title}</h2>
					<p style={{ margin: 0, opacity: 0.65, lineHeight: 1.6 }}>{body}</p>
					{title === 'nested scroll' && (
						<div style={nested}>
							{Array.from({ length: 24 }, (_, i) => (
								<div key={i}>вложенная строка {i + 1}</div>
							))}
						</div>
					)}
				</section>
			))}
		</main>
	</div>
)

export default Page
