export type TrailBuffer = {
	fbos: [WebGLFramebuffer, WebGLFramebuffer]
	textures: [WebGLTexture, WebGLTexture]
	readIdx: number
	width: number
	height: number
}

export function createTrailBuffer(
	gl: WebGL2RenderingContext,
	width: number,
	height: number,
): TrailBuffer {
	const trail: TrailBuffer = {
		fbos: [gl.createFramebuffer()!, gl.createFramebuffer()!],
		textures: [gl.createTexture()!, gl.createTexture()!],
		readIdx: 0,
		width,
		height,
	}
	resizeTrailBuffer(gl, trail, width, height)
	return trail
}

export function resizeTrailBuffer(
	gl: WebGL2RenderingContext,
	trail: TrailBuffer,
	width: number,
	height: number,
): void {
	trail.width = width
	trail.height = height
	for (let i = 0; i < 2; i++) {
		gl.bindTexture(gl.TEXTURE_2D, trail.textures[i])
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
		gl.bindFramebuffer(gl.FRAMEBUFFER, trail.fbos[i])
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, trail.textures[i], 0)
	}
	gl.bindFramebuffer(gl.FRAMEBUFFER, null)
	gl.bindTexture(gl.TEXTURE_2D, null)
}

export function destroyTrailBuffer(
	gl: WebGL2RenderingContext,
	trail: TrailBuffer,
): void {
	for (const fb of trail.fbos) gl.deleteFramebuffer(fb)
	for (const tex of trail.textures) gl.deleteTexture(tex)
}

export function blitTexture(
	gl: WebGL2RenderingContext,
	program: WebGLProgram,
	quadVao: WebGLVertexArrayObject,
	texture: WebGLTexture,
	fade: number,
): void {
	gl.useProgram(program)
	gl.bindVertexArray(quadVao)
	gl.activeTexture(gl.TEXTURE0)
	gl.bindTexture(gl.TEXTURE_2D, texture)
	gl.uniform1i(gl.getUniformLocation(program, 'uTexture'), 0)
	gl.uniform1f(gl.getUniformLocation(program, 'uFade'), fade)
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}
