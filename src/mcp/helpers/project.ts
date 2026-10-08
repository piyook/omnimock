import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The project root, where .env, package.json and docker-compose.yml are
const projectRoot = path.join(__dirname, '..', '..', '..');

// An agent can start this server from any folder, so .env is found by path.
// quiet: anything dotenv printed would go to stdout, which carries the MCP messages.
dotenv.config({ path: path.join(projectRoot, '.env'), quiet: true });

const port = Number(process.env.SERVER_PORT) || 8000;
const serverUrl = `http://localhost:${port}`;
const urlPrefix = process.env.USE_API_URL_PREFIX
	? `${process.env.USE_API_URL_PREFIX}/`
	: '';

const { version } = JSON.parse(
	fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'),
) as { version: string };

// What a helper hands back to its tool: the text for the agent, and whether it worked
type ToolResult = { ok: boolean; message: string };

// A name becomes a folder or file name, so no slashes, dots or spaces
const isSafeName = (name: string) => /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(name);

const invalidNameMessage = (name: string) =>
	`"${name}" is not a valid name. Use letters, numbers, hyphens and underscores only.`;

export {
	invalidNameMessage,
	isSafeName,
	port,
	projectRoot,
	serverUrl,
	type ToolResult,
	urlPrefix,
	version,
};
