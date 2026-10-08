import type { FastifyRequest } from 'fastify';
import { describe, expect, it } from 'vitest';
import { requestToApiGatewayProxyEvent } from '../../utilities/aws-apigw-convert.js';

const convert = (request: { body?: unknown; query?: unknown }) =>
	requestToApiGatewayProxyEvent(request as FastifyRequest);

describe('requestToApiGatewayProxyEvent', () => {
	it('passes the body on as a JSON string', async () => {
		const event = await convert({ body: { id: 1, title: 'a post' } });

		expect(event.body).toBe('{"id":1,"title":"a post"}');
	});

	it('gives an empty object for a request with no body', async () => {
		const event = await convert({});

		expect(event.body).toBe('{}');
		expect(event.queryStringParameters).toEqual({});
	});

	it('keeps the query parameters that are strings', async () => {
		const event = await convert({
			query: { type: 'ducati', tags: ['a', 'b'], page: '2' },
		});

		expect(event.queryStringParameters).toEqual({
			type: 'ducati',
			page: '2',
		});
	});

	it('rejects a body that cannot be turned into JSON', async () => {
		const body: Record<string, unknown> = {};
		body.self = body;

		await expect(convert({ body })).rejects.toThrow(
			'Invalid Payload : must contain a body property',
		);
	});
});
