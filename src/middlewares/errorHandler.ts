import { NextFunction, Request, Response, ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  res.status(500).json({ error: err.message || 'Internal Server Error' });
};

export default errorHandler;