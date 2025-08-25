import type { Channel, ConsumeMessage } from 'amqplib';
import fileHandler from '@/services/fileService';
import fs from 'fs';
import { rmTaskFileUploads } from '@/utils/rmTaskFileUploads';
import { logger } from '@/config/logger';

type FileUploadPayload = {
    key: string | string[];
    contentType?: string | string[];
    action: 'upload' | 'edit' | 'remove';
    filePath?: string | string[];
};

export function consumeFileQueue(channel: Channel): void {

    channel.consume('file_uploader', async (msg: ConsumeMessage | null): Promise<void> => {

        if (!msg) return;

        try {

            const {
                key,
                contentType,
                action,
                filePath
            }: FileUploadPayload = JSON.parse(msg.content.toString());

            if (action === 'upload') {

                const keys = Array.isArray(key) ? key : [key];
                const paths = Array.isArray(filePath) ? filePath : [filePath];
                const contentTypes = Array.isArray(contentType) ? contentType : [contentType];

                const files = keys.map((k, i) => ({
                    key: k,
                    stream: fs.createReadStream(paths[i]!),
                    contentType: contentTypes[i]!,
                }));

                await fileHandler.uploadfile(files);

            } else if (action === 'edit') {

                const keys = Array.isArray(key) ? key : [key];
                const paths = Array.isArray(filePath) ? filePath : [filePath];
                const contentTypes = Array.isArray(contentType) ? contentType : [contentType];

                const files = keys.map((k, i) => ({

                    key: k,
                    stream: fs.createReadStream(paths[i]!),
                    contentType: contentTypes[i]!,
                    
                }));

                await fileHandler.editFile(files);

            } else if (action === 'remove') {

                await fileHandler.removeFile(key as string);

            }

            channel.ack(msg);

            if (filePath) {

                if (Array.isArray(filePath)) {

                    await rmTaskFileUploads(filePath);

                } else {

                    await rmTaskFileUploads([filePath]);

                }

            }
            
        } catch (err) {

            logger.error({
				message: "error occured while processing file queue", 
				error: err
			});
            channel.nack(msg, false, false); 
            
        }

    });

}