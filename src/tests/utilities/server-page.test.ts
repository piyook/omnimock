import fs from 'node:fs';
import fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetChaos } from '../../utilities/chaos.js';
import { logPath } from '../../utilities/logger.js';
import serverPage from '../../utilities/server-page.js';

// The built dashboard and the log file are stood in for by `files`, keyed by
// the end of the path asked for, so the tests need neither to exist. Any other
// path is read from disk as usual.
let files: Record<string, string> = {};

const normalise = (file: unknown) => String(file).replaceAll('\\', '/');

const standsIn = (file: unknown) =>
	normalise(file).includes('/ui/dist') ||
	normalise(file) === normalise(logPath);

const find = (file: unknown) =>
	Object.keys(files).find((name) => normalise(file).endsWith(name));

const realRead = fs.readFileSync;
const realExists = fs.existsSync;
const realStat = fs.statSync;

beforeEach(() => {
	files = {};
	resetChaos();
	vi.spyOn(fs, 'existsSync').mockImplementation((file) =>
		standsIn(file) ? !!find(file) : realExists(file),
	);
	vi.spyOn(fs, 'statSync').mockImplementation(((
		file: fs.PathLike,
		...rest: []
	) =>
		standsIn(file)
			? { isFile: () => true }
			: realStat(file, ...rest)) as typeof fs.statSync);
	vi.spyOn(fs, 'readFileSync').mockImplementation(((
		file: fs.PathLike,
		...rest: []
	) => {
		if (!standsIn(file)) return realRead(file, ...rest);
		const name = find(file);
		if (!name) throw new Error('ENOENT');
		return Buffer.from(files[name]);
	}) as typeof fs.readFileSync);
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
});

const buildApp = () => {
	const app = fastify();
	serverPage(app, ['bikes', 'cats']);
	return app;
};

describe('/ui-meta', () => {
	it('reports the server settings and its endpoints', async () => {
		const response = await buildApp().inject('/ui-meta');

		expect(response.json()).toEqual({
			version: JSON.parse(realRead('package.json', 'utf8')).version,
			projectName: 'mock-api-framework',
			serverPort: 8000,
			urlPrefix: 'api',
			apiLinks: [
				{ href: '/api/bikes', label: '/api/bikes' },
				{ href: '/api/cats', label: '/api/cats' },
			],
			logRequests: 'OFF',
			maxLoggedRequests: 10,
			dbPersist: 'OFF',
			chaosStatus: 'DISABLED',
			chaosFrequency: 5,
			chaosMode: 'every',
			chaosErrorStatus: 500,
			chaosInjected: 0,
		});
	});

	it('reports what is turned on', async () => {
		vi.stubEnv('LOG_REQUESTS', 'on');
		vi.stubEnv('MAX_LOGGED_REQUESTS', '3');
		vi.stubEnv('MOCK_DB_PERSIST', 'ON');
		vi.stubEnv('CHAOS_ENABLED', 'ON');
		vi.stubEnv('CHAOS_FREQUENCY', '4');
		vi.stubEnv('CHAOS_MODE', 'random');
		vi.stubEnv('CHAOS_STATUS', '503');

		const response = await buildApp().inject('/ui-meta');

		expect(response.json()).toMatchObject({
			logRequests: 'ON',
			maxLoggedRequests: 3,
			dbPersist: 'ON',
			chaosStatus: 'ENABLED',
			chaosFrequency: 4,
			chaosMode: 'random',
			chaosErrorStatus: 503,
		});
	});
});

describe('/ui-request-log', () => {
	it('gives a null log when nothing has been logged', async () => {
		const response = await buildApp().inject('/ui-request-log');

		expect(response.json()).toEqual({ file: logPath, log: null });
	});

	it('gives the logged requests, no more than the limit', async () => {
		vi.stubEnv('MAX_LOGGED_REQUESTS', '2');
		files['api_request_log.json'] = '[{"id":3},{"id":2},{"id":1}]';

		const response = await buildApp().inject('/ui-request-log');

		expect(response.json().log).toEqual([{ id: 3 }, { id: 2 }]);
	});

	it('empties the log on DELETE', async () => {
		const remove = vi.spyOn(fs, 'rmSync').mockImplementation(() => {});

		const response = await buildApp().inject({
			method: 'DELETE',
			url: '/ui-request-log',
		});

		expect(remove).toHaveBeenCalledWith(logPath, { force: true });
		expect(response.json()).toEqual({ file: logPath, log: null });
	});

	it('answers 500 with the reason when the log cannot be emptied', async () => {
		vi.spyOn(fs, 'rmSync').mockImplementation(() => {
			throw new Error('file is locked');
		});

		const response = await buildApp().inject({
			method: 'DELETE',
			url: '/ui-request-log',
		});

		expect(response.statusCode).toBe(500);
		expect(response.json()).toEqual({ error: 'file is locked' });
	});
});

describe('the dashboard', () => {
	it('serves the built page at /', async () => {
		files['ui/dist/index.html'] = '<html>dashboard</html>';

		const response = await buildApp().inject('/');

		expect(response.headers['content-type']).toBe(
			'text/html; charset=utf-8',
		);
		expect(response.body).toBe('<html>dashboard</html>');
	});

	it('says how to build the page when it has not been built', async () => {
		const response = await buildApp().inject('/');

		expect(response.statusCode).toBe(200);
		expect(response.body).toContain("use 'npm run compile-ui'");
	});

	it('serves built assets and root files with their content type', async () => {
		files['ui/dist/assets/index.js'] = 'console.log(1)';
		files['ui/dist/favicon.svg'] = '<svg/>';
		files['ui/dist/data.bin'] = '01';
		const app = buildApp();

		const script = await app.inject('/assets/index.js');
		const icon = await app.inject('/favicon.svg');
		const other = await app.inject('/data.bin');

		expect(script.headers['content-type']).toBe(
			'text/javascript; charset=utf-8',
		);
		expect(script.body).toBe('console.log(1)');
		expect(icon.headers['content-type']).toBe('image/svg+xml');
		expect(other.headers['content-type']).toBe('application/octet-stream');
	});

	it.each([['/assets/missing.js'], ['/missing.svg'], ['/no-extension']])(
		'answers 404 for %s',
		async (url) => {
			const response = await buildApp().inject(url);

			expect(response.statusCode).toBe(404);
		},
	);

	it('does not serve a folder', async () => {
		files['ui/dist/assets/fonts.d'] = '';
		vi.mocked(fs.statSync).mockReturnValue({
			isFile: () => false,
		} as fs.Stats);

		const response = await buildApp().inject('/assets/fonts.d');

		expect(response.statusCode).toBe(404);
	});

	it('does not serve a file outside the built page', async () => {
		const response = await buildApp().inject(
			`/assets/${encodeURIComponent('../../../package.json')}`,
		);

		expect(response.statusCode).toBe(404);
	});
});

describe('/ping', () => {
	it('says the server is running', async () => {
		const response = await buildApp().inject('/ping');

		expect(response.json()).toEqual({ response: 'server is running' });
	});
});
