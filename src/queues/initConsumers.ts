import { getQueueChannel } from '@/config/rabbitmq';
import { consumeEmailQueue, consumeFileQueue } from '@/queues';

export async function initConsumers() {

	try {

		const emailChannel = await getQueueChannel('email_sender');
		consumeEmailQueue(emailChannel);

		const fileChannel = await getQueueChannel('file_uploader');
		consumeFileQueue(fileChannel);

	} catch (err) {

		throw err;

	}
    
}