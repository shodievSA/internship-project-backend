import { type Channel } from 'amqplib';
import { getQueueChannel } from "@/config/rabbitmq";

export async function sendEmailToQueue(
    payload: { to: string; subject: string; html: string }
): Promise<void> {

    const channel: Channel = await getQueueChannel("email_sender");

    channel.sendToQueue('email_sender', Buffer.from(JSON.stringify(payload)), {

        persistent: true,

    });

}