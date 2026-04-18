const BORDER_RGB: Record<string, [number, number, number]> = {
	'border-blue-500': [0.231, 0.51, 0.965],
	'border-red-500': [0.937, 0.267, 0.267],
	'border-green-500': [0.133, 0.773, 0.369],
	'border-yellow-500': [0.918, 0.702, 0.031],
	'border-purple-500': [0.659, 0.333, 0.969],
}

export function getBorderClassRgb(className: string): [number, number, number] {
	return BORDER_RGB[className] ?? BORDER_RGB['border-blue-500']
}
