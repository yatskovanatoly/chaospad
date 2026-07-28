export const PARTICLE_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
layout(location = 1) in float aLife;
layout(location = 2) in vec3 aColor;
layout(location = 3) in float aSize;
uniform vec2 uResolution;
out float vLife;
out vec3 vColor;
void main() {
	vec2 clip = vec2(aPosition.x * 2.0 - 1.0, 1.0 - aPosition.y * 2.0);
	gl_Position = vec4(clip, 0.0, 1.0);
	vLife = aLife;
	float lifeScale = 0.45 + 0.55 * vLife;
	gl_PointSize = max(aSize * lifeScale * uResolution.y * 0.0028, 2.0);
	vColor = aColor;
}
`

export const PARTICLE_FRAGMENT = `#version 300 es
precision highp float;
in float vLife;
in vec3 vColor;
out vec4 outColor;
void main() {
	vec2 uv = gl_PointCoord - 0.5;
	float d2 = dot(uv, uv);
	float core = exp(-d2 * 12.0);
	float halo = exp(-d2 * 4.5);
	float alpha = (core * 0.62 + halo * 0.28) * vLife;
	outColor = vec4(vColor * (0.55 + core * 0.45 + halo * 0.15), alpha);
}
`

export const FADE_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
out vec2 vUv;
void main() {
	vUv = aPosition * 0.5 + 0.5;
	gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

export const FADE_FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uTexture;
uniform float uFade;
in vec2 vUv;
out vec4 outColor;
void main() {
	outColor = texture(uTexture, vUv) * uFade;
}
`
