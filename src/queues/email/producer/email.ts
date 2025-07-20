import { type Channel } from 'amqplib';
import { getQueueChannel } from "@/config/rabbitmq";
import { GmailType } from "@/services/gmaiService";

type EmailPayload = {

    type: GmailType;
    receiverEmail: string;
    params: Record<string, any>;

}

export async function sendEmailToQueue(
    payload: EmailPayload
): Promise<void> {

    const channel: Channel = await getQueueChannel("email_sender");

    channel.sendToQueue('email_sender', Buffer.from(JSON.stringify(payload)), {

        persistent: true,

    });

}