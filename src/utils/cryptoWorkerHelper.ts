import { Worker } from 'worker_threads';
import path from 'path';
import { AppError } from '@/types';

export function runCryptoWorker(method: 'encrypt' | 'decrypt', token: string, key: string): Promise<string> {
	return new Promise((resolve, reject) => {

		const worker = new Worker(path.resolve(__dirname, '../../dist/workers/cryptoWorker.js'), {
			workerData: { method, token, key }
		});

		worker.on('message', resolve);
		worker.on('error', reject);
		worker.on('exit', (code) => {
			if (code !== 0) {
				reject(new AppError(`Worker stopped with exit code ${code}`));
			}
		});
        
	});
}