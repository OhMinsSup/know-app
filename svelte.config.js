import adapter from '@sveltejs/adapter-auto';

import { imagetools } from 'vite-imagetools';
import preprocess from 'svelte-preprocess';

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Custom __dirname as replacement for the __dirname from the commonJS in ES Module
const __dirname = dirname(fileURLToPath(import.meta.url)); // jshint ignore:line

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [
		preprocess({
			postcss: true,
			scss: {
				outputStyle: 'compressed'
			},
			preserve: ['ld+json']
		})
	],

	kit: {
		adapter: adapter(),
		vite: () => ({
			resolve: {
				alias: {
					$lib: resolve(__dirname, './src/lib')
				}
			},
			envPrefix: ['VITE_', 'KNOW_APP'],
			plugins: [imagetools({ force: true })]
		})
	}
};

export default config;
