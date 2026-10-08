import { execSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';

// npm writes this at the end of an install, so it is older than the lockfile
// only when the lockfile has changed since
const installed = 'ui/node_modules/.package-lock.json';
const lockfile = 'ui/package-lock.json';

const upToDate = () =>
	existsSync(installed) &&
	statSync(installed).mtimeMs >= statSync(lockfile).mtimeMs;

// The dashboard in ui/ has its own dependencies. In the Docker build the
// root install runs before ui/ is copied in, and the Dockerfile installs them
// itself afterwards.
if (!existsSync('ui/package.json')) {
	console.log('Skipping UI install (no ui directory)');
} else if (upToDate()) {
	console.log('Skipping UI install (ui/node_modules is up to date)');
} else {
	console.log('Installing UI dependencies...');
	try {
		execSync('npm --prefix ui ci', { stdio: 'inherit' });
	} catch {
		// The root install is left to finish: the server runs without the
		// dashboard. Nothing that needs ui/node_modules will work, though.
		console.error(
			"\nWARNING: the dashboard's dependencies failed to install (see above), so it can't be built or type-checked. Run 'npm --prefix ui ci' to try again.\n",
		);
	}
}
