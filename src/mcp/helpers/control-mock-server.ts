import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Mode = 'start' | 'stop' | 'rebuild';

const runCommand = (command: string) => {
	const result = spawnSync(command, { shell: true, encoding: 'utf8' });
	const error =
		result.error?.message ??
		(result.status === 0
			? null
			: result.stderr || `Exited with code ${result.status}`);

	return { stdout: result.stdout ?? '', error };
};

const isDockerProcessRunning = () => {
	return !!runCommand(`docker ps -q --filter "name=mock-api-framework"`)
		.stdout;
};
const manageServer = (command: string, mode: Mode, PORT: number) => {
	const { error } = runCommand(command);

	if (error) {
		return `Error running ${command}. Failed to ${mode} the local mock API server. ${error}. Current working directory: ${process.cwd()}`;
	}

	if ((mode === 'start' || mode === 'rebuild') && !isDockerProcessRunning()) {
		return `Error: Local mock API server has not been started on port ${PORT}.`;
	}

	if (mode === 'stop' && isDockerProcessRunning()) {
		return `Error: Local mock API server has not been stopped on port ${PORT}.`;
	}

	return `Local mock API server has been ${mode}ed successfully on port ${PORT}`;
};

const startMockServer = async (PORT: number) => {
	return manageServer(
		`cd "${__dirname}" && docker-compose up -d`,
		'start',
		PORT,
	);
};

const stopMockServer = async (PORT: number) => {
	return manageServer(
		`cd "${__dirname}" && docker-compose down --remove-orphans --volumes --timeout 10`,
		'stop',
		PORT,
	);
};

const rebuildMockServer = async (PORT: number) => {
	return manageServer(
		`cd "${__dirname}" && docker-compose down --remove-orphans --volumes --timeout 10 &&docker-compose up -d --build --force-recreate`,
		'rebuild',
		PORT,
	);
};

export { rebuildMockServer, startMockServer, stopMockServer };
