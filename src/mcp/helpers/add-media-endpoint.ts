import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
	invalidNameMessage,
	isSafeName,
	projectRoot,
	serverUrl,
	type ToolResult,
	urlPrefix,
} from './project.js';

const defaultResourcesDir = path.join(projectRoot, 'src', 'resources');

// The folder each file type is served from
const folderFor = { png: 'images', mp4: 'videos' } as const;

const notCreated = (reason: string): ToolResult => ({
	ok: false,
	message: `Media API Endpoint Not created. ${reason}`,
});

// The media as bytes, from a URL, a data URL, a file path or a base64 string
const readSource = async (source: string): Promise<Buffer> => {
	if (/^https?:\/\//.test(source)) {
		// fetch follows redirects, which image hosts often use
		const response = await fetch(source);
		if (!response.ok) {
			throw new Error(`Failed to download: ${response.status}`);
		}
		return Buffer.from(await response.arrayBuffer());
	}

	if (source.startsWith('data:')) {
		return Buffer.from(source.split(',')[1] ?? '', 'base64');
	}

	if (fs.existsSync(source)) {
		return fs.readFileSync(source);
	}

	if (/^[A-Za-z0-9+/=]+$/.test(source)) {
		return Buffer.from(source, 'base64');
	}

	throw new Error('Invalid input: must be URL, file path, or base64 string');
};

// Function to add media to a specified directory in a local file system
const addMediaEndpoint = async (
	mediaName: string,
	type: 'videos' | 'images',
	fileType: 'png' | 'mp4',
	image: string, // This can be a base64 string, data URL, file path, or URL
	resourcesDir = defaultResourcesDir,
): Promise<ToolResult> => {
	if (!mediaName || !type || !fileType || !image) {
		return notCreated(
			'mediaName, type, fileType, and image are required to create a new API endpoint.',
		);
	}

	if (!isSafeName(mediaName)) {
		return notCreated(invalidNameMessage(mediaName));
	}

	if (folderFor[fileType] !== type) {
		return notCreated(`Unsupported combination: ${fileType} for ${type}`);
	}

	// Create path to the endpoint directory
	const endpointDir = path.join(resourcesDir, type);
	const fileName = `${mediaName}.${fileType}`;
	const apiPath = path.join(endpointDir, fileName);

	if (fs.existsSync(apiPath)) {
		return notCreated(`API endpoint ${fileName} already exists.`);
	}

	try {
		const source = await readSource(image);
		fs.mkdirSync(endpointDir, { recursive: true });

		if (fileType === 'png') {
			await sharp(source).resize(1000, 1000).png().toFile(apiPath);
		} else {
			fs.writeFileSync(apiPath, source);
		}

		return {
			ok: true,
			message: `API Endpoint ${mediaName} created successfully at ${apiPath}. Rebuild the server to serve it at ${serverUrl}/${urlPrefix}${type}/${fileName}.`,
		};
	} catch (error) {
		return {
			ok: false,
			message: `Failed to create API endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
		};
	}
};

export { addMediaEndpoint };
