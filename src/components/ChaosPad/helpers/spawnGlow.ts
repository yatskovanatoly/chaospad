const spawnGlow = (
	container: HTMLElement,
	x: number,
	y: number,
	color: string,
	size: number,
) => {
	const half = size / 2
	const glow = document.createElement('div')
	glow.className = 'chaospad-glow'
	glow.style.left = `${x - half}px`
	glow.style.top = `${y - half}px`
	glow.style.width = `${size}px`
	glow.style.height = `${size}px`
	glow.style.borderColor = color
	glow.style.animation = 'glow-effect 0.5s ease-in-out'

	container.appendChild(glow)
	setTimeout(() => glow.remove(), 500)
}

export default spawnGlow
