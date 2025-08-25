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

		res.status(err.statusCode).json({ error: err.message });

	} else {

		res.status(500).json({ error: "Unexpected internal server error occured while processing your request!" });
		
	}

}

export default errorHandler;