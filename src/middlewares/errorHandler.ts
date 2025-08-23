import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '@/types/customError';
import { logger } from '@/config/logger';

const errorHandler: ErrorRequestHandler = (
	err: Error,
	req: Request,
	res: Response,
	_next: NextFunction
) => {

	logger.error({
		message: err.message,
		stack: err.stack,
		url: req.originalUrl,
		method: req.method
	});

	if (err instanceof AppError && err.isOperational) {
		res.status(err.statusCode).json({ message: err.message });
	} else {
		res.status(500).json({ message: "Unexpected internal server error occured" });
	}

}

export default errorHandler;