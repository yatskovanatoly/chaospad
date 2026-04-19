export type ThrottledTrigger = {
	trigger: () => void
	cancel: () => void
}

export const createThrottledTrigger = (fn: () => void, delayMs: number): ThrottledTrigger => {
	let timer: ReturnType<typeof setTimeout> | null = null

	const trigger = () => {
		if (timer != null) return
		timer = setTimeout(() => {
			timer = null
			fn()
		}, delayMs)
	}

	const cancel = () => {
		if (timer != null) {
			clearTimeout(timer)
			timer = null
		}
	}

	return { trigger, cancel }
}
