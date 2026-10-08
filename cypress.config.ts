import { defineConfig } from 'cypress';

// The specs in cypress/e2e/chaos need a server started with chaos on, so they
// only run when the e2e runner asks for them (scripts/run-e2e.mjs).
const chaos = process.env.E2E_SUITE === 'chaos';

export default defineConfig({
	e2e: {
		baseUrl: 'http://localhost:8000',
		specPattern: chaos
			? 'cypress/e2e/chaos/*.cy.ts'
			: 'cypress/e2e/*.cy.ts',
	},
});
