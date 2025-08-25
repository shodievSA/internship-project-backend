import amqp, { type Channel, type ChannelModel } from 'amqplib';
import { logger } from './logger';

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

        logger.info(`connected successfully to rabbitmq and asserted queue: "${queueName}"`);

        return channel;

    } catch (err) {

        throw err;

    }

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

            logger.info("rabbitmq connection and channels closed successfully");

        } catch (err) {

            throw err;

        } finally {

            process.exit(0);

        }

    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);

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

                throw err;

            }

            await new Promise(res => setTimeout(res, delayMs));

        }

    }

	throw new Error("Unexpected failure while connecting to RabbitMQ");

}
