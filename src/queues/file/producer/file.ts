import { type Channel } from 'amqplib';
import { getQueueChannel } from "@/config/rabbitmq";

type FileUploadPayload = {

    key: string;
    contentType?: string;
    action: 'upload' | 'edit' | 'remove';
    file?: string | string[]; // Path(s) to file(s) on disk (from Multer's `req.files[i].path`)

};

export async function sendFileToQueue(
    payload: FileUploadPayload
): Promise<void> {

    const channel: Channel = await getQueueChannel("file_uploader");

    channel.sendToQueue('file_uploader', Buffer.from(JSON.stringify(payload)), {

        persistent: true,
        
    });

}