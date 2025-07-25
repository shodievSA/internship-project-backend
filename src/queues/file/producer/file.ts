import { type Channel } from 'amqplib';
import { getQueueChannel } from "@/config/rabbitmq";

type FileUploadPayload = {

    key: string | string[];
    contentType?: string | string[];
    action: 'upload' | 'edit' | 'remove';
    filePath?: string | string[];

};

export async function sendFileToQueue(
    payload: FileUploadPayload
): Promise<void> {

    const channel: Channel = await getQueueChannel("file_uploader");

    channel.sendToQueue('file_uploader', Buffer.from(JSON.stringify(payload)), {

        persistent: true,
        
    });

}