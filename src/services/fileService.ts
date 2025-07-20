import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { rmTaskFileUploadsDir } from "@/utils/rmTaskFileUploadsDir";
import { AppError } from "@/types";

import { s3 } from "@/clients/s3";

enum FileAction {
  Upload = 'upload',
  Edit = 'edit'
}

class FileHandler {
    constructor(
        private readonly s3: S3Client = s3,
        private readonly bucket: string = process.env.AWS_S3_BUCKET!
    ) {}

    async uploadfile(key: string, file: Readable, contentType: string) {

       return this._fileHandler(key, file, contentType, FileAction.Upload);

    }

    async retrieveFiles(key: string) {
        try {

            const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
            const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });

            return url;
            
        } catch (error: unknown) {

            throw new AppError(`Failed to retrieve files: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
            
        }
    }

    async editFile(key: string, file: Readable, contentType: string) {

        return this._fileHandler(key, file, contentType, FileAction.Edit);
       
    }

    async removeFile(key: string) {
        try {

            const cmd = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });

            await this.s3.send(cmd);
            
        } catch (error: unknown) {

           throw new AppError(`Failed to remove file: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);

        }
    }

    private async _fileHandler(key: string, file: Readable, contentType: string, action: FileAction) {
        try {

            const cmd = new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file,
                ContentType: contentType,
            });

            await this.s3.send(cmd);

        } catch (error: unknown) {

            const msg = error instanceof Error ? error.message : 'Unknown error';
            throw new AppError(`Failed to ${action} file: ${msg}`, 500);

        } finally {

            try {

                await rmTaskFileUploadsDir();

            } catch (error: unknown) {

                const msg = error instanceof Error ? error.message : 'Unknown error';
                console.warn(`Failed to clean up task file uploads directory: ${msg}`);

            }

        }
    }
}

const fileHandler = new FileHandler();

export default fileHandler;
