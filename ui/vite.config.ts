import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// The mock server, which `npm run dev` starts
const server = 'http://localhost:8000';

export default defineConfig({
	plugins: [svelte()],
	server: {
		port: 5173,
		strictPort: true,
		open: true,
		proxy: {
			'/ping': server,
			'/ui-meta': server,
			'/ui-request-log': server,
			'/api': server,
		},
	},
	build: {
		assetsDir: 'assets',
		sourcemap: true,
	},
});
