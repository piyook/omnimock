const jsonSchema = {
	$schema: 'http://json-schema.org/draft-04/schema#',
	type: 'array',
	items: [
		{
			type: 'object',
			properties: {
				metaData: {
					type: 'object',
					properties: {
						docHeader: {
							type: 'string',
						},
						docSubHeader: {
							type: 'string',
						},
						docNumber: {
							type: 'string',
						},
					},
					required: ['docHeader', 'docSubHeader', 'docNumber'],
				},
				sections: {
					type: 'array',
					items: [
						{
							type: 'object',
							properties: {
								sectionNumber: {
									type: 'integer',
								},
								sectionTitle: {
									type: 'string',
								},
								sectionContent: {
									type: 'string',
								},
								sectionImages: {
									type: 'array',
									items: [
										{
											type: 'object',
											properties: {
												imageUrl: {
													type: 'string',
												},
												imageDescription: {
													type: 'string',
												},
											},
											required: [
												'imageUrl',
												'imageDescription',
											],
										},
										{
											type: 'object',
											properties: {
												imageUrl: {
													type: 'string',
												},
												imageDescription: {
													type: 'string',
												},
											},
											required: [
												'imageUrl',
												'imageDescription',
											],
										},
										{
											type: 'object',
											properties: {
												imageUrl: {
													type: 'string',
												},
												imageDescription: {
													type: 'string',
												},
											},
											required: [
												'imageUrl',
												'imageDescription',
											],
										},
										{
											type: 'object',
											properties: {
												imageUrl: {
													type: 'string',
												},
												imageDescription: {
													type: 'string',
												},
											},
											required: [
												'imageUrl',
												'imageDescription',
											],
										},
									],
								},
							},
							required: [
								'sectionNumber',
								'sectionTitle',
								'sectionContent',
								'sectionImages',
							],
						},
						{
							type: 'object',
							properties: {
								sectionNumber: {
									type: 'integer',
								},
								sectionTitle: {
									type: 'string',
								},
								sectionContent: {
									type: 'string',
								},
								sectionImages: {
									type: 'array',
									items: {},
								},
							},
							required: [
								'sectionNumber',
								'sectionTitle',
								'sectionContent',
								'sectionImages',
							],
						},
						{
							type: 'object',
							properties: {
								sectionNumber: {
									type: 'integer',
								},
								sectionTitle: {
									type: 'string',
								},
								sectionContent: {
									type: 'string',
								},
								sectionImages: {
									type: 'array',
									items: [
										{
											type: 'object',
											properties: {
												imageUrl: {
													type: 'string',
												},
												imageDescription: {
													type: 'string',
												},
											},
											required: [
												'imageUrl',
												'imageDescription',
											],
										},
										{
											type: 'object',
											properties: {
												imageUrl: {
													type: 'string',
												},
												imageDescription: {
													type: 'string',
												},
											},
											required: [
												'imageUrl',
												'imageDescription',
											],
										},
									],
								},
							},
							required: [
								'sectionNumber',
								'sectionTitle',
								'sectionContent',
								'sectionImages',
							],
						},
					],
				},
			},
			required: ['metaData', 'sections'],
		},
	],
};

describe('JSON Server page contains expected information', () => {
	it('checks server is running and serving data', () => {
		cy.request('/api/json/demo').then((response) => {
			expect(response.status).to.eq(200);
			expect(response.body).length.to.be.greaterThan(0);
		});
	});

	it('should validate JSON against schema', () => {
		cy.request('GET', '/api/json/demo').then((response) => {
			expect(response.body).to.be.jsonSchema(jsonSchema);
		});
	});
});
