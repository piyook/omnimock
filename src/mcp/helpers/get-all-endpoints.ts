// The paths of the mock server's endpoints, as the JSON list it serves at /api
const getApiEndpoints = async (port: number) => {
	let response: Response;
	try {
		response = await fetch(`http://localhost:${port}/api`);
		if (!response.ok) {
			return 'Local mock API server is not running - please start the server first.';
		}
	} catch {
		return 'Local mock API server is not running - please start the server first.';
	}
	return response.text();
};

export { getApiEndpoints };
