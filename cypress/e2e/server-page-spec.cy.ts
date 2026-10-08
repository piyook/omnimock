describe('Dashboard contains expected information', () => {
	it('shows the server settings and every endpoint', () => {
		const expectedEndpoints = [
			'/api/bikes',
			'/api/cats',
			'/api/images',
			'/api/json',
			'/api/lambda',
			'/api/markdown',
			'/api/posts',
			'/api/users',
			'/api/videos',
			'/api/error',
		];
		cy.visit('/');
		cy.get('[cy-data="server_version"]').contains(/^\s*v\d+\.\d+\.\d+\s*$/);
		cy.get('[cy-data="server_status"]').contains('Running');

		cy.get('[cy-data="server"]').contains('Server Address');
		cy.get('[cy-data="server"]').contains('Server Port');
		cy.get('[cy-data="server"]').contains('Server URL Prefix');
		cy.get('[cy-data="endpoints"]').contains('API endpoints');

		cy.get('[cy-data="server_address"]').contains('localhost');
		cy.get('[cy-data="server_port"]').contains('8000');
		cy.get('[cy-data="url_prefix"]').contains('api');
		cy.get('[cy-data="project_name"]').contains('mock-api-framework');

		cy.get('[cy-data="endpoint_count"]').contains(
			`${expectedEndpoints.length} endpoints`,
		);
		const endpoints = cy.get('[cy-data="endpoint"]');

		endpoints.should('have.length', expectedEndpoints.length);

		endpoints.each((endpoint) => {
			expect(expectedEndpoints).to.include(endpoint.text());
		});
	});

	it('shows chaos as off', () => {
		cy.visit('/');
		cy.get('[cy-data="chaos_status"]').contains('DISABLED');
		cy.get('[cy-data="chaos_frequency"]').should('not.exist');
	});

	it('uses the dark theme', () => {
		cy.visit('/');
		cy.get('html').should('have.attr', 'data-theme', 'dark');
	});

	it('answers the status check', () => {
		cy.request('/ping')
			.its('body')
			.should('deep.eq', { response: 'server is running' });
	});
});
