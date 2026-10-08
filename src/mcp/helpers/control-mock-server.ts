import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { port, projectRoot, type ToolResult } from './project.js';

type Mode = 'start' | 'stop' | 'rebuild';

// Runs one `docker compose` command and gives back what it printed
type Compose = (args: string[]) => Promise<string>;

const down = ['down', '--remove-orphans', '--volumes', '--timeout', '10'];

const steps: Record<Mode, string[][]> = {
	start: [['up', '-d']],
	stop: [down],
	rebuild: [down, ['up', '-d', '--build', '--force-recreate']],
};

const done: Record<Mode, string> = {
	start: 'started',
	stop: 'stopped',
	rebuild: 'rebuilt',
};

// Run from the project root, where docker-compose.yml is. Not spawnSync: a
// rebuild takes minutes, and the MCP server has to keep answering meanwhile.
const compose: Compose = async (args) => {
	const { stdout } = await promisify(execFile)(
		'docker',
		['compose', ...args],
		{ cwd: projectRoot, maxBuffer: 64 * 1024 * 1024 },
	);
	return stdout;
};

// Asks compose for this project's containers, whatever they are named
const isRunning = async (run: Compose) => {
	const ids = await run(['ps', '-q', '--status', 'running']);
	return ids.trim() !== '';
};

const manageServer = async (
	mode: Mode,
	run: Compose = compose,
): Promise<ToolResult> => {
	try {
		for (const args of steps[mode]) {
			await run(args);
		}

		const shouldBeRunning = mode !== 'stop';
		if ((await isRunning(run)) !== shouldBeRunning) {
			return {
				ok: false,
				message: `Error: Local mock API server has not been ${done[mode]} on port ${port}.`,
			};
		}
	} catch (error) {
		return {
			ok: false,
			message: `Failed to ${mode} the local mock API server. ${error instanceof Error ? error.message : 'Unknown error'}`,
		};
	}

	return {
		ok: true,
		message: `Local mock API server has been ${done[mode]} successfully on port ${port}`,
	};
};

export { manageServer };
