import fs from 'node:fs';
import fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import getApiRoutes from '../../utilities/file-scan.js';

beforeEach(() => {
	vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('getApiRoutes', () => {
	it('registers a route for every folder in src/api', async () => {
		const app = fastify();

		const { apiRoutes } = await getApiRoutes(app);

		expect(apiRoutes).toEqual(fs.readdirSync('src/api'));
		expect(apiRoutes).toContain('error');

		const response = await app.inject({
			method: 'GET',
			url: '/api/error?status=418&message=Teapot',
		});
		expect(response.statusCode).toBe(418);
		expect(response.json()).toEqual({ error: '418: Teapot' });
	});

	it('explains what is wrong when a folder has no api.ts', async () => {
		vi.spyOn(fs, 'readdirSync').mockReturnValue([
			'no-such-route',
		] as unknown as ReturnType<typeof fs.readdirSync>);
		vi.spyOn(fs, 'statSync').mockReturnValue({
			isDirectory: () => true,
		} as fs.Stats);

		await expect(getApiRoutes(fastify())).rejects.toThrow(
			'CANNOT LOAD AN API ROUTE FROM SRC/API',
		);
	});

	it('skips files that sit beside the route folders', async () => {
		vi.spyOn(fs, 'readdirSync').mockReturnValue([
			'notes.md',
		] as unknown as ReturnType<typeof fs.readdirSync>);
		vi.spyOn(fs, 'statSync').mockReturnValue({
			isDirectory: () => false,
		} as fs.Stats);

		const { apiRoutes } = await getApiRoutes(fastify());

		expect(apiRoutes).toEqual([]);
	});
});
