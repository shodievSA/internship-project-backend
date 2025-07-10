import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '@/types/customError';

const errorHandler : ErrorRequestHandler = function(
	err: any,
	req: Request,
	res: Response,
	_next: NextFunction
) {
  
	if (err instanceof AppError) {

		res.status(err.statusCode).json({ message: err.message });
		return;

	}

	res.status(500).json({ 
		message: "Something went wrong " + err.errors[0].message.split('.')[1] 
	});

}

export default errorHandler;