import { Worker } from 'worker_threads';
import path from 'path';
import { AppError } from '@/types';

export function runCryptoWorker(method: 'encrypt' | 'decrypt', token: string, key: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const isDev = process.env.NODE_ENV !== 'production';

		const workerPath = isDev
			? path.resolve(__dirname, '../workers/cryptoWorker.ts')
			: path.resolve(__dirname, '../../dist/workers/cryptoWorker.js');

		const options = {
			workerData: { method, token, key },
			...(isDev && { execArgv: ['-r', 'ts-node/register'] })
		};

		const worker = new Worker(workerPath, options as any);

		worker.on('message', resolve);
		worker.on('error', reject);
		worker.on('exit', (code) => {
			if (code !== 0) {
				reject(new AppError(`Worker stopped with exit code ${code}`));
			}
		});
	});
}