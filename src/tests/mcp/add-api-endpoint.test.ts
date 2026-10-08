import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { apiHandlerExample } from '../../mcp/data/api-handler-example.js';
import { addApiEndpoint } from '../../mcp/helpers/add-api-endpoint.js';

describe('addApiEndpoint', () => {
	let apiDir: string;

	beforeEach(() => {
		apiDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-api-'));
	});

	afterEach(() => {
		fs.rmSync(apiDir, { recursive: true, force: true });
	});

	it('saves the code as api.ts in a folder named after the endpoint', async () => {
		const result = await addApiEndpoint('dogs', 'a dog', '// code', apiDir);

		expect(result.ok).toBe(true);
		expect(result.message).toContain('http://localhost:8000/api/dogs');
		expect(
			fs.readFileSync(path.join(apiDir, 'dogs', 'api.ts'), 'utf8'),
		).toBe('// code');
	});

	it('leaves an endpoint that already exists alone', async () => {
		await addApiEndpoint('dogs', 'a dog', '// first', apiDir);

		const result = await addApiEndpoint(
			'dogs',
			'a dog',
			'// second',
			apiDir,
		);

		expect(result.ok).toBe(false);
		expect(
			fs.readFileSync(path.join(apiDir, 'dogs', 'api.ts'), 'utf8'),
		).toBe('// first');
	});

	it.each(['../outside', 'a/b', 'a\\b', '..', 'with space', 'dogs.v2'])(
		'refuses the name %s',
		async (name) => {
			const result = await addApiEndpoint(
				name,
				'a dog',
				'// code',
				apiDir,
			);

			expect(result.ok).toBe(false);
			expect(fs.readdirSync(apiDir)).toEqual([]);
		},
	);

	it('refuses an endpoint with no code', async () => {
		const result = await addApiEndpoint('dogs', 'a dog', '', apiDir);

		expect(result.ok).toBe(false);
		expect(fs.readdirSync(apiDir)).toEqual([]);
	});
});

describe('apiHandlerExample', () => {
	it('gives import paths that work from src/api/<name>/api.ts', () => {
		const example = apiHandlerExample();

		expect(example).toContain('registerCustomRoutes');
		expect(example).toContain("'../../models/db.js'");
		expect(example).not.toContain('../../src/');
	});
});
