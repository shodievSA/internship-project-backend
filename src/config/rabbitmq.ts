import amqp, { type Channel } from 'amqplib';
import { AppError } from '@/types';

const rabbitmqUrl = process.env.RABBITMQ_URL!;

let connection: any = null;
const queueChannels = new Map<string, Channel>();

export async function getQueueChannel(queueName: string): Promise<Channel> {

    if (queueChannels.has(queueName)) {

        return queueChannels.get(queueName)!;

    }

    try {

        if (!connection) {

            connection = await connectWithRetry(rabbitmqUrl);
            initGracefulShutdown();

        }

        const channel: Channel = await connection.createChannel();
        await channel.assertQueue(queueName, { durable: true });

        queueChannels.set(queueName, channel);

        console.log(`Connected to RabbitMQ and asserted queue: "${queueName}"`);
        return channel;

    } catch (error) {

        throw new AppError(`Failed to connect to RabbitMQ or assert queue "${queueName}"`);

    }
}

async function connectWithRetry(
    url: string,
    maxRetries = 5,
    delayMs = 3000
): Promise<amqp.Connection> {
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {

        try {

            const conn: any = await amqp.connect(url);
            
            return conn;
            
        } catch (err) {

            if (attempt === maxRetries) {

                throw new AppError('Failed to connect to RabbitMQ after multiple attempts', 500);

            }

            await new Promise(res => setTimeout(res, delayMs));

        }

    }

    throw new AppError('Unexpected failure while connecting to RabbitMQ', 500);

}

function initGracefulShutdown(): void {

    const shutdown = async (): Promise<void> => {

        try {

            for (const [_queueName, channel] of queueChannels.entries()) {

                await channel.close();

            }

            queueChannels.clear();

            if (connection) {

                await connection.close();

            }

            console.log('RabbitMQ connection and channels closed successfully.');

        } catch (error) {

            throw new AppError('Failed to shutdown RabbitMQ connection and channels', 500);

        } finally {

            process.exit(0);

        }

    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);

}