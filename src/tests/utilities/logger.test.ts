import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import logger, {
	clearLog,
	logPath,
	maxLogEntries,
} from '../../utilities/logger.js';

// The log file is never touched: the fs calls the logger makes read and write
// `stored` instead (null while there is no file)
let stored: string | null = null;

const entries = () => JSON.parse(stored ?? '[]');

// The ids of the logged requests' data, in the order they are stored
const ids = () =>
	entries().map((entry: { sent_data: { id: number } }) => entry.sent_data.id);

beforeEach(() => {
	stored = null;
	vi.spyOn(console, 'log').mockImplementation(() => {});
	vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
	vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
		if (stored === null) throw new Error('ENOENT');
		return stored;
	});
	vi.spyOn(fs, 'writeFileSync').mockImplementation((_file, data) => {
		stored = String(data);
	});
	vi.spyOn(fs, 'rmSync').mockImplementation(() => {
		stored = null;
	});
	vi.stubEnv('LOG_REQUESTS', 'ON');
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
});

describe('maxLogEntries', () => {
	it('is 10 unless MAX_LOGGED_REQUESTS says otherwise', () => {
		expect(maxLogEntries()).toBe(10);
	});

	it.each([
		['25', 25],
		['2.9', 2],
		['500', 100],
		['0', 10],
		['-3', 10],
		['lots', 10],
	])('reads %s as %i', (setting, expected) => {
		vi.stubEnv('MAX_LOGGED_REQUESTS', setting);

		expect(maxLogEntries()).toBe(expected);
	});
});

describe('logger', () => {
	it('writes nothing unless LOG_REQUESTS is ON', () => {
		vi.stubEnv('LOG_REQUESTS', 'OFF');

		logger({ data: { id: 1 }, pathName: 'api/bikes' });

		expect(fs.writeFileSync).not.toHaveBeenCalled();
	});

	it('writes the request to api_request_log.json', () => {
		logger({ data: { id: 1 }, type: 'POST', pathName: 'api/bikes' });

		const [file] = vi.mocked(fs.writeFileSync).mock.calls[0];
		expect(file).toBe(logPath);
		expect(path.basename(logPath)).toBe('api_request_log.json');

		expect(entries()).toHaveLength(1);
		expect(entries()[0].request_information).toMatchObject({
			path: 'api/bikes',
			request_type: 'POST',
		});
		expect(entries()[0].sent_data).toEqual({ id: 1 });
	});

	it('logs a GET when no type is given', () => {
		logger({ data: {}, pathName: 'api/bikes' });

		expect(entries()[0].request_information.request_type).toBe('GET');
	});

	it('puts the newest request first', () => {
		logger({ data: { id: 1 }, pathName: 'api/bikes' });
		logger({ data: { id: 2 }, pathName: 'api/bikes' });

		expect(ids()).toEqual([2, 1]);
	});

	it('keeps only the newest MAX_LOGGED_REQUESTS requests', () => {
		vi.stubEnv('MAX_LOGGED_REQUESTS', '2');

		for (const id of [1, 2, 3]) {
			logger({ data: { id }, pathName: 'api/bikes' });
		}

		expect(ids()).toEqual([3, 2]);
	});

	it.each([
		['text that is not JSON', 'not json'],
		['JSON that is not a list', '{"old":"format"}'],
	])('starts again from a file holding %s', (_name, content) => {
		stored = content;

		logger({ data: { id: 1 }, pathName: 'api/bikes' });

		expect(entries()).toHaveLength(1);
	});
});

describe('clearLog', () => {
	it('removes the log file, whether or not there is one', () => {
		clearLog();

		expect(fs.rmSync).toHaveBeenCalledWith(logPath, { force: true });
	});
});
