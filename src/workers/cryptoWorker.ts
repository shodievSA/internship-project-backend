import { parentPort, workerData } from 'worker_threads';
import crypto from 'crypto';

const { method, token, key } = workerData;

const ENCRYPTION_KEY = crypto.createHash('sha256').update(key).digest();

if (method === 'encrypt') {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

	let encrypted = cipher.update(token, 'utf8', 'hex');
	encrypted += cipher.final('hex');

	parentPort?.postMessage(iv.toString('hex') + encrypted);
} else {
	const iv = Buffer.from(token.slice(0, 32), 'hex');
	const encrypted = token.slice(32);

	const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
	let decrypted = decipher.update(encrypted, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	parentPort?.postMessage(decrypted);
}