import amqp, { type Channel, type Connection } from 'amqplib';
import { AppError } from '@/types';

const rabbitmqUrl = process.env.RABBITMQ_URL!;

let connection:  any = null;
const queueChannels = new Map<string, Channel>();

export async function getQueueChannel(queueName: string): Promise<Channel> {
    if (queueChannels.has(queueName)) {
        return queueChannels.get(queueName)!;
    }

    try {
        if (!connection) {
            connection = await amqp.connect(rabbitmqUrl);
            setupGracefulShutdown();
        }

        const channel = await connection.createChannel();
        await channel.assertQueue(queueName, { durable: true });

        queueChannels.set(queueName, channel);

        console.log(`Connected to RabbitMQ and asserted queue: "${queueName}"`);
        return channel;

    } catch (error) {
        throw new AppError(`Failed to connect to RabbitMQ or assert queue "${queueName}"`);
    }
}

function setupGracefulShutdown() {
    const shutdown = async () => {
        
        console.log('\n Shutting down RabbitMQ...');

        try {

            for (const [queueName, channel] of queueChannels.entries()) {
                await channel.close();
                console.log(` Channel for queue "${queueName}" closed.`);
            }

            queueChannels.clear();

            if (connection) {
                await connection.close();
                console.log(' RabbitMQ connection closed.');
            }

        } catch (err) {
            console.error('Error during RabbitMQ shutdown:', err);
        } finally {
            process.exit(0);
        }
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
}