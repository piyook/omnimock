import fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buildChaosError,
	getChaosConfig,
	getChaosStats,
	isChaosTarget,
	registerChaos,
	resetChaos,
	setChaosRoutes,
	shouldInjectError,
} from '../../utilities/chaos.js';

beforeEach(() => {
	resetChaos();
	setChaosRoutes(['bikes', 'error']);
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
});

describe('getChaosConfig', () => {
	it('is off with the defaults when nothing is set', () => {
		expect(getChaosConfig()).toEqual({
			enabled: false,
			frequency: 5,
			mode: 'every',
			status: 500,
		});
	});

	it('reads the settings', () => {
		vi.stubEnv('CHAOS_ENABLED', 'on');
		vi.stubEnv('CHAOS_FREQUENCY', '3');
		vi.stubEnv('CHAOS_MODE', 'Random');
		vi.stubEnv('CHAOS_STATUS', '429');

		expect(getChaosConfig()).toEqual({
			enabled: true,
			frequency: 3,
			mode: 'random',
			status: 429,
		});
	});

	it.each([['0'], ['-2'], ['often']])(
		'falls back to 1 in 5 calls for a frequency of %s',
		(frequency) => {
			vi.stubEnv('CHAOS_FREQUENCY', frequency);

			expect(getChaosConfig().frequency).toBe(5);
		},
	);

	it.each([['200'], ['600'], ['teapot']])(
		'falls back to 500 for a status of %s',
		(status) => {
			vi.stubEnv('CHAOS_STATUS', status);

			expect(getChaosConfig().status).toBe(500);
		},
	);

	it('falls back to every for an unknown mode', () => {
		vi.stubEnv('CHAOS_MODE', 'sometimes');

		expect(getChaosConfig().mode).toBe('every');
	});
});

describe('shouldInjectError', () => {
	it('never fails a call, or counts it, while chaos is off', () => {
		expect(shouldInjectError()).toBe(false);
		expect(getChaosStats()).toEqual({ calls: 0, injected: 0 });
	});

	it('fails every Xth call in every mode', () => {
		vi.stubEnv('CHAOS_ENABLED', 'ON');
		vi.stubEnv('CHAOS_FREQUENCY', '3');

		const results = Array.from({ length: 6 }, () => shouldInjectError());

		expect(results).toEqual([false, false, true, false, false, true]);
		expect(getChaosStats()).toEqual({ calls: 6, injected: 2 });
	});

	it('fails a call with a 1 in X chance in random mode', () => {
		vi.stubEnv('CHAOS_ENABLED', 'ON');
		vi.stubEnv('CHAOS_FREQUENCY', '4');
		vi.stubEnv('CHAOS_MODE', 'random');
		const random = vi.spyOn(Math, 'random');

		random.mockReturnValue(0.24);
		expect(shouldInjectError()).toBe(true);

		random.mockReturnValue(0.25);
		expect(shouldInjectError()).toBe(false);
	});
});

describe('isChaosTarget', () => {
	it.each([
		['/api/bikes', true],
		['/api/bikes?type=ducati', true],
		['/api/bikes/1', true],
		['/api/bikeshed', false],
		['/api/error', false],
		['/api', false],
		['/', false],
		['/ui-meta', false],
	])('%s -> %s', (url, expected) => {
		expect(isChaosTarget(url)).toBe(expected);
	});
});

describe('registerChaos', () => {
	const buildApp = () => {
		const app = fastify();
		registerChaos(app);
		app.get('/api/bikes', async () => ({ ok: true }));
		app.get('/api', async () => ['/api/bikes']);
		return app;
	};

	it('leaves every call alone while chaos is off', async () => {
		const response = await buildApp().inject('/api/bikes');

		expect(response.statusCode).toBe(200);
		expect(response.headers).not.toHaveProperty('x-omnimock-chaos');
	});

	it('answers a failing call with the configured error', async () => {
		vi.stubEnv('CHAOS_ENABLED', 'ON');
		vi.stubEnv('CHAOS_FREQUENCY', '2');
		vi.stubEnv('CHAOS_STATUS', '418');
		const app = buildApp();

		const first = await app.inject('/api/bikes');
		const second = await app.inject('/api/bikes');

		expect(first.statusCode).toBe(200);
		expect(first.json()).toEqual({ ok: true });
		expect(second.statusCode).toBe(418);
		expect(second.json()).toEqual(buildChaosError(418));
		expect(second.headers['x-omnimock-chaos']).toBe('true');
		expect(second.headers).not.toHaveProperty('retry-after');
	});

	it.each([429, 503])('sends Retry-After with a %i', async (status) => {
		vi.stubEnv('CHAOS_ENABLED', 'ON');
		vi.stubEnv('CHAOS_FREQUENCY', '1');
		vi.stubEnv('CHAOS_STATUS', String(status));

		const response = await buildApp().inject('/api/bikes');

		expect(response.statusCode).toBe(status);
		expect(response.headers['retry-after']).toBe('1');
	});

	it('neither fails nor counts a call to another route', async () => {
		vi.stubEnv('CHAOS_ENABLED', 'ON');
		vi.stubEnv('CHAOS_FREQUENCY', '1');

		const response = await buildApp().inject('/api');

		expect(response.statusCode).toBe(200);
		expect(getChaosStats()).toEqual({ calls: 0, injected: 0 });
	});

	it.each([
		['a path with no route', 'GET', '/api/bikes/1/parts'],
		['a method with no route', 'OPTIONS', '/api/bikes'],
	] as const)('neither fails nor counts %s', async (_name, method, url) => {
		vi.stubEnv('CHAOS_ENABLED', 'ON');
		vi.stubEnv('CHAOS_FREQUENCY', '1');

		const response = await buildApp().inject({ method, url });

		expect(response.statusCode).toBe(404);
		expect(response.headers).not.toHaveProperty('x-omnimock-chaos');
		expect(getChaosStats()).toEqual({ calls: 0, injected: 0 });
	});

	it('fails a call sent with an encoded URL', async () => {
		vi.stubEnv('CHAOS_ENABLED', 'ON');
		vi.stubEnv('CHAOS_FREQUENCY', '1');

		const response = await buildApp().inject('/api/b%69kes');

		expect(response.statusCode).toBe(500);
		expect(getChaosStats()).toEqual({ calls: 1, injected: 1 });
	});
});
