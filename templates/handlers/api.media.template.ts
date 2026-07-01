import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/*  
    Can serve images from src/resources/images using this handler. 
    Make sure a folder called images exists in src/resources/ and that the images are in that folder
    Images accessed as http://localhost:8000/api/images/placeholder.png where placeholder.png is the name of the image
    Supports resizing with query parameters: ?width=500&height=500
*/

type ImageParams = {
	imageID: string;
};

type ImageQuery = {
	width?: string;
	height?: string;
};

function registerImageRoutes(app: FastifyInstance, pathName: string) {
	// List all images
	app.get(
		`/${pathName}`,
		async (_request: FastifyRequest, reply: FastifyReply) => {
			const images = fs.readdirSync('./src/resources/images');

			const html = `<style>a {color: lightblue; text-decoration: none} a:hover {text-decoration: underline}</style>
                <body style="background-color: #383838; color:white">
                <div style="text-align:center; padding:50px 0px 0px 0px">
                <h4>Access images stored in the src/resources/images folder using the format: <span style="color:pink">api/${pathName}/{filename}</span></h4>
				<h4>Get a full list of images as a json object at <a href="/api/${pathName}/list">/api/${pathName}/list</a></h4>
				<h4>Available image files:</h4>
				<div>${images.map((image) => `<p><a href="/api/${pathName}/${image}">${image}</a></p>`).join('')}</div>
                </div>
                </body>`;

			reply.header('Content-Type', 'text/html').header('Access-Control-Allow-Origin', '*').send(html);
		},
	);

	// Get image list as JSON
	app.get(
		`/${pathName}/list`,
		async (_request: FastifyRequest, reply: FastifyReply) => {
			const files = fs.readdirSync('./src/resources/images');
			reply.send({ mediaType: 'image', files });
		},
	);

	// Serve a specific image
	app.get(
		`/${pathName}/:imageID`,
		async (
			request: FastifyRequest<{ Params: ImageParams; Querystring: ImageQuery }>,
			reply: FastifyReply,
		) => {
			const { imageID } = request.params;

			console.log(`starting ${pathName}`);

			const imagePath = path.resolve(`./src/resources/images/${imageID}`);

			if (!fs.existsSync(imagePath)) {
				reply.code(404).send({ error: 'Image not found' });
				return;
			}

			const buffer = fs.readFileSync(imagePath);

			reply
				.header('Content-Type', 'image/png')
				.header('Access-Control-Allow-Origin', '*')
				.send(buffer);
		},
	);
}

export default registerImageRoutes;
