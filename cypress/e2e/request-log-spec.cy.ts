// The bikes endpoint calls the logger, and .env has LOG_REQUESTS=ON
describe('request log viewer', () => {
	const openLog = () => {
		cy.visit('/');
		cy.get('[cy-data="request_log_link"]').click();
		cy.get('[cy-data="viewer"]').should('be.visible');
	};

	beforeEach(() => {
		cy.request('DELETE', '/ui-request-log');
	});

	it('shows the logging settings', () => {
		cy.visit('/#/settings');
		cy.get('[cy-data="log_requests"]').contains('ON');
		cy.get('[cy-data="max_logged_requests"]').contains('10');
	});

	it('opens from the settings page too', () => {
		cy.visit('/#/settings');
		cy.get('[cy-data="request_log_link"]').click();
		cy.get('[cy-data="viewer"]').should('be.visible');
	});

	it('says so when nothing has been logged', () => {
		openLog();

		cy.get('[cy-data="viewer_text"]').contains(
			'No request has been logged yet',
		);
		cy.get('[cy-data="viewer_clear"]').should('not.exist');
	});

	it('shows a logged GET request', () => {
		cy.request('/api/bikes?type=ducati');
		openLog();

		cy.get('[cy-data="viewer_text"]')
			.should('contain', 'api/bikes')
			.and('contain', 'ducati')
			.and('contain', 'GET');
		cy.get('[cy-data="viewer_position"]').contains('1 of 1');
	});

	it('shows a logged POST request with its data', () => {
		cy.request('POST', '/api/bikes', {
			name: 'kawasaki ninja',
			type: 'kawasaki',
			year: 2023,
			color: 'red',
			price: 20000,
		});
		openLog();

		cy.get('[cy-data="viewer_text"]')
			.should('contain', 'api/bikes')
			.and('contain', 'kawasaki ninja')
			.and('contain', '2023')
			.and('contain', 'red')
			.and('contain', '20000')
			.and('contain', 'POST');
	});

	it('pages through the requests, newest first', () => {
		cy.request('/api/bikes?type=first');
		cy.request('/api/bikes?type=second');
		openLog();

		cy.get('[cy-data="viewer_position"]').contains('1 of 2');
		cy.get('[cy-data="viewer_text"]').should('contain', 'second');
		cy.get('[cy-data="viewer_back"]').should('be.disabled');

		cy.get('[cy-data="viewer_next"]').click();

		cy.get('[cy-data="viewer_position"]').contains('2 of 2');
		cy.get('[cy-data="viewer_text"]').should('contain', 'first');
		cy.get('[cy-data="viewer_next"]').should('be.disabled');
	});

	it('keeps only the last 10 requests', () => {
		for (let i = 1; i <= 12; i++) {
			cy.request(`/api/bikes?type=bike-${i}`);
		}

		cy.request('/ui-request-log').then((response) => {
			expect(response.body.log).to.have.length(10);
			expect(JSON.stringify(response.body.log[0])).to.contain('bike-12');
		});
	});

	it('clears the log after asking', () => {
		cy.request('/api/bikes?type=ducati');
		openLog();

		cy.get('[cy-data="viewer_clear"]').click();
		cy.get('[cy-data="viewer_clear_confirm"]').click();

		cy.get('[cy-data="viewer_text"]').contains(
			'No request has been logged yet',
		);
		cy.request('/ui-request-log').its('body.log').should('eq', null);
	});
});
