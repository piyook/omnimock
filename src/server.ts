import 'dotenv/config';
import fastify from 'fastify';
import { dbFlushToDisk, dbLoadFromDisk } from './models/db.js';
import * as seeders from './seeders/index.js';
import { apiList } from './utilities/api-list.js';
import {
	getChaosConfig,
	registerChaos,
	setChaosRoutes,
} from './utilities/chaos.js';
import { env } from './utilities/env.js';
import getApiRoutes from './utilities/file-scan.js';
import { clearLog } from './utilities/logger.js';
import serverPage from './utilities/server-page.js';

const app = fastify();

// Before the routes, so that its hook covers them
registerChaos(app);

const { apiRoutes } = await getApiRoutes(app);
setChaosRoutes(apiRoutes);

serverPage(app, apiRoutes);
apiList(app, apiRoutes);

// Delete any logs on server start if the DELETE_LOGS_ON_SERVER_RESTART env var is set to 'ON'
if (process.env?.DELETE_LOGS_ON_SERVER_RESTART?.toUpperCase() === 'ON') {
	clearLog();
}

const loaded = dbLoadFromDisk();

const seedRequested =
	process.env?.MOCK_DB_SEED_ON_START?.toUpperCase() === 'ON';

const shouldSeed = seedRequested || !loaded;

if (shouldSeed) {
	for (const seeder of Object.values(seeders)) {
		seeder();
	}
}

try {
	await app.listen({ port: Number(env.SERVER_PORT), host: '0.0.0.0' });
	console.log('\n*****************************************************');
	console.log(`SERVER UP AND RUNNING ON LOCALHOST:${env.SERVER_PORT}`);
	const chaos = getChaosConfig();
	if (chaos.enabled) {
		console.log(
			`CHAOS ON: 1 IN ${chaos.frequency} CALLS (${chaos.mode.toUpperCase()}) FAILS WITH A ${chaos.status}`,
		);
	}
	console.log('*****************************************************');

	process.on('SIGINT', () => {
		dbFlushToDisk();
		process.exit(0);
	});
	process.on('SIGTERM', () => {
		dbFlushToDisk();
		process.exit(0);
	});
} catch (error) {
	app.log.error(error);
	process.exit(1);
}
