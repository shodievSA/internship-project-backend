import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '@/types/customError';

const errorHandler : ErrorRequestHandler = function(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message
    });
    return
  }

  // Fallback for unexpected errors
  console.error('UNEXPECTED ERROR:', err);
  res.status(500).json({
    message: 'Something went wrong'
  });
  return
}

export default errorHandler