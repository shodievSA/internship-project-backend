import { createServer } from 'http';
import app from './app';
import { logger } from './config/logger';
import initDB from './models';
import { initConsumers } from './queues/initConsumers';
import { startCronJobs } from './services/cronService';
import { handleUpgrade } from './upgradeHandler';

const server = createServer(app);
server.on('upgrade', handleUpgrade);

async function main() {

	const PORT = process.env.PORT || 3000;

	try {

		await initDB();
		await startCronJobs();
		await initConsumers();

		server.listen(PORT, () => {

			logger.info(`server is running at http://localhost:${PORT}`);

		});

	} catch (err) {

		logger.error({
			message: "failed to start the server",
			error: err
		});

	}

}

main();