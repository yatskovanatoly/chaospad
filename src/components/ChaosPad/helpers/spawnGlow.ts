import type { MotionType } from '@/components/WsContext/WsContextProvider'

const spawnGlow = (
	x: number,
	y: number,
	color: string,
	_type: MotionType,
) => {
	const glow = document.createElement('div')
	glow.classList.add(
		'glow',
		'absolute',
		'rounded-full',
		'border-4',
		'opacity-60',
		'transition-all',
		'pointer-events-none',
		'ease-in-out',
		'blur-xs',
		color
	)
	glow.style.left = `${x - 25}px`
	glow.style.top = `${y - 25}px`
	glow.style.width = '50px'
	glow.style.height = '50px'
	glow.style.animation = 'glow-effect .5s ease-in-out'

	document.body.appendChild(glow)
	setTimeout(() => glow.remove(), 500)
}

export default spawnGlow
