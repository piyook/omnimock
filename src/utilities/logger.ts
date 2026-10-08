import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type LogData = {
	data: unknown;
	type?: string;
	pathName: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFolder = path.resolve(__dirname, '../logs');

// Holds the most recent logged requests, newest first
export const logPath = path.join(logFolder, 'api_request_log.json');

const defaultLogEntries = 10;
const logEntriesLimit = 100;

// How many requests the log keeps (older ones are dropped): the
// MAX_LOGGED_REQUESTS setting, capped at the limit. Anything that isn't a
// number of 1 or more falls back to the default.
export function maxLogEntries(): number {
	const setting = Math.floor(Number(process.env?.MAX_LOGGED_REQUESTS));
	if (!(setting >= 1)) return defaultLogEntries;
	return Math.min(setting, logEntriesLimit);
}

// The entries already in the log file, [] if it is missing or unreadable
function readLogEntries(): unknown[] {
	try {
		const entries: unknown = JSON.parse(fs.readFileSync(logPath, 'utf8'));
		return Array.isArray(entries) ? entries : [];
	} catch {
		return [];
	}
}

// Empties the log by removing its file; fine if there is none
export function clearLog() {
	fs.rmSync(logPath, { force: true });
}

/**
 * Logs an API request to the log file in the logs folder, where the dashboard
 * reads it from
 * @param {DefaultBodyType} LogData.data - data sent with the request as an object E.g {id: 101, userId: 1, title: 'title', body: 'body'}
 * @param {string} [LogData.type] - type of request (GET, POST, PUT, DELETE)
 * @param {string} [LogData.pathName] - path of the request
 */
function logger({
	data = { error: 'no data provided' },
	type = 'GET',
	pathName = 'no path provided',
}: LogData) {
	if (process.env?.LOG_REQUESTS?.toUpperCase() !== 'ON') return;
	console.log(
		`New API Request:${new Date().toLocaleString()}. Request data viewable in the dashboard at 'localhost:${process.env?.SERVER_PORT ?? '8000'}' or in the 'logs/ folder'`,
	);

	const logEntry = {
		request_information: {
			path: pathName,
			request_type: type,
			request_time: new Date().toLocaleString(),
		},
		sent_data: data,
	};

	const entries = [logEntry, ...readLogEntries()].slice(0, maxLogEntries());

	fs.mkdirSync(logFolder, { recursive: true });
	fs.writeFileSync(logPath, JSON.stringify(entries, null, 2));
}

export default logger;
