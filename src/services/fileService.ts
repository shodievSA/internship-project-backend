import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/clients/s3";
import type { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { AppError } from "@/types";

enum FileAction {

    Upload = 'upload',
    Edit = 'edit'

}

type FilePayload = {

    key: string;
    stream: Readable;
    contentType: string;

};

class FileHandler {

    private readonly s3: S3Client;
    private readonly bucket: string;

    constructor(s3Client?: S3Client, bucket?: string) {

        this.s3 = s3Client ?? s3;
        this.bucket = bucket ?? process.env.AWS_S3_BUCKET!;

    }

    async uploadfile(
        files: FilePayload[],
    ): Promise<void> {

       return this._fileHandler(files, FileAction.Upload);

    }

    async retrieveFile(key: string): Promise<string> {

        try {

            const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
            const url = await getSignedUrl(this.s3, cmd, { expiresIn: 3600 });

            return url;
            
        } catch (error: unknown) {

            throw new AppError(`Failed to retrieve files: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
            
        }

    }

    async editFile(
        files: FilePayload[],
    ): Promise<void> {

        return this._fileHandler(files, FileAction.Edit);
       
    }

    async removeFile(key: string): Promise<void> {

        try {

            const cmd = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });

            await this.s3.send(cmd);
            
        } catch (error: unknown) {

           throw new AppError(`Failed to remove file: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);

        }

    }

    private async _fileHandler(
        files: FilePayload[],
        action: FileAction
    ): Promise<void> {

        try {

            for (const { key, stream, contentType } of files) {

                const cmd = new PutObjectCommand({

                    Bucket: this.bucket,
                    Key: key,
                    Body: stream,
                    ContentType: contentType,

                });

                await this.s3.send(cmd);

            }

        } catch (error: unknown) {

            const msg = error instanceof Error ? error.message : 'Unknown error';
            throw new AppError(`Failed to ${action} file: ${msg}`, 500);

        }
        
    }

}

const fileHandler = new FileHandler();

export default fileHandler;
