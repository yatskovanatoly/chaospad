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
	// overflow у html/body каскадируется на вьюпорт: hidden режет скролл страницы
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

/**
 * Что нужно прокрутить под этой точкой: ближайший скроллящийся предок или
 * скроллер страницы. null — скроллить нечего.
 */
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

/** Двигает одну ось, возвращая true, если элемент реально сдвинулся. */
function scrollAxis(el: Element, axis: Axis, delta: number): boolean {
	const before = el[axis]
	el[axis] = before + delta
	return el[axis] !== before
}

/**
 * Прокрутка с передачей странице той оси, по которой вложенный контейнер
 * упёрся в край.
 */
export function scrollWithChaining(
	el: Element,
	dx: number,
	dy: number,
): boolean {
	const movedX = dx !== 0 && scrollAxis(el, 'scrollLeft', dx)
	const movedY = dy !== 0 && scrollAxis(el, 'scrollTop', dy)
	let moved = movedX || movedY

	const page = document.scrollingElement
	if (page && page !== el) {
		if (dx !== 0 && !movedX) moved = scrollAxis(page, 'scrollLeft', dx) || moved
		if (dy !== 0 && !movedY) moved = scrollAxis(page, 'scrollTop', dy) || moved
	}

	return moved
}
