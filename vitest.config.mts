import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts'],
		// What src/utilities/env.ts needs to load; the server gets these from .env
		env: {
			PROJECT_NAME: 'mock-api-framework',
			SERVER_PORT: '8000',
			USE_API_URL_PREFIX: 'api',
		},
		// `npm run test:coverage`. Every source file is listed, tested or not,
		// so the gaps show. The json report is the one fallow reads.
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts'],
			reporter: ['text', 'html', 'json'],
			// The least of the shared logic the tests must run, taken over
			// those files together. Routes and the MCP server have no minimum.
			thresholds: {
				'src/{models/db,utilities/*}.ts': {
					statements: 90,
					branches: 85,
					functions: 90,
					lines: 90,
				},
			},
		},
	},
});
