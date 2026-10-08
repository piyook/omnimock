import type { FastifyInstance } from 'fastify';
import { prefix } from './env.js';

export type ChaosMode = 'every' | 'random';

export interface ChaosSettings {
	enabled: boolean;
	// X in "1 in X calls"; 1 fails every call
	frequency: number;
	// every: calls X, 2X, 3X... fail. random: each call fails with chance 1/X
	mode: ChaosMode;
	// HTTP status of the injected error
	status: number;
}

const defaultChaosFrequency = 1;
const defaultChaosStatus = 500;

// Statuses a client is expected to wait on before retrying
const retryAfterStatuses = new Set([429, 503]);

// The mock error endpoint always answers with the error it is asked for, so
// chaos leaves it alone
const exemptRoutes = new Set(['error']);

// Calls that could have failed, and how many of them did
let calls = 0;
let injected = 0;

// Paths of the routes in src/api that chaos can fail, e.g. /api/bikes
let targets: string[] = [];

// The chaos settings of this run. Anything that isn't valid falls back to its
// default: a frequency below 1, a mode other than "random", a status outside
// 400 to 599.
export function getChaosConfig(): ChaosSettings {
	const frequency = Math.floor(Number(process.env?.CHAOS_FREQUENCY));
	const status = Math.floor(Number(process.env?.CHAOS_STATUS));

	return {
		enabled: process.env?.CHAOS_ENABLED?.toUpperCase() === 'ON',
		frequency: frequency >= 1 ? frequency : defaultChaosFrequency,
		mode:
			process.env?.CHAOS_MODE?.toLowerCase() === 'random'
				? 'random'
				: 'every',
		status: status >= 400 && status <= 599 ? status : defaultChaosStatus,
	};
}

// Counts this call and says whether it is one that fails
export function shouldInjectError(): boolean {
	const { enabled, frequency, mode } = getChaosConfig();
	if (!enabled) return false;

	calls++;
	const fail =
		mode === 'random'
			? Math.random() < 1 / frequency
			: calls % frequency === 0;
	if (fail) injected++;

	return fail;
}

// Error body in the shape the mock error endpoint uses
export function buildChaosError(status: number): { error: string } {
	return { error: `${status}: omnimock chaos: simulated error` };
}

/**
 * Tells chaos which routes it can fail: the folders of src/api, as returned by
 * getApiRoutes. The dashboard and the list of endpoints are not
 * among them, so they always answer.
 */
export function setChaosRoutes(apiRoutes: string[]): void {
	targets = apiRoutes
		.filter((route) => !exemptRoutes.has(route))
		.map((route) => `/${prefix}${route}`);
}

// Whether a request URL is for one of those routes or something below it
export function isChaosTarget(url: string): boolean {
	const pathName = url.split('?')[0];

	return targets.some(
		(target) => pathName === target || pathName.startsWith(`${target}/`),
	);
}

/**
 * Answers some calls with an HTTP error in place of the route's own reply,
 * when chaos is on. Call it before the routes are added (a Fastify hook only
 * covers the routes that come after it), then setChaosRoutes once they are
 * known.
 */
export function registerChaos(app: FastifyInstance): void {
	app.addHook('onRequest', async (request, reply) => {
		if (!isChaosTarget(request.url) || !shouldInjectError()) return;

		const { status } = getChaosConfig();
		reply.header('x-omnimock-chaos', 'true');
		if (retryAfterStatuses.has(status)) reply.header('retry-after', '1');

		return reply.code(status).send(buildChaosError(status));
	});
}

export function getChaosStats(): { calls: number; injected: number } {
	return { calls, injected };
}

export function resetChaos(): void {
	calls = 0;
	injected = 0;
}
