import { serverUrl, type ToolResult } from './project.js';

const notRunning: ToolResult = {
	ok: false,
	message:
		'Local mock API server is not running - please start the server first.',
};

// The paths of the mock server's endpoints, as the JSON list it serves at /api
const getApiEndpoints = async (): Promise<ToolResult> => {
	try {
		const response = await fetch(`${serverUrl}/api`);
		if (!response.ok) {
			return notRunning;
		}
		return { ok: true, message: await response.text() };
	} catch {
		return notRunning;
	}
};

export { getApiEndpoints };
