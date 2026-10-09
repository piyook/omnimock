export type UiMeta = {
	version: string | null;
	projectName: string;
	serverPort: number | null;
	urlPrefix: string;
	apiLinks: Array<{ href: string; label: string }>;
	logRequests: 'ON' | 'OFF';
	maxLoggedRequests: number;
	dbPersist: 'ON' | 'OFF';
	chaosStatus: 'ENABLED' | 'DISABLED';
	chaosFrequency: number;
	chaosMode: 'every' | 'random';
	chaosErrorStatus: number;
	chaosInjected: number;
	uiTheme: 'dark' | 'light';
};

export type RequestLog = {
	file: string;
	log: unknown;
};

// The viewer routes answer failures with `{ error }` explaining what went
// wrong, which is more use to the reader than the status code.
async function fetchViewerJson<T>(url: string, method = 'GET'): Promise<T> {
	const res = await fetch(url, { method });
	const body = await res.json().catch(() => null);
	if (!res.ok) {
		throw new Error(body?.error ?? `${url} failed: ${res.status}`);
	}
	return body as T;
}

export function fetchRequestLog(): Promise<RequestLog> {
	return fetchViewerJson('/ui-request-log');
}

export function clearRequestLog(): Promise<RequestLog> {
	return fetchViewerJson('/ui-request-log', 'DELETE');
}

export async function fetchPing(): Promise<boolean> {
	const res = await fetch('/ping');
	return res.ok;
}

export async function fetchUiMeta(): Promise<UiMeta> {
	const res = await fetch('/ui-meta');
	if (!res.ok) {
		throw new Error(`ui-meta failed: ${res.status}`);
	}
	return (await res.json()) as UiMeta;
}
