import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import logger, { deleteLogs } from '../../utilities/logger.js';

// The log file is never touched: every fs call the logger makes is replaced
let exists = false;
let written: string[] = [];

beforeEach(() => {
	exists = false;
	written = [];
	vi.spyOn(console, 'log').mockImplementation(() => {});
	vi.spyOn(fs, 'existsSync').mockImplementation(() => exists);
	vi.spyOn(fs, 'writeFileSync').mockImplementation((_file, data) => {
		written.push(String(data));
	});
	vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
	vi.stubEnv('LOG_REQUESTS', 'ON');
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
});

describe('logger', () => {
	it('writes nothing unless LOG_REQUESTS is ON', () => {
		vi.stubEnv('LOG_REQUESTS', 'OFF');

		logger({ data: { id: 1 }, pathName: 'api/bikes' });

		expect(fs.writeFileSync).not.toHaveBeenCalled();
	});

	it('appends the request to api_request_log.log', () => {
		logger({ data: { id: 1 }, type: 'POST', pathName: 'api/bikes' });

		const [file, , options] = vi.mocked(fs.writeFileSync).mock.calls[0];
		expect(path.basename(String(file))).toBe('api_request_log.log');
		expect(options).toEqual({ flag: 'a+' });

		const entry = JSON.parse(written[0]);
		expect(entry.request_information).toMatchObject({
			path: 'api/bikes',
			request_type: 'POST',
		});
		expect(entry.sent_data).toEqual({ id: 1 });
	});

	it('logs a GET when no type is given', () => {
		logger({ data: {}, pathName: 'api/bikes' });

		expect(JSON.parse(written[0]).request_information.request_type).toBe(
			'GET',
		);
	});

	it('starts with a comma when the file already has an entry', () => {
		exists = true;

		logger({ data: { id: 2 }, pathName: 'api/bikes' });

		expect(written[0].startsWith(',{')).toBe(true);
	});

	it('squeezes runs of spaces in the data', () => {
		logger({ data: { title: 'a    b' }, pathName: 'api/bikes' });

		expect(JSON.parse(written[0]).sent_data).toEqual({ title: 'a b' });
	});
});

describe('deleteLogs', () => {
	it('removes the log file', () => {
		exists = true;

		deleteLogs();

		const [file] = vi.mocked(fs.unlinkSync).mock.calls[0];
		expect(path.basename(String(file))).toBe('api_request_log.log');
	});

	it('does nothing when there is no log file', () => {
		deleteLogs();

		expect(fs.unlinkSync).not.toHaveBeenCalled();
	});
});
