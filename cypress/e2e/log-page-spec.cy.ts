describe('logging works expected information', () => {
	it('log page works', () => {
		cy.visit('/logs');
		cy.get('h2').contains('API Requests Made');

		cy.get('h3').contains(
			'File can be viewed in /src/logs folder in container or local machine',
		);
		cy.get('h5').contains(
			"LOG_REQUESTS env var must be set to 'ON' to log requests",
		);
	});

	it('logging GET request works', () => {
		cy.request('/api/bikes?type=ducati');
		cy.visit('/logs');
		cy.get('.json-container').should('exist');
		cy.get('.json-container').contains('api/bikes');
		cy.get('.json-container').contains('ducati');
		cy.get('.json-container').contains('GET');
	});

	it('logging POST request works', () => {
		cy.request('POST', '/api/bikes', {
			name: 'kawasaki ninja',
			type: 'kawasaki',
			year: 2023,
			color: 'red',
			price: 20000,
		});
		cy.visit('/logs');
		cy.get('.json-container').should('exist');
		cy.get('.json-container').contains('api/bikes');
		cy.get('.json-container').contains('kawasaki ninja');
		cy.get('.json-container').contains('kawasaki');
		cy.get('.json-container').contains('2023');
		cy.get('.json-container').contains('red');
		cy.get('.json-container').contains('20000');
		cy.get('.json-container').contains('POST');
	});
});
