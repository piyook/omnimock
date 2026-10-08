import fs from 'node:fs';
import path from 'node:path';
import {
	invalidNameMessage,
	isSafeName,
	projectRoot,
	serverUrl,
	type ToolResult,
	urlPrefix,
} from './project.js';

const defaultApiDir = path.join(projectRoot, 'src', 'api');

const addApiEndpoint = async (
	name: string | undefined,
	description: string | undefined,
	code: string | undefined,
	apiDir = defaultApiDir,
): Promise<ToolResult> => {
	if (!name || !description || !code) {
		return {
			ok: false,
			message:
				'API Endpoint Not created. Name, description, and handler code are required to create a new API endpoint.',
		};
	}

	if (!isSafeName(name)) {
		return {
			ok: false,
			message: `API Endpoint Not created. ${invalidNameMessage(name)}`,
		};
	}

	// Create path to the endpoint directory
	const endpointDir = path.join(apiDir, name);
	const apiPath = path.join(endpointDir, `api.ts`); // or 'index.ts'

	if (fs.existsSync(apiPath)) {
		return {
			ok: false,
			message: `API Endpoint Not created. API endpoint ${name} already exists.`,
		};
	}

	// Create the endpoint directory first
	fs.mkdirSync(endpointDir, { recursive: true });
	// Then create the file inside the directory
	fs.writeFileSync(apiPath, code, 'utf8');
	return {
		ok: true,
		message: `API Endpoint ${name} created successfully at ${apiPath}. Rebuild the server to serve it at ${serverUrl}/${urlPrefix}${name}.`,
	};
};

export { addApiEndpoint };
