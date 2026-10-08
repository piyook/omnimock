import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// The dashboard in ui/ has its own dependencies. In the Docker build the
// root install runs before ui/ is copied in, and the Dockerfile installs them
// itself afterwards.
if (existsSync('ui/package.json')) {
	console.log('Installing UI dependencies...');
	try {
		execSync('npm --prefix ui ci', { stdio: 'inherit' });
	} catch {
		console.log('UI install failed, continuing...');
	}
} else {
	console.log('Skipping UI install (no ui directory)');
}
