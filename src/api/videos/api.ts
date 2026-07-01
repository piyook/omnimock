import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

// Add any http handler here (get, push , delete etc., and middleware as needed)

type VideoParams = {
	videoID: string;
};

function registerVideoRoutes(app: FastifyInstance, pathName: string) {
	app.get(
		`/${pathName}`,
		async (_request: FastifyRequest, reply: FastifyReply) => {
			const videos = fs.readdirSync('./src/resources/videos');
			const html = `<style>a {color: lightblue; text-decoration: none} a:hover {text-decoration: underline}</style>
				<body style="background-color: #383838; color:white">
                <div style="text-align:center; padding:50px 0px 0px 0px">
                <h4>Access videos stored in the src/resources/videos folder using the format: <span style="color:pink">api/videos/{filename}</span></h4>
                <h4>Example: api/videos/placeholder.mp4</h4>
				<h4>Get a full list of videos as a json object at <a href="/api/videos/list">/videos/list</a> </h4>
				<h4>Available video files in src/resources/videos folder:</h4>
				<div>${videos.map((video) => `<a href="/api/videos/${video}">${video}</a></p>`).join('')}<div>
                </div>
                </body>
                `;

			reply
				.header('Content-Type', 'text/html')
				.header('Access-Control-Allow-Origin', '*')
				.send(html);
		},
	);

	app.get(
		`/${pathName}/list`,
		async (_request: FastifyRequest, reply: FastifyReply) => {
			const files = fs.readdirSync('./src/resources/videos');
			reply.send({ mediaType: 'video', files });
		},
	);

	app.get(
		`/${pathName}/:videoID`,
		async (
			request: FastifyRequest<{ Params: VideoParams }>,
			reply: FastifyReply,
		) => {
			const { videoID } = request.params;

			console.log(`starting ${pathName}`);

			try {
				const buffer = fs.readFileSync(
					path.resolve(`./src/resources/videos/${videoID}`),
				);

				reply
					.header('Content-Type', 'video/mp4')
					.header('Access-Control-Allow-Origin', '*')
					.send(buffer);
			} catch {
				reply
					.code(404)
					.header('Content-Type', 'text/html')
					.header('Access-Control-Allow-Origin', '*')
					.send(
						'Error: File not found. Check file is in the src/resources/videos folder',
					);
			}
		},
	);
}

export default registerVideoRoutes;
