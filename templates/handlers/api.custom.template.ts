// Custom handler with middleware
// Copy and save as api.ts in the api path folder in your project

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
// import { db } from '../../src/models/db.js'; // Uncomment this line if you have a db model to use
// import logger from '../../src/utilities/logger.js'; // Import your logger utility if needed

type CustomQuery = {
	type?: string;
};

function registerCustomRoutes(app: FastifyInstance, pathName: string) {
	// Add any http handler here (get, post, put, delete, etc.) with middleware as needed

	// GET handler
	app.get(
		`/${pathName}`,
		async (
			request: FastifyRequest<{ Querystring: CustomQuery }>,
			reply: FastifyReply,
		) => {
			console.log('GET request received:', request.url);
			// GET action code here

			// Get url parameters
			const { type } = request.query;

			// Get data from db using db.[modelName].getAll()
			// E.g const cats = db.cat.getAll();

			// if needed, Log the request passing the request data, pathName and request type to the logger function
			// logger({
			// 	data: { type },
			// 	pathName,
			// 	type: 'GET',
			// });

			// Middleware code here if needed
			reply.send({
				response: `this is a GET test response from ${pathName}`,
				type,
			});
		},
	);

	// POST handler
	app.post(
		`/${pathName}`,
		async (
			request: FastifyRequest<{ Body: unknown }>,
			reply: FastifyReply,
		) => {
			// POST action code here using db.[modelName].create({data})
			console.log('POST request received:', request.body);

			// if needed, Log the request
			// logger({
			// 	data: request.body,
			// 	pathName,
			// 	type: 'POST',
			// });

			reply.code(201).send({
				response: `this is a POST test response from ${pathName}`,
				body: request.body,
			});
		},
	);

	// PUT handler
	app.put(
		`/${pathName}`,
		async (
			request: FastifyRequest<{ Body: unknown }>,
			reply: FastifyReply,
		) => {
			console.log('PUT request received:', request.body);
			// PUT action code here using db.[modelName].update({data})

			// if needed, Log the request
			// logger({
			// 	data: request.body,
			// 	pathName,
			// 	type: 'PUT',
			// });

			reply.send({
				response: `this is a PUT test response from ${pathName}`,
				body: request.body,
			});
		},
	);

	// DELETE handler
	app.delete(
		`/${pathName}`,
		async (
			request: FastifyRequest<{ Body: unknown }>,
			reply: FastifyReply,
		) => {
			console.log('DELETE request received:', request.body);
			// DELETE action code here using db.[modelName].delete({data})

			// if needed, Log the request
			// logger({
			// 	data: request.body,
			// 	pathName,
			// 	type: 'DELETE',
			// });

			reply.send({
				response: `this is a DELETE test response from ${pathName}`,
			});
		},
	);
}

export default registerCustomRoutes;
