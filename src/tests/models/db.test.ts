import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, dbDump, dbFlushToDisk, dbLoadFromDisk } from '../../models/db.js';

let dir: string;
let file: string;

const clear = () => {
	db.cat.__unsafe_replaceAll([]);
	db.user.__unsafe_replaceAll([]);
	db.post.__unsafe_replaceAll([]);
};

beforeEach(() => {
	dir = fs.mkdtempSync(path.join(os.tmpdir(), 'omnimock-db-'));
	file = path.join(dir, 'nested', 'mock-db.json');
	vi.stubEnv('MOCK_DB_PERSIST_PATH', file);
	clear();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllEnvs();
	fs.rmSync(dir, { recursive: true, force: true });
});

describe('models', () => {
	it('creates records with the next numeric id and faked fields', () => {
		const first = db.post.create();
		const second = db.post.create({ title: 'mine' });

		expect(first.id).toBe(1);
		expect(second).toMatchObject({ id: 2, title: 'mine' });
		expect(typeof first.body).toBe('string');
		expect(db.post.getAll()).toEqual([first, second]);
	});

	it('keeps an id it is given', () => {
		expect(db.cat.create({ id: 7 }).id).toBe(7);
		expect(db.cat.create().id).toBe(8);
	});

	it('gives users a uuid', () => {
		expect(db.user.create().id).toMatch(/^[0-9a-f-]{36}$/);
	});

	it('finds a record by id, or null', () => {
		const cat = db.cat.create({ name: 'Tom' });

		expect(db.cat.findFirst({ where: { id: { equals: cat.id } } })).toBe(
			cat,
		);
		expect(db.cat.findFirst({ where: { id: { equals: 99 } } })).toBeNull();
	});

	it('updates only the fields that are given a value', () => {
		const cat = db.cat.create({ name: 'Tom', type: 'Tabby' });

		const updated = db.cat.update({
			where: { id: { equals: cat.id } },
			data: { name: 'Felix', type: undefined },
		});

		expect(updated).toMatchObject({ name: 'Felix', type: 'Tabby' });
		expect(
			db.cat.update({ where: { id: { equals: 99 } }, data: {} }),
		).toBeNull();
	});

	it('deletes a record by id, or returns null', () => {
		const cat = db.cat.create();

		expect(db.cat.delete({ where: { id: { equals: cat.id } } })).toBe(cat);
		expect(db.cat.getAll()).toEqual([]);
		expect(db.cat.delete({ where: { id: { equals: cat.id } } })).toBeNull();
	});

	it('hands out copies of the list', () => {
		db.cat.create();

		db.cat.getAll().pop();

		expect(db.cat.getAll()).toHaveLength(1);
	});
});

describe('persistence', () => {
	it('is off unless MOCK_DB_PERSIST is ON', () => {
		db.cat.create();

		dbFlushToDisk();

		expect(fs.existsSync(file)).toBe(false);
		expect(dbLoadFromDisk()).toBe(false);
	});

	it('writes the database and reads it back', () => {
		db.cat.create({ name: 'Tom' });
		db.user.create({ title: 'a user' });
		db.post.create({ title: 'a post' });
		const dump = dbDump();
		// Turned on after the records are made, so no delayed save is queued
		vi.stubEnv('MOCK_DB_PERSIST', 'ON');

		dbFlushToDisk();
		clear();

		expect(dbLoadFromDisk()).toBe(true);
		expect(dbDump()).toEqual(dump);
	});

	it('does not load when there is no file', () => {
		vi.stubEnv('MOCK_DB_PERSIST', 'ON');

		expect(dbLoadFromDisk()).toBe(false);
	});

	it.each([
		['text that is not JSON', 'not json'],
		['another version', '{"version":2,"cat":[],"user":[],"post":[]}'],
		['a missing model', '{"version":1,"cat":[],"user":[]}'],
		['null', 'null'],
	])('does not load %s', (_name, content) => {
		vi.stubEnv('MOCK_DB_PERSIST', 'ON');
		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(file, content);

		expect(dbLoadFromDisk()).toBe(false);
	});

	it('saves once, shortly after a burst of changes', () => {
		vi.stubEnv('MOCK_DB_PERSIST', 'ON');
		vi.useFakeTimers();
		const write = vi.spyOn(fs, 'writeFileSync');

		db.cat.create();
		db.cat.create();
		expect(write).not.toHaveBeenCalled();

		vi.advanceTimersByTime(200);

		expect(write).toHaveBeenCalledTimes(1);
		expect(JSON.parse(fs.readFileSync(file, 'utf8')).cat).toHaveLength(2);
		write.mockRestore();
	});
});
