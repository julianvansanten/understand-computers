import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// Sub-path hosting (GitHub Pages project sites) sets BASE_PATH=/repo-name.
const base = (process.env.BASE_PATH ?? '') as '' | `/${string}`;

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({ fallback: '404.html' }),
			paths: { base }
		})
	],
	test: { include: ['src/**/*.test.ts'] }
});
