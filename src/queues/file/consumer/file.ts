import type { Channel, ConsumeMessage } from 'amqplib';
import fileHandler from '@/services/fileService';
import { AppError } from '@/types';
import { Readable } from 'stream';

type FileUploadPayload = {
  key: string;
  contentType: string;
  action: 'upload' | 'edit';
  file: string;
};

export function consumeEmailQueue(channel: Channel): void {

    channel.consume('file_uploader', async (msg: ConsumeMessage | null): Promise<void> => {

        if (!msg) return;

        try {

            const {

                key,
                contentType,
                action,
                file

            }: FileUploadPayload = JSON.parse(msg.content.toString());

            const buffer = Buffer.from(file, 'base64');
            const stream = Readable.from(buffer);

            if (action === 'upload') {

                await fileHandler.uploadfile(key, stream, contentType);

            } else if (action === 'edit') {

                await fileHandler.editFile(key, stream, contentType);

            } else {

                throw new AppError(`Unknown file action: ${action}`, 400);
                
            }

            channel.ack(msg);            
            
        } catch (error) {

            console.error('Error processing file upload:', error);
            channel.nack(msg, false, false); 
            
        }

    });

}