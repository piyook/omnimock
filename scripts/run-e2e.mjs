import { spawn, spawnSync } from 'node:child_process';

// The settings the specs are written for. Every suite's server starts with
// all of them set, so that what .env holds at the time (chaos left on, a
// shorter log) can't change a result: dotenv leaves alone anything already in
// the environment.
const baseEnv = {
	LOG_REQUESTS: 'ON',
	DELETE_LOGS_ON_SERVER_RESTART: 'ON',
	MAX_LOGGED_REQUESTS: '10',
	CHAOS_ENABLED: 'OFF',
	CHAOS_FREQUENCY: '5',
	CHAOS_MODE: 'every',
	CHAOS_STATUS: '500',
};

// Each suite gets its own server, started with the suite's env over the base
// one, and runs its specs against it. cypress.config.ts picks the specs from
// the suite's name.
const suites = [
	{ name: 'default', env: {} },
	{
		name: 'chaos',
		env: {
			CHAOS_ENABLED: 'ON',
			CHAOS_FREQUENCY: '2',
			CHAOS_STATUS: '503',
		},
	},
];

const port = 8000;
const url = `http://localhost:${port}/`;

// By default only a one-line result per suite is printed, and the full server
// and Cypress output of a suite is shown only if it fails. E2E_VERBOSE=true
// prints everything as it happens (used in CI).
const verbose = process.env.E2E_VERBOSE === 'true';
const childStdio = verbose ? 'inherit' : ['ignore', 'pipe', 'pipe'];
const log = (...args) => {
	if (verbose) console.log(...args);
};

// Collects a child's piped output; returns a function giving the text so far.
// Empty in verbose mode, where the output goes straight to the terminal.
const capture = (proc) => {
	const chunks = [];
	proc.stdout?.on('data', (chunk) => chunks.push(chunk));
	proc.stderr?.on('data', (chunk) => chunks.push(chunk));
	return () => Buffer.concat(chunks).toString();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isUp = async () => {
	try {
		await fetch(url, { signal: AbortSignal.timeout(2000) });
		return true;
	} catch {
		return false;
	}
};

// Whether a child process has ended, by exiting or by being killed (a killed
// one has a signalCode and no exitCode)
const hasEnded = (proc) => proc.exitCode !== null || proc.signalCode !== null;

// Throws if the server's process has ended, so that a server that fails to
// start is reported at once and not after every attempt to reach it
const assertRunning = (proc) => {
	if (!hasEnded(proc)) return;
	throw new Error(
		`Server ended before it answered on port ${port} (${proc.signalCode ?? `exit code ${proc.exitCode}`})`,
	);
};

// Waits until the server answers (up = true) or stops answering (up = false).
// `check` runs between attempts and can throw to stop the wait.
const waitFor = async (up, check = () => {}, attempts = 30) => {
	for (let i = 0; i < attempts; i++) {
		if ((await isUp()) === up) return;
		check();
		await sleep(1000);
	}
	throw new Error(
		`Server on port ${port} ${up ? 'did not start' : 'did not stop'} after ${attempts} attempts`,
	);
};

// Node runs the server directly (no npm, no shell, no watcher), so it is one
// process that can be killed on any platform.
const startServer = (env) => {
	const proc = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
		stdio: childStdio,
		env: { ...process.env, ...baseEnv, ...env },
		windowsHide: true,
	});
	proc.output = capture(proc);
	return proc;
};

const stopServer = async (proc) => {
	if (!proc || hasEnded(proc)) return;
	const exited = new Promise((resolve) => proc.once('exit', resolve));
	proc.kill();
	await exited;
};

// Cypress is started through a shell and starts processes of its own, so
// killing the one we hold would leave the rest running. On Windows taskkill
// takes the whole tree; elsewhere Cypress is the leader of its own process
// group (detached), and the group is signalled.
const killTree = (pid) => {
	if (process.platform === 'win32') {
		spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], {
			stdio: 'ignore',
			windowsHide: true,
		});
	} else {
		process.kill(-pid, 'SIGTERM');
	}
};

// The Cypress run in progress, null between runs
let cypressProc = null;

const stopCypress = () => {
	if (!cypressProc) return;
	try {
		killTree(cypressProc.pid);
	} catch {
		// It ended in the meantime
	}
};

// Runs asynchronously so the server's piped output keeps being drained
const cypress = (suite) => {
	return new Promise((resolve, reject) => {
		const proc = spawn('npx cypress run --e2e', {
			stdio: childStdio,
			env: { ...process.env, E2E_SUITE: suite },
			shell: true,
			windowsHide: true,
			detached: process.platform !== 'win32',
		});
		cypressProc = proc;
		const output = capture(proc);

		proc.on('error', reject);
		proc.on('close', (code) => {
			cypressProc = null;
			resolve({ code, output: output() });
		});
	});
};

// Test counts from the results box Cypress prints for each spec, added up
const cypressCount = (output, label) => {
	const matches = output.matchAll(
		new RegExp(`│\\s*${label}:\\s+(\\d+)`, 'g'),
	);
	return [...matches].reduce((sum, match) => sum + Number(match[1]), 0);
};

let currentProc = null;
for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, async () => {
		stopCypress();
		await stopServer(currentProc);
		process.exit(1);
	});
}

// A server that is already there would be the one tested, with its own
// settings, while ours failed to start.
if (await isUp()) {
	console.error(
		`Error: something is already answering on port ${port}. Stop it (e.g. 'npm stop') and retry.`,
	);
	process.exit(1);
}

let failedSuites = 0;
let totalTests = 0;

for (const { name, env } of suites) {
	let cypressOutput = '';
	let error = null;

	log(`\n=== Starting test suite: ${name} ===`);
	try {
		currentProc = startServer(env);
		const server = currentProc;
		await waitFor(true, () => assertRunning(server));
		const result = await cypress(name);
		cypressOutput = result.output;
		if (result.code !== 0) {
			throw new Error(`Cypress exited with code ${result.code}`);
		}
	} catch (e) {
		error = e;
		failedSuites++;
	} finally {
		const serverOutput = currentProc?.output() ?? '';
		await stopServer(currentProc);
		currentProc = null;
		await waitFor(false);

		const passing = cypressCount(cypressOutput, 'Passing');
		const failing = cypressCount(cypressOutput, 'Failing');
		totalTests += cypressCount(cypressOutput, 'Tests');

		if (error) {
			const counts = cypressOutput
				? `  ${passing} passed, ${failing} failed`
				: '';
			console.error(`✗ ${name}${counts}  (${error.message})`);
			if (serverOutput) {
				console.error(
					`\n--- ${name}: server output ---\n${serverOutput}`,
				);
			}
			if (cypressOutput) {
				console.error(
					`\n--- ${name}: Cypress output ---\n${cypressOutput}`,
				);
			}
		} else {
			console.log(
				`✓ ${name}${cypressOutput ? `  ${passing} passed` : ''}`,
			);
		}
	}
}

const passedSuites = suites.length - failedSuites;
const tests = totalTests > 0 ? ` (${totalTests} tests)` : '';
console.log(
	`\n=== ${passedSuites} of ${suites.length} suites passed${tests} ===`,
);
process.exit(failedSuites > 0 ? 1 : 0);
