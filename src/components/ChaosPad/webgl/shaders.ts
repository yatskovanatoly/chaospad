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
	float lifeScale = 0.6 + 0.4 * vLife;
	gl_PointSize = max(aSize * lifeScale * uResolution.y * 0.0075, 6.0);
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
	float core = exp(-d2 * 16.0);
	float halo = exp(-d2 * 5.5);
	float energy = (core * 0.9 + halo * 0.1) * pow(vLife, 0.82);
	float luma = dot(vColor, vec3(0.299, 0.587, 0.114));
	vec3 col = mix(vec3(luma), vColor, 1.35);
	float alpha = energy * 0.88;
	vec3 rgb = col * energy * 0.92;
	outColor = vec4(rgb, alpha);
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
