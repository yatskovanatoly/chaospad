export const colors = [
	'border-blue-500',
	'border-red-500',
	'border-green-500',
	'border-yellow-500',
	'border-purple-500',
]

export const getColorForUser = (id: string | undefined) => {
	if (!id) return undefined

	let hash = 0
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash)
	}
	const index = Math.abs(hash) % colors.length
	return colors[index]
}

export const getUserId = () => {
	try {
		return crypto.randomUUID()
	} catch (_error) {
		console.log('Error: Insecure environment to use crypto.randomUUID')
		return Math.random().toFixed()
	}
}
