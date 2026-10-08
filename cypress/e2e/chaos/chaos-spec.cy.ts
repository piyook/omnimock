// Runs against a server started with chaos on, failing every 2nd call with a
// 503 (the `chaos` suite in scripts/run-e2e.mjs). The tests share the server's
// call counter, so each one sends an even number of calls to the mock
// endpoints and leaves the next call as one that succeeds.
describe('chaos mode', () => {
	const get = (url: string) => cy.request({ url, failOnStatusCode: false });

	it('reports the chaos settings to the dashboard', () => {
		cy.request('/ui-meta').its('body').should('include', {
			chaosStatus: 'ENABLED',
			chaosFrequency: 2,
			chaosMode: 'every',
			chaosErrorStatus: 503,
		});

		cy.visit('/');
		cy.get('[cy-data="chaos_status"]').contains('ENABLED');
		cy.get('[cy-data="chaos_frequency"]').contains('Every 2 calls');
		cy.get('[cy-data="chaos_error_status"]').contains('503');
	});

	it('fails every 2nd call with the configured error', () => {
		get('/api/bikes').then((response) => {
			expect(response.status).to.eq(200);
			expect(response.headers).not.to.have.property('x-omnimock-chaos');
		});

		get('/api/bikes').then((response) => {
			expect(response.status).to.eq(503);
			expect(response.body).to.deep.eq({
				error: '503: omnimock chaos: simulated error',
			});
			expect(response.headers['x-omnimock-chaos']).to.eq('true');
			expect(response.headers['retry-after']).to.eq('1');
		});
	});

	it('counts calls across endpoints and methods', () => {
		get('/api/cats').its('status').should('eq', 200);

		cy.request({
			method: 'POST',
			url: '/api/bikes',
			body: { name: 'kawasaki ninja' },
			failOnStatusCode: false,
		})
			.its('status')
			.should('eq', 503);
	});

	it('never fails the dashboard, the endpoint list or the error endpoint', () => {
		for (let i = 0; i < 3; i++) {
			get('/').its('status').should('eq', 200);
			get('/api').its('status').should('eq', 200);
			get('/api/error?status=404').then((response) => {
				expect(response.status).to.eq(404);
				expect(response.headers).not.to.have.property(
					'x-omnimock-chaos',
				);
			});
		}

		// Those calls were not counted, so this is still an odd-numbered call
		get('/api/bikes').its('status').should('eq', 200);
		get('/api/bikes').its('status').should('eq', 503);
	});

	it('counts the errors it has injected', () => {
		cy.request('/ui-meta').its('body.chaosInjected').should('eq', 3);
	});
});
