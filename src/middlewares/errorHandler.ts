import { NextFunction, Request, Response, ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (err, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: err.message || 'Internal Server Error' });
};

export default errorHandler;