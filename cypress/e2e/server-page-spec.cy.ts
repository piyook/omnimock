describe('Server page contains expected information', () => {
	it('passes', () => {
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
		cy.get('[cy-data="server_version"]').contains('Version:');
		cy.get('[cy-data="server_status"]').contains('Running');

		cy.get('[cy-data="server_address"]').contains('Server Address');
		cy.get('[cy-data="server_port"]').contains('Server Port');
		cy.get('[cy-data="server_prefix"]').contains('Server URL Prefix');
		cy.get('[cy-data="server_label"]').contains('API endpoints*');

		cy.get('[cy-data="server_address"]').contains('localhost');
		cy.get('[cy-data="server_port"]').contains('8000');
		cy.get('[cy-data="url_prefix"]').contains('api');

		const endpoints = cy.get('[cy-data="endpoint"]');

		endpoints.should('have.length', expectedEndpoints.length);

		endpoints.each((endpoint) => {
			expect(expectedEndpoints).to.include(endpoint.text());
		});
	});
});
