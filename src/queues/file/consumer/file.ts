import type { Channel, ConsumeMessage } from 'amqplib';
import fileHandler from '@/services/fileService';
import { AppError } from '@/types';
import fs from 'fs';
import { rmTaskFileUploads } from '@/utils/rmTaskFileUploads';

type FileUploadPayload = {

    key: string;
    contentType?: string;
    action: 'upload' | 'edit' | 'remove';
    file?: string | string[]; // Path(s) to file(s) on disk (from Multer's `req.files[i].path`)

};

export function consumeFileQueue(channel: Channel): void {

    channel.consume('file_uploader', async (msg: ConsumeMessage | null): Promise<void> => {

        if (!msg) return;

        try {

            const {

                key,
                contentType,
                action,
                file

            }: FileUploadPayload = JSON.parse(msg.content.toString());

            if (action === 'upload') {

                const stream = fs.createReadStream(file as string);
                await fileHandler.uploadfile(key, stream, contentType!);

            } else if (action === 'edit') {

                const stream = fs.createReadStream(file as string);
                await fileHandler.editFile(key, stream, contentType!);

            } else if (action === 'remove') {

                await fileHandler.removeFile(key);

            } else {

                throw new AppError(`Unknown file action: ${action}`, 400);
                
            }

            channel.ack(msg);

            if (file) {

                if (Array.isArray(file)) {

                    await rmTaskFileUploads(file);

                } else {

                    await rmTaskFileUploads([file]);

                }

            }

            
        } catch (error) {

            console.error('Error processing file upload:', error);
            channel.nack(msg, false, false); 
            
        }

    });

}