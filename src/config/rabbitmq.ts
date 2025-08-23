import amqp, { type Channel, type ChannelModel } from 'amqplib';
import { logger } from './logger';

const rabbitmqUrl = process.env.RABBITMQ_URL!;

let connection: ChannelModel | null = null;
const queueChannels = new Map<string, Channel>();

export async function getQueueChannel(queueName: string): Promise<Channel> {

    if (queueChannels.has(queueName)) {

        return queueChannels.get(queueName)!;

    }

    try {

        if (!connection) {

            connection = await amqp.connect(rabbitmqUrl);
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