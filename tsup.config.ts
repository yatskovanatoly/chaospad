import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm', 'cjs'],
	dts: {
		resolve: true,
	},
	tsconfig: 'tsconfig.build.json',
	sourcemap: true,
	clean: true,
	external: ['react', 'react-dom'],
	esbuildOptions(options) {
		options.alias = {
			'@': './src',
		}
	},
	onSuccess: 'cp src/styles.css dist/styles.css',
})
