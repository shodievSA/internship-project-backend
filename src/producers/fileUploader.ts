import { type Channel } from 'amqplib';
import { getQueueChannel } from "@/config/rabbitmq";

export async function sendFileToQueue(
    payload: { filePath: string; taskId: string; }
): Promise<void> {

    const channel: Channel = await getQueueChannel("file_uploader");

    channel.sendToQueue('file_uploader', Buffer.from(JSON.stringify(payload)), {

        persistent: true,
        
    });

}