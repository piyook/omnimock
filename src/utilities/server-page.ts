import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import { getChaosConfig, getChaosStats } from './chaos.js';
import { env, prefix } from './env.js';
import { clearLog, logPath, maxLogEntries } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiDistDir = path.resolve(__dirname, '../../ui/dist');

// Version of the package this server is running from, null if its
// package.json can't be read.
function readPackageVersion(): string | null {
	try {
		const packageJson = JSON.parse(
			fs.readFileSync(
				path.resolve(__dirname, '../../package.json'),
				'utf8',
			),
		) as { version?: unknown };
		return typeof packageJson.version === 'string'
			? packageJson.version
			: null;
	} catch {
		return null;
	}
}

const version = readPackageVersion();

const contentTypes: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.map': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.ico': 'image/x-icon',
};

function contentTypeForPath(filePath: string): string {
	return (
		contentTypes[path.extname(filePath).toLowerCase()] ??
		'application/octet-stream'
	);
}

// A file of the built dashboard, null if there is none at that path or the
// path leads out of ui/dist
function tryReadUiDistFile(
	relativePath: string,
): { absPath: string; data: Buffer } | null {
	const absPath = path.resolve(uiDistDir, relativePath.replace(/^\/+/, ''));
	const rel = path.relative(uiDistDir, absPath);
	if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
	if (!fs.existsSync(absPath)) return null;
	if (!fs.statSync(absPath).isFile()) return null;
	return { absPath, data: fs.readFileSync(absPath) };
}

const fallbackHtmlString = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OmniMock Dashboard</title>
        <style>
            html, body {
                margin: 0;
                padding: 0;
                min-height: 100vh;
                color: #F9F9F9;
                font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
                background: linear-gradient(120deg, #20232a 0%, #23272F 70%, #0d1117 100%);
            }
            main {
                padding: 56px 3vw 40px 3vw;
                max-width: 800px;
                margin: 48px auto 32px auto;
                text-align: center;
            }
            h1 {
                font-size: 2.4rem;
                font-weight: 700;
                letter-spacing: 1px;
            }
            .highlight {
                background: rgb(144, 33, 2);
                padding: 4px 10px;
                border-radius: 6px;
                font-size: 1rem;
            }
        </style>
    </head>
    <body>
        <main>
            <h1>OmniMock</h1>
            <h1 class="highlight">ERROR: Please build dashboard UI - use 'npm run compile-ui'</h1>
        </main>
    </body>
    </html>
    `;

function serverPage(app: FastifyInstance, apiPaths: string[]) {
	// What the compiled Svelte dashboard shows
	app.get('/ui-meta', async (_request, reply) => {
		const chaos = getChaosConfig();

		return reply.send({
			version,
			projectName: env.PROJECT_NAME,
			serverPort: Number(env.SERVER_PORT) || null,
			urlPrefix: env.USE_API_URL_PREFIX,
			apiLinks: apiPaths.map((apiPath) => {
				const href = `/${prefix}${apiPath}`;
				return { href, label: href };
			}),
			logRequests:
				process.env?.LOG_REQUESTS?.toUpperCase() === 'ON'
					? 'ON'
					: 'OFF',
			maxLoggedRequests: maxLogEntries(),
			dbPersist:
				process.env?.MOCK_DB_PERSIST?.toUpperCase() === 'ON'
					? 'ON'
					: 'OFF',
			chaosStatus: chaos.enabled ? 'ENABLED' : 'DISABLED',
			chaosFrequency: chaos.frequency,
			chaosMode: chaos.mode,
			chaosErrorStatus: chaos.status,
			chaosInjected: getChaosStats().injected,
		});
	});

	// The most recent logged requests, newest first, for the dashboard
	// viewer. `log` is null when no request has been logged yet.
	app.get('/ui-request-log', async (_request, reply) => {
		let log: unknown = null;
		try {
			log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
			// A log written under a higher limit is only trimmed on the
			// next request
			if (Array.isArray(log)) log = log.slice(0, maxLogEntries());
		} catch {
			// No log file yet, or one that is mid-write
		}

		return reply.send({ file: logPath, log });
	});

	// Empties the request log, for the dashboard's "Clear logs" button
	app.delete('/ui-request-log', async (_request, reply) => {
		try {
			clearLog();
		} catch (error) {
			return reply.code(500).send({ error: (error as Error).message });
		}

		return reply.send({ file: logPath, log: null });
	});

	// Home page route
	app.get('/', async (_request, reply) => {
		const uiIndex = tryReadUiDistFile('index.html');
		if (uiIndex) {
			return reply
				.type(contentTypeForPath(uiIndex.absPath))
				.send(uiIndex.data);
		}
		return reply.type('text/html').send(fallbackHtmlString);
	});

	// Ping endpoint for status check
	app.get('/ping', async (_request, reply) => {
		return reply.send({ response: 'server is running' });
	});

	// Serve built Vite assets when present
	app.get('/assets/*', async (request, reply) => {
		const star =
			(request.params as Record<string, string> | undefined)?.['*'] ?? '';
		const file = tryReadUiDistFile(path.join('assets', star));
		if (!file) return reply.code(404).send();
		return reply.type(contentTypeForPath(file.absPath)).send(file.data);
	});

	// Serve any built root-level file (favicon, manifest, etc.)
	app.get('/:file', async (request, reply) => {
		const fileName = (request.params as { file: string }).file;
		if (!fileName.includes('.')) return reply.code(404).send();
		const file = tryReadUiDistFile(fileName);
		if (!file) return reply.code(404).send();
		return reply.type(contentTypeForPath(file.absPath)).send(file.data);
	});
}

export default serverPage;
