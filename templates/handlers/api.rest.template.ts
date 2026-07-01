// Copy and save as api.ts in the api path folder in your project
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../../src/models/db.js';
import logger from '../../src/utilities/logger.js';

// Example of REST handler with CRUD operations

type PostQuery = {
	userID?: string;
};

type PostParams = {
	postID: string;
};

type CreatePostBody = {
	id?: number;
	userId: number;
	title: string;
	body: string;
};

type UpdatePostBody = {
	title?: string;
	body?: string;
};
function registerPostRoutes(app: FastifyInstance, pathName: string) {
	// GET all posts
	app.get(
		`/${pathName}`,
		async (
			request: FastifyRequest<{ Querystring: PostQuery }>,
			reply: FastifyReply,
		) => {
			const { userID } = request.query;
			console.log(`starting ${pathName}`);

			const posts = userID
				? db.post.getAll().filter((p) => p.userId === Number(userID))
				: db.post.getAll();

			logger({
				data: { userID },
				pathName,
				type: 'GET',
			});

			reply.send(posts);
		},
	);

	// GET a single post by ID
	app.get(
		`/${pathName}/:postID`,
		async (
			request: FastifyRequest<{ Params: PostParams }>,
			reply: FastifyReply,
		) => {
			const { postID } = request.params;
			const post = db.post.findFirst({
				where: {
					id: {
						equals: Number(postID),
					},
				},
			});

			if (!post) {
				reply.code(404).send({ error: 'Post not found' });
				return;
			}

			reply.send(post);
		},
	);

	// POST a new post
	app.post(
		`/${pathName}`,
		async (
			request: FastifyRequest<{ Body: CreatePostBody }>,
			reply: FastifyReply,
		) => {
			const { id, userId, title, body } = request.body;

			logger({
				data: request.body,
				type: 'POST',
				pathName,
			});

			const created = db.post.create({
				id,
				userId,
				title,
				body,
			});
			reply.code(201).send(created);
		},
	);

	// PUT (update) a post
	app.put(
		`/${pathName}/:postID`,
		async (
			request: FastifyRequest<{ Params: PostParams; Body: UpdatePostBody }>,
			reply: FastifyReply,
		) => {
			const { postID } = request.params;
			const { title, body } = request.body ?? {};

			logger({
				data: request.body,
				type: 'PUT',
				pathName,
			});

			const updated = db.post.update({
				where: {
					id: {
						equals: Number(postID),
					},
				},
				data: {
					title,
					body,
				},
			});

			if (!updated) {
				reply.code(404).send({ error: 'Post not found' });
				return;
			}

			reply.send(updated);
		},
	);

	// DELETE a post
	app.delete(
		`/${pathName}/:postID`,
		async (
			request: FastifyRequest<{ Params: PostParams }>,
			reply: FastifyReply,
		) => {
			const { postID } = request.params;

			logger({
				data: { postID },
				type: 'DELETE',
				pathName,
			});

			const deleted = db.post.delete({
				where: {
					id: {
						equals: Number(postID),
					},
				},
			});

			if (!deleted) {
				reply.code(404).send({ error: 'Post not found' });
				return;
			}

			reply.send(deleted);
		},
	);
}

export default registerPostRoutes;
