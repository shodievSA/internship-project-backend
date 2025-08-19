import { createServer } from 'http';
import app from './app';
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

		server.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));

	} catch (error) {

		console.error('Failed to start server:', error);

	}

}

main();