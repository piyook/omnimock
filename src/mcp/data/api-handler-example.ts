import fs from 'node:fs';
import path from 'node:path';
import { projectRoot } from '../helpers/project.js';

const apiHandlerExample = () => {
	const filePath = path.join(
		projectRoot,
		'templates/handlers/api.custom.template.ts',
	);

	const fileContent = fs.readFileSync(filePath, 'utf8');

	// The template imports from '../../src/...', which is right where it sits.
	// An endpoint is saved in src/api/<name>, where the same files are at '../../...'
	return fileContent.replaceAll("'../../src/", "'../../");
};

export { apiHandlerExample };
