import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { apiHandlerExample } from './data/api-handler-example.js';
import { addApiEndpoint } from './helpers/add-api-endpoint.js';
import { addMediaEndpoint } from './helpers/add-media-endpoint.js';
import { manageServer } from './helpers/control-mock-server.js';
import { getApiEndpoints } from './helpers/get-all-endpoints.js';
import {
	serverUrl,
	type ToolResult,
	urlPrefix,
	version,
} from './helpers/project.js';

// The port and the url prefix come from SERVER_PORT and USE_API_URL_PREFIX in .env

// Nothing here may write to stdout (console.log): it carries the MCP messages.
// Use console.error for anything the person running the server should see.

// Create server instance
const server = new McpServer({
	name: 'MCP Local Mock API Server',
	version,
});

// A failure is flagged, so the agent can tell it from a result
const reply = ({ ok, message }: ToolResult) => ({
	content: [{ type: 'text' as const, text: message }],
	isError: !ok,
});

server.tool(
	'create_new_api_endpoint',
	`create new api endpoint for the local mock API server using the supplied standard code format as a basis for the new api code.
	The server runs in Docker and needs to be rebuilt (manage_local_mock_api_server, action rebuild) before it serves the new endpoint.
	Args:
	- action: get_code_format (gets standard code format) or add_endpoint(creates new api endpoint using supplied code)
	- name: Name of the API endpoint, used as its url path: letters, numbers, hyphens and underscores only (only required for add_endpoint action)
	- description: Description of the API endpoint (only required for add_endpoint action)
	- code: Code for the API endpoint (should be a valid TypeScript file content following the format described in the get_code_format request )`,
	{
		action: z.enum(['add_endpoint', 'get_code_format']),
		name: z.string().min(1, 'Name is required').optional(),
		description: z.string().min(1, 'Description is required').optional(),
		code: z.string().min(1, 'Code is required').optional(),
	},
	async (input) => {
		const { action, name, description, code } = input;

		if (action === 'get_code_format') {
			// Return the format for API endpoint code generation
			return reply({
				ok: true,
				message: `API endpoint code needs to follow the format in the example below:
								${apiHandlerExample()}
								This is a TypeScript file whose default export is a function taking the Fastify app and the endpoint's path name, and registering the endpoint's routes on the app.
								It is saved as src/api/{name}/api.ts, so keep the relative import paths as they are in the example.
								A file that fails to load stops the whole mock server from starting.
								Create new API endpoint code using a similar pattern.`,
			});
		}

		// add_endpoint: the helper refuses a missing name, description or code
		return reply(await addApiEndpoint(name, description, code));
	},
);

server.tool(
	'manage_local_mock_api_server',
	`Manage the local mock server on localhost running in Docker (Docker must be installed and running).
	Args:
	action: one of the following actions:
		get (gets all available api endpoints),
		start (starts server),
		stop (stops server),
		rebuild (rebuild server to register new code changes - this can take a few minutes)
		`,
	{
		action: z.enum(['get', 'start', 'stop', 'rebuild']),
	},
	async (input) => {
		const { action } = input;

		if (action === 'get') {
			return reply(await getApiEndpoints());
		}

		return reply(await manageServer(action));
	},
);

server.tool(
	'create_new_media_endpoint',
	`create new media api endpoint for the local mock API server by passing a base64 encoded string of an image or video, a path to a locally saved file or a url containing the media. Once saved to the local system this media can be then be accessed from the endpoint at
	${serverUrl}/${urlPrefix}{images|videos}/mediaName.fileType.
	A list of ALL media files in a folder can be obtained from ${serverUrl}/${urlPrefix}{images|videos}/list.
	Images and videos should be 1000px x 1000px.
	If running in docker the server will need to be rebuilt to see the new media.
	Args:
	- mediaName: file name for the media endpoint, without the file type: letters, numbers, hyphens and underscores only
	- type: type of media (images or videos)
	- fileType: type of file (png for images or mp4 for videos)
	- image: This can be a base64 string, data URL, file path, or URL
`,
	{
		mediaName: z.string().min(1, 'Media FileName is required'),
		type: z.enum(['images', 'videos']),
		fileType: z.enum(['png', 'mp4']),
		image: z.string(),
	},
	async (input) => {
		return reply(
			await addMediaEndpoint(
				input.mediaName,
				input.type,
				input.fileType,
				input.image,
			),
		);
	},
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error('Local Mock API MCP Server running on stdio');
}
main().catch((error) => {
	console.error('Fatal error in main():', error);
	process.exit(1);
});
