import fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { apiList } from '../../utilities/api-list.js';

describe('apiList', () => {
	it('lists each route with the prefix', async () => {
		const app = fastify();
		apiList(app, ['bikes', 'cats']);

		const response = await app.inject({ method: 'GET', url: '/api' });

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(['/api/bikes', '/api/cats']);
	});
});
