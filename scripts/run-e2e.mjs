import { spawn } from 'node:child_process';

// Each suite gets its own server, started with the suite's env on top of .env,
// and runs its specs against it.
const suites = [{ name: 'default', env: {}, spec: 'cypress/e2e/*.cy.ts' }];

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

// Waits until the server answers (up = true) or stops answering (up = false)
const waitFor = async (up, attempts = 30) => {
	for (let i = 0; i < attempts; i++) {
		if ((await isUp()) === up) return;
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
		env: { ...process.env, ...env },
		windowsHide: true,
	});
	proc.output = capture(proc);
	return proc;
};

const stopServer = async (proc) => {
	if (!proc || proc.exitCode !== null) return;
	const exited = new Promise((resolve) => proc.once('exit', resolve));
	proc.kill();
	await exited;
};

// Runs asynchronously so the server's piped output keeps being drained
const cypress = (spec) => {
	return new Promise((resolve, reject) => {
		const proc = spawn(`npx cypress run --e2e --spec "${spec}"`, {
			stdio: childStdio,
			shell: true,
			windowsHide: true,
		});
		const output = capture(proc);

		proc.on('error', reject);
		proc.on('close', (code) => resolve({ code, output: output() }));
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

for (const { name, env, spec } of suites) {
	let cypressOutput = '';
	let error = null;

	log(`\n=== Starting test suite: ${name} ===`);
	try {
		currentProc = startServer(env);
		await waitFor(true);
		const result = await cypress(spec);
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
