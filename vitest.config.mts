import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';

// `npm run mcp:build` leaves a .js file beside each .ts file in src/mcp. An
// import of './x.js' would then load that build output, which may be out of
// date and counts for no coverage, so the .ts file beside it is used instead.
const sourceOverBuild: Plugin = {
	name: 'source-over-build',
	enforce: 'pre',
	resolveId(id, importer) {
		// Relative imports only, so packages are left alone
		if (!importer || !/^\..*\.js$/.test(id)) {
			return null;
		}
		const source = path.resolve(
			path.dirname(importer),
			`${id.slice(0, -3)}.ts`,
		);
		return fs.existsSync(source) ? source : null;
	},
};

export default defineConfig({
	plugins: [sourceOverBuild],
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
