const postsSchema = {
	$schema: 'http://json-schema.org/draft-04/schema#',
	type: 'array',
	items: [
		{
			type: 'object',
			properties: {
				id: {
					type: 'integer',
				},
				userId: {
					type: 'integer',
				},
				title: {
					type: 'string',
				},
				body: {
					type: 'string',
				},
			},
			required: ['id', 'userId', 'title', 'body'],
		},
	],
};

const usersSchema = {
	$schema: 'http://json-schema.org/draft-04/schema#',
	type: 'array',
	items: [
		{
			type: 'object',
			properties: {
				id: {
					type: 'string',
				},
				userId: {
					type: 'string',
				},
				title: {
					type: 'string',
				},
				body: {
					type: 'string',
				},
			},
			required: ['id', 'userId', 'title', 'body'],
		},
	],
};

describe('Posts Server page contains expected information', () => {
	it('checks server is running and serving data', () => {
		cy.request('/api/posts').then((response) => {
			expect(response.status).to.eq(200);
			expect(response.body).length.to.be.greaterThan(0);
		});
	});

	it('should validate Posts against schema', () => {
		cy.request('GET', '/api/posts').then((response) => {
			expect(response.body).to.be.jsonSchema(postsSchema);
		});
	});
});

describe('Users Server page contains expected information', () => {
	it('checks server is running and serving data', () => {
		cy.request('/api/users').then((response) => {
			expect(response.status).to.eq(200);
			expect(response.body).length.to.be.greaterThan(0);
		});
	});

	it('should validate Users against schema', () => {
		cy.request('GET', '/api/users').then((response) => {
			expect(response.body).to.be.jsonSchema(usersSchema);
		});
	});
});
