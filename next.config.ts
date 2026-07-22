import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	// Next.js blocks cross-origin hits to /_next in dev unless listed here.
	// `*` alone is rejected by the matcher — use broad LAN-friendly patterns.
	allowedDevOrigins: [
		'127.0.0.1',
		'*.localhost',
		'*.local',
		// any IPv4 host (phone / LAN testing)
		'*.*.*.*',
	],
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{ key: 'Access-Control-Allow-Origin', value: '*' },
					{
						key: 'Access-Control-Allow-Methods',
						value: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
					},
					{ key: 'Access-Control-Allow-Headers', value: '*' },
				],
			},
		]
	},
}

export default nextConfig
