const SCROLL_EPS = 2
const SCROLLS = /auto|scroll|overlay/
const CLIPS = /hidden|clip/

function scrollsY(el: Element, style: CSSStyleDeclaration): boolean {
	return (
		SCROLLS.test(style.overflowY) &&
		el.scrollHeight > el.clientHeight + SCROLL_EPS
	)
}

function scrollsX(el: Element, style: CSSStyleDeclaration): boolean {
	return (
		SCROLLS.test(style.overflowX) && el.scrollWidth > el.clientWidth + SCROLL_EPS
	)
}

function pageScroller(): Element | null {
	const html = document.documentElement
	const htmlStyle = getComputedStyle(html)
	const bodyStyle = document.body ? getComputedStyle(document.body) : htmlStyle
	const clippedY =
		CLIPS.test(htmlStyle.overflowY) || CLIPS.test(bodyStyle.overflowY)
	const clippedX =
		CLIPS.test(htmlStyle.overflowX) || CLIPS.test(bodyStyle.overflowX)
	const scroller = document.scrollingElement ?? html

	const canY =
		!clippedY && scroller.scrollHeight > scroller.clientHeight + SCROLL_EPS
	const canX =
		!clippedX && scroller.scrollWidth > scroller.clientWidth + SCROLL_EPS

	return canY || canX ? scroller : null
}

export function findScrollTarget(
	clientX: number,
	clientY: number,
): Element | null {
	if (typeof document === 'undefined') return null

	let node = document.elementFromPoint(clientX, clientY)
	while (node && node !== document.body && node !== document.documentElement) {
		const style = getComputedStyle(node)
		if (scrollsY(node, style) || scrollsX(node, style)) return node
		node = node.parentElement
	}

	return pageScroller()
}

type Axis = 'scrollTop' | 'scrollLeft'

export type ScrollDelta = { dx: number; dy: number }

let instantScroll: boolean | null = null

function applyScroll(el: Element, axis: Axis, value: number) {
	if (instantScroll !== false) {
		try {
			el.scrollTo({
				[axis === 'scrollTop' ? 'top' : 'left']: value,
				behavior: 'instant' as ScrollBehavior,
			})
			instantScroll = true
			return
		} catch {
			instantScroll = false
		}
	}

	el[axis] = value
}

function scrollAxis(el: Element, axis: Axis, delta: number): number {
	const before = el[axis]
	applyScroll(el, axis, before + delta)
	return el[axis] - before
}

function canScrollAxis(el: Element, axis: Axis, delta: number): boolean {
	if (delta === 0) return false

	const pos = el[axis]
	const max =
		axis === 'scrollTop'
			? el.scrollHeight - el.clientHeight
			: el.scrollWidth - el.clientWidth

	return delta < 0 ? pos > 0.5 : pos < max - 0.5
}

export function scrollWithChaining(
	el: Element,
	dx: number,
	dy: number,
): ScrollDelta {
	const page = document.scrollingElement
	const chain = (axis: Axis, delta: number) =>
		!page || page === el || canScrollAxis(el, axis, delta) ? el : page

	return {
		dx: dx !== 0 ? scrollAxis(chain('scrollLeft', dx), 'scrollLeft', dx) : 0,
		dy: dy !== 0 ? scrollAxis(chain('scrollTop', dy), 'scrollTop', dy) : 0,
	}
}
