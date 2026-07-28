export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const smoothLife = (life: number) => life * life * (3 - 2 * life)
