import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import sharp from 'sharp';

// Add any http handler here (get, push , delete etc., and middleware as needed)

type ImageParams = {
	imageID: string;
};

type ImageQuery = {
	width?: string;
	height?: string;
};

function registerImageRoutes(app: FastifyInstance, pathName: string) {
	app.get(
		`/${pathName}`,
		async (_request: FastifyRequest, reply: FastifyReply) => {
			const images = fs.readdirSync('./src/resources/images');
			const html = `<style>a {color: lightblue; text-decoration: none} a:hover {text-decoration: underline}</style>
				<body style="background-color: #383838; color:white">
                <div style="text-align:center; padding:50px 0px 0px 0px">
                <h4>Access images stored in the src/resources/images folder using the format: <span style="color:pink">api/images/{filename}</span></h4>
				<h4>Resize images by adding url paramters E.g placeholder.png?height=500&width=500</h4>
				
				<h4>Get a full list of images as a json object at <a href="/api/images/list">/images/list</a> </h4>
				<h4>Available image files in src/resources/images folder:</h4>
				<div>${images.map((image) => `<p><a href="/api/images/${image}" >${image}</a></p>`).join('')}<div>
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
			const files = fs.readdirSync('./src/resources/images');
			reply.send({ mediaType: 'image', files });
		},
	);

	app.get(
		`/${pathName}/:imageID`,
		async (
			request: FastifyRequest<{
				Params: ImageParams;
				Querystring: ImageQuery;
			}>,
			reply: FastifyReply,
		) => {
			const { width, height } = request.query;
			const { imageID } = request.params;

			console.log(`height ${height} and width ${width}`);
			console.log(`starting ${pathName}`);

			try {
				// Convert width and height to integers, if provided
				const resizeOptions: Record<string, number> = {};
				if (width && height)
					resizeOptions.width = Number.parseInt(width, 10);
				if (height && width)
					resizeOptions.height = Number.parseInt(height, 10);

				const inputBuffer = fs.readFileSync(
					path.resolve(`./src/resources/images/${imageID}`),
				);
				const resizedImageBuffer = await sharp(inputBuffer)
					.resize(resizeOptions) // Only applies resize if width/height are present
					.png()
					.toBuffer();

				reply
					.header('Content-Type', 'image/png')
					.header('Access-Control-Allow-Origin', '*')
					.send(resizedImageBuffer);
			} catch {
				reply
					.code(404)
					.header('Content-Type', 'text/html')
					.header('Access-Control-Allow-Origin', '*')
					.send(
						'Error: File not found. Check file is in the src/resources/images folder',
					);
			}
		},
	);
}

export default registerImageRoutes;
