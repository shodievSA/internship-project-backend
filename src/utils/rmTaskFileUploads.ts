import fs from 'fs/promises';

export const rmTaskFileUploads = async (files: string[]): Promise<void> => {

    try {

        const deletions = files.map(file =>

            fs.unlink(file)
                .catch(err => console.error(err))
            
        );

        await Promise.all(deletions);

    } catch (error) {

        console.error('Failed to remove uploaded files:', error);
        
    }

}
