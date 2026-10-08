import { afterEach, describe, expect, it, vi } from 'vitest';

// env.ts reads process.env when it is first imported, so each test loads its
// own copy after setting the variables.
const loadEnv = async () => {
	vi.resetModules();
	return import('../../utilities/env.js');
};

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('env', () => {
	it('reads the server settings', async () => {
		const { env } = await loadEnv();

		expect(env).toEqual({
			PROJECT_NAME: 'mock-api-framework',
			SERVER_PORT: '8000',
			USE_API_URL_PREFIX: 'api',
		});
	});

	it('ends the prefix with a slash', async () => {
		const { prefix } = await loadEnv();

		expect(prefix).toBe('api/');
	});

	it('has no prefix when USE_API_URL_PREFIX is empty', async () => {
		vi.stubEnv('USE_API_URL_PREFIX', '');

		const { prefix } = await loadEnv();

		expect(prefix).toBe('');
	});

	it('fails to load when a setting is missing', async () => {
		vi.stubEnv('SERVER_PORT', undefined);

		await expect(loadEnv()).rejects.toThrow();
	});
});
