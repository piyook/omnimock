import { describe, expect, it } from 'vitest';
import { manageServer } from '../../mcp/helpers/control-mock-server.js';

// Stands in for `docker compose`: records each command, and answers `ps` with
// a container id when the server is to be seen as running
const fakeCompose = (running: boolean) => {
	const commands: string[] = [];
	const run = async (args: string[]) => {
		commands.push(args.join(' '));
		return args[0] === 'ps' && running ? 'c441c6f4abfc\n' : '';
	};
	return { commands, run };
};

describe('manageServer', () => {
	it('starts the server and checks it is running', async () => {
		const { commands, run } = fakeCompose(true);

		const result = await manageServer('start', run);

		expect(result).toEqual({
			ok: true,
			message:
				'Local mock API server has been started successfully on port 8000',
		});
		expect(commands).toEqual(['up -d', 'ps -q --status running']);
	});

	it('reports a start that leaves nothing running', async () => {
		const result = await manageServer('start', fakeCompose(false).run);

		expect(result.ok).toBe(false);
		expect(result.message).toContain('has not been started');
	});

	it('stops the server and checks it has gone', async () => {
		const { commands, run } = fakeCompose(false);

		const result = await manageServer('stop', run);

		expect(result.ok).toBe(true);
		expect(result.message).toContain('stopped successfully');
		expect(commands[0]).toMatch(/^down /);
	});

	it('reports a stop that leaves the server running', async () => {
		const result = await manageServer('stop', fakeCompose(true).run);

		expect(result.ok).toBe(false);
		expect(result.message).toContain('has not been stopped');
	});

	it('rebuilds by taking the server down and building it again', async () => {
		const { commands, run } = fakeCompose(true);

		const result = await manageServer('rebuild', run);

		expect(result.ok).toBe(true);
		expect(result.message).toContain('rebuilt successfully');
		expect(commands).toEqual([
			'down --remove-orphans --volumes --timeout 10',
			'up -d --build --force-recreate',
			'ps -q --status running',
		]);
	});

	it('reports a docker command that fails', async () => {
		const result = await manageServer('start', async () => {
			throw new Error('docker is not running');
		});

		expect(result).toEqual({
			ok: false,
			message:
				'Failed to start the local mock API server. docker is not running',
		});
	});
});
