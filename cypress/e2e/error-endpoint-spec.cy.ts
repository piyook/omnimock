describe('default mock error endpoint works as expected', () => {
	it('checks default error endpoint is running', () => {
		cy.request({ url: '/api/error', failOnStatusCode: false }).then(
			(response) => {
				expect(response.status).to.eq(404);
				expect(response.body).to.be.jsonSchema({
					error: '404: Not Found',
				});
			},
		);
	});

	it('checks default error endpoint is running', () => {
		cy.request({
			url: '/api/error?status=500&message=Internal%20Server%20Error',
			failOnStatusCode: false,
		}).then((response) => {
			expect(response.status).to.eq(500);
			expect(response.body).to.be.jsonSchema({
				error: '500: Internal Server Error',
			});
		});
	});
});
