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
		cy.visit('/#/settings');
		cy.get('[cy-data="server_version"]').contains(/^\s*v\d+\.\d+\.\d+\s*$/);
		cy.get('[cy-data="server_status"]').contains('Running');

		cy.get('[cy-data="server"]').contains('Server Address');
		cy.get('[cy-data="server"]').contains('Server Port');
		cy.get('[cy-data="server"]').contains('Server URL Prefix');

		cy.get('[cy-data="server_address"]').contains('localhost');
		cy.get('[cy-data="server_port"]').contains('8000');
		cy.get('[cy-data="url_prefix"]').contains('api');
		cy.get('[cy-data="project_name"]').contains('mock-api-framework');

		cy.get('[cy-data="nav_endpoints"]').click();
		cy.get('[cy-data="endpoints"]').contains('API endpoints');
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
		cy.visit('/#/settings');
		cy.get('[cy-data="chaos_status"]').contains('DISABLED');
		cy.get('[cy-data="chaos_frequency"]').should('not.exist');
	});

	it('opens on the overview', () => {
		cy.visit('/');
		cy.get('h1').contains('Overview');
		cy.get('[cy-data="nav_overview"]').should(
			'have.attr',
			'aria-current',
			'page',
		);
		cy.get('[cy-data="tile_endpoints"]').contains('10');
		cy.get('[cy-data="tile_chaos"]').contains('Off');
		cy.get('[cy-data="tile_request_log"]').contains('On');
		cy.get('[cy-data="base_url"]').contains('http://localhost:8000/api');
		cy.get('[cy-data="feature"]').should('have.length', 4);
		cy.get('[cy-data="server_facts"]').contains('8000');
	});

	it('moves between the pages from the sidebar and the tiles', () => {
		cy.visit('/');

		cy.get('[cy-data="nav_settings"]').click();
		cy.location('hash').should('eq', '#/settings');
		cy.get('h1').contains('Settings');
		cy.get('[cy-data="server"]').should('exist');
		cy.get('[cy-data="tile_endpoints"]').should('not.exist');

		cy.get('[cy-data="nav_overview"]').click();
		cy.get('[cy-data="tile_endpoints"]').click();
		cy.location('hash').should('eq', '#/endpoints');
		cy.get('h1').contains('Endpoints');
		cy.get('[cy-data="nav_endpoints"]').should(
			'have.attr',
			'aria-current',
			'page',
		);
	});

	it('shows the overview for a hash that names no page', () => {
		cy.visit('/#/nowhere');
		cy.get('h1').contains('Overview');
	});

	it('uses the dark theme', () => {
		cy.visit('/');
		cy.get('html').should('have.attr', 'data-theme', 'dark');
		cy.get('[cy-data="theme_switch"]').should(
			'have.attr',
			'aria-checked',
			'true',
		);
	});

	it('switches to the light theme and keeps it over UI_THEME', () => {
		cy.visit('/');
		cy.get('[cy-data="theme_switch"]').click();
		cy.get('html').should('have.attr', 'data-theme', 'light');
		cy.get('[cy-data="theme_switch"]').should(
			'have.attr',
			'aria-checked',
			'false',
		);

		// The server still names dark on the page it serves
		cy.reload();
		cy.get('[cy-data="server_status"]').contains('Running');
		cy.get('html').should('have.attr', 'data-theme', 'light');

		cy.get('[cy-data="theme_switch"]').click();
		cy.get('html').should('have.attr', 'data-theme', 'dark');
	});

	it('answers the status check', () => {
		cy.request('/ping')
			.its('body')
			.should('deep.eq', { response: 'server is running' });
	});
});
