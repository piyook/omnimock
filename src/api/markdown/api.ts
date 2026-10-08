import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import hljs from 'highlight.js';
import markdownit from 'markdown-it';

// Add any http handler here (get, push , delete etc., and middleware as needed)

type MarkdownParams = {
	mdID: string;
};

function registerMarkdownRoutes(app: FastifyInstance, pathName: string) {
	const md = markdownit({
		html: false,
		highlight(str, lang) {
			if (lang && hljs.getLanguage(lang)) {
				try {
					return (
						'<pre><code class="hljs">' +
						hljs.highlight(str, {
							language: lang,
							ignoreIllegals: true,
						}).value +
						'</code></pre>'
					);
				} catch {}
			}

			return ''; // Use external default escaping
		},
	}).disable(['link', 'image']);

	app.get(
		`/${pathName}`,
		async (_request: FastifyRequest, reply: FastifyReply) => {
			const html = `<body style="background-color: #383838; color:white">
                <div style="text-align:center; padding:50px 0px 0px 0px">
                <h4>Access markdown files stored in the src/resources/markdown folder using the format: <span style="color:red">api/markdown/{filename}</span></h4>
                <h4>Example: api/markdown/demo</h4>
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
		`/${pathName}/:mdID`,
		async (
			request: FastifyRequest<{ Params: MarkdownParams }>,
			reply: FastifyReply,
		) => {
			const { mdID } = request.params;

			console.log(`starting ${pathName}`);

			try {
				const buffer = fs.readFileSync(
					path.resolve(`./src/resources/markdown/${mdID}.md`),
				);
				const result = ` <html>
            <head>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
            </head>
            <body>
            ${md.render(buffer.toString())}
            </body>
            </html>`;

				reply
					.code(200)
					.header('Content-Type', 'text/html')
					.header('Access-Control-Allow-Origin', '*')
					.send(result);
			} catch {
				reply
					.code(404)
					.header('Content-Type', 'text/html')
					.header('Access-Control-Allow-Origin', '*')
					.send(
						'Error: File not found. Check file is in the src/resources/markdown folder',
					);
			}
		},
	);
}

export default registerMarkdownRoutes;
