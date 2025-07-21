import fs from 'fs/promises';
import path from 'path';

const uploadFolder = path.join(__dirname, '../taskFileUploads');

export const rmTaskFileUploadsDir = async (): Promise<void> => {

    try {

        await fs.rm(uploadFolder, { recursive: true, force: true });

    } catch (error) {

        console.error('Failed to remove task file uploads directory:', error);
        
    }

}