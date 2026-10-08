import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addMediaEndpoint } from '../../mcp/helpers/add-media-endpoint.js';

const smallPng = () =>
	sharp({
		create: { width: 4, height: 2, channels: 3, background: 'red' },
	})
		.png()
		.toBuffer();

describe('addMediaEndpoint', () => {
	let resourcesDir: string;

	beforeEach(() => {
		resourcesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-media-'));
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		fs.rmSync(resourcesDir, { recursive: true, force: true });
	});

	it('saves a base64 image as a 1000 x 1000 png', async () => {
		const image = (await smallPng()).toString('base64');

		const result = await addMediaEndpoint(
			'red',
			'images',
			'png',
			image,
			resourcesDir,
		);

		expect(result.ok).toBe(true);
		expect(result.message).toContain(
			'http://localhost:8000/api/images/red.png',
		);
		const saved = await sharp(
			path.join(resourcesDir, 'images', 'red.png'),
		).metadata();
		expect([saved.format, saved.width, saved.height]).toEqual([
			'png',
			1000,
			1000,
		]);
	});

	it('saves an image from a data url and from a file path', async () => {
		const png = await smallPng();
		const filePath = path.join(resourcesDir, 'source.png');
		fs.writeFileSync(filePath, png);

		const fromDataUrl = await addMediaEndpoint(
			'one',
			'images',
			'png',
			`data:image/png;base64,${png.toString('base64')}`,
			resourcesDir,
		);
		const fromFile = await addMediaEndpoint(
			'two',
			'images',
			'png',
			filePath,
			resourcesDir,
		);

		expect([fromDataUrl.ok, fromFile.ok]).toEqual([true, true]);
		expect(fs.readdirSync(path.join(resourcesDir, 'images'))).toEqual([
			'one.png',
			'two.png',
		]);
	});

	it('downloads media from a url', async () => {
		const video = Buffer.from('not really a video');
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(video)),
		);

		const result = await addMediaEndpoint(
			'clip',
			'videos',
			'mp4',
			'https://example.com/clip.mp4',
			resourcesDir,
		);

		expect(result.ok).toBe(true);
		expect(
			fs.readFileSync(path.join(resourcesDir, 'videos', 'clip.mp4')),
		).toEqual(video);
	});

	it('reports a download that fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('', { status: 404 })),
		);

		const result = await addMediaEndpoint(
			'clip',
			'videos',
			'mp4',
			'https://example.com/clip.mp4',
			resourcesDir,
		);

		expect(result).toEqual({
			ok: false,
			message: 'Failed to create API endpoint: Failed to download: 404',
		});
	});

	it('leaves a file that already exists alone', async () => {
		const image = (await smallPng()).toString('base64');
		await addMediaEndpoint('red', 'images', 'png', image, resourcesDir);
		const first = fs.statSync(path.join(resourcesDir, 'images', 'red.png'));

		const result = await addMediaEndpoint(
			'red',
			'images',
			'png',
			image,
			resourcesDir,
		);

		expect(result.ok).toBe(false);
		expect(
			fs.statSync(path.join(resourcesDir, 'images', 'red.png')).mtimeMs,
		).toBe(first.mtimeMs);
	});

	it.each(['../outside', 'a/b', 'red.png'])(
		'refuses the name %s',
		async (name) => {
			const result = await addMediaEndpoint(
				name,
				'images',
				'png',
				'AAAA',
				resourcesDir,
			);

			expect(result.ok).toBe(false);
			expect(fs.readdirSync(resourcesDir)).toEqual([]);
		},
	);

	it('refuses a file type that does not match the folder', async () => {
		const result = await addMediaEndpoint(
			'red',
			'videos',
			'png',
			'AAAA',
			resourcesDir,
		);

		expect(result.ok).toBe(false);
		expect(result.message).toContain('Unsupported combination');
	});

	it('reports media it cannot read', async () => {
		const result = await addMediaEndpoint(
			'red',
			'images',
			'png',
			'not base64!',
			resourcesDir,
		);

		expect(result.ok).toBe(false);
		expect(result.message).toContain('Invalid input');
	});
});
