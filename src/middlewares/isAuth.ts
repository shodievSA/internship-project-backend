import { Request, Response, NextFunction } from 'express';

export const isAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({ message: 'Unauthorized. Please log in.' });
};