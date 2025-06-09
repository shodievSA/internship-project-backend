import { Request, Response, NextFunction } from 'express';


export const logout = (req: Request, res: Response, next: NextFunction): void => {
  req.logout((err: any) => {
    if (err) return next(err);

    res.status(200).json({ message: 'Logged out' });
  });
};