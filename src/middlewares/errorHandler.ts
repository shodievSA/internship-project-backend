import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '@/types/customError';

const errorHandler: ErrorRequestHandler = function (
	err: any,
	req: Request,
	res: Response,
	_next: NextFunction
) {

	// Improved error logging
	console.error('--- ERROR HANDLER ---');
	console.error('Error:', err);
	if (err && err.stack) {
		console.error('Stack:', err.stack);
	}
	console.error('Request URL:', req.originalUrl);
	console.error('Request Method:', req.method);
	console.error('Request Body:', req.body);
	console.error('Request Query:', req.query);

	if (err instanceof AppError) {

		res.status(err.statusCode).json({ message: err.message });
		return;

	}

	res.status(500).json({
		message: "Something went wrong " + (err.message || (err.errors && err.errors[0] && err.errors[0].message.split('.')[1]))
	});

}

export default errorHandler;