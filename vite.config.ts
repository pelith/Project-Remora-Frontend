import { fileURLToPath, URL } from 'node:url';
import { jsxLocPlugin } from '@builder.io/vite-plugin-jsx-loc';
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		devtools(),
		tanstackRouter({
			target: 'react',
			autoCodeSplitting: true,
		}),
		viteReact(),
		tailwindcss(),
		jsxLocPlugin(),
	],
	server: {
		port: 3000,
		allowedHosts: ['paul-devv.ngrok.app'],
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
});
