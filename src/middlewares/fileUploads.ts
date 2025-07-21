import multer, { type FileFilterCallback, type StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { AppError } from '@/types';
import AuthenticatedRequest from '@/types/authenticatedRequest';

const uploadFolder = path.join(__dirname, '../taskFileUploads');

(async () => {
    try {
        await fs.access(uploadFolder);
    } catch {
        try {
            await fs.mkdir(uploadFolder, { recursive: true });
        } catch (error) {
            console.error('Failed to create task file uploads folder:', error);
        }
    }
})();

const storage: StorageEngine = multer.diskStorage({

	destination: (_req, _file, cb) => {

		cb(null, uploadFolder);

	},

	filename: (_req, file, cb) => {

		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		const originalName = path.basename(file.originalname).replace(/[^\w.-]/g, '_');
		const fileName = `${file.fieldname}-${uniqueSuffix}${path.extname(originalName)}`;
		
		cb(null, fileName);

	},

});

export const upload = multer({
	
	storage,
	
	limits: {

		files: 5,
		fileSize: 10 * 1024 * 1024, // 10 MB

	},

	fileFilter: (_req: AuthenticatedRequest, file: Express.Multer.File, cb: FileFilterCallback) => {

		const blockedExtensions = [
			
			'.exe', '.dll', '.bat', '.cmd', '.sh', '.bin', '.vbs', '.js',
			'.jar', '.war', '.ear', '.php', '.asp', '.aspx', '.jsp', '.pyc',
			'.pl', '.cgi', '.ps1', '.reg', '.inf', '.msi', '.msp', '.scr',
			'.hta', '.cpl', '.dmg', '.app', '.pkg', '.deb', '.rpm', '.vb',
			'.vbe', '.wsf', '.wsc', '.com', '.torrent',

		] as readonly string[];

		const blockedMimeTypes = [

			'application/x-msdownload', 'application/x-sh', 'application/x-executable',
			'application/vnd.microsoft.portable-executable', 'application/octet-stream',
			'application/java-archive', 'text/x-php', 'application/x-php',
			'application/x-httpd-php', 'application/x-perl', 'application/x-python-code',
			'application/javascript', 'text/javascript', 'application/x-powershell',

		] as readonly string[];

		const fileExt = path.extname(file.originalname).toLowerCase();
		const fileMime = file.mimetype.toLowerCase();

		if (blockedExtensions.includes(fileExt)) {

			return cb(new AppError(`File type '${fileExt}' is not allowed for security reasons.`, 403));

		}

		if (blockedMimeTypes.includes(fileMime)) {

			return cb(new AppError(`File type '${fileMime}' is not allowed for security reasons.`, 403));

		}

		const parts = file.originalname.toLowerCase().split('.');

		if (parts.length > 2) {

			const finalExt = '.' + parts[parts.length - 1];
			const previousExt = '.' + parts[parts.length - 2];

			if (blockedExtensions.includes(finalExt) || blockedExtensions.includes(previousExt)) {

				return cb(new AppError(`File with potentially malicious double extension '${fileExt}' is not allowed.`, 403));

			}

		}

		cb(null, true);

	},

});