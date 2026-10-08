import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to download file from URL
const downloadFile = (url: string): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		const client = url.startsWith('https:') ? https : http;

		client
			.get(url, (response) => {
				if (response.statusCode !== 200) {
					reject(
						new Error(`Failed to download: ${response.statusCode}`),
					);
					return;
				}

				const chunks: Buffer[] = [];
				response.on('data', (chunk) => chunks.push(chunk));
				response.on('end', () => resolve(Buffer.concat(chunks)));
				response.on('error', reject);
			})
			.on('error', reject);
	});
};

// Function to add media to a specified directory in a local file system
const addMediaEndpoint = async (
	mediaName: string,
	type: 'videos' | 'images',
	fileType: 'png' | 'mp4',
	image: string, // This can be a base64 string, data URL, file path, or URL
) => {
	if (!mediaName || !type || !fileType || !image) {
		return 'Media API Endpoint Not created. mediaName, type, fileType, and image are required to create a new API endpoint.';
	}

	// Create path to the endpoint directory
	const endpointDir = path.join(__dirname, '..', '..', 'resources', type);
	const apiPath = path.join(endpointDir, `${mediaName}.${fileType}`);

	if (fs.existsSync(apiPath)) {
		return `API Endpoint Not created. API endpoint ${mediaName}.${fileType} already exists.`;
	}

	try {
		// Create the endpoint directory first
		fs.mkdirSync(endpointDir, { recursive: true });

		let sourceBuffer: Buffer | null = null;
		let sourcePath: string | null = null;

		// Determine input type and get buffer/path
		if (image.startsWith('http://') || image.startsWith('https://')) {
			// Download from URL
			console.log(`Downloading from URL: ${image}`);
			sourceBuffer = await downloadFile(image);
		} else if (image.startsWith('data:')) {
			// Handle data URL format
			const base64Data = image.split(',')[1];
			sourceBuffer = Buffer.from(base64Data, 'base64');
		} else if (fs.existsSync(image)) {
			// Handle local file path
			sourcePath = image;
		} else if (image.match(/^[A-Za-z0-9+/=]+$/)) {
			// Assume it's a base64 string
			sourceBuffer = Buffer.from(image, 'base64');
		} else {
			throw new Error(
				'Invalid input: must be URL, file path, or base64 string',
			);
		}

		// Process based on file type
		if (fileType === 'png' && type === 'images') {
			if (sourcePath) {
				// Use sharp with file path
				await sharp(sourcePath)
					.resize(1000, 1000)
					.png()
					.toFile(apiPath);
			} else if (sourceBuffer) {
				// Use sharp with buffer
				await sharp(sourceBuffer)
					.resize(1000, 1000)
					.png()
					.toFile(apiPath);
			}
		} else if (fileType === 'mp4' && type === 'videos') {
			if (sourcePath) {
				// Copy video file directly
				fs.copyFileSync(sourcePath, apiPath);
			} else if (sourceBuffer) {
				// Write buffer to file
				fs.writeFileSync(apiPath, sourceBuffer);
			}
		} else {
			throw new Error(`Unsupported combination: ${fileType} for ${type}`);
		}

		return `API Endpoint ${mediaName} created successfully at ${apiPath}.`;
	} catch (error) {
		return `Failed to create API endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`;
	}
};

export { addMediaEndpoint };
