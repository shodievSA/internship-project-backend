import { Request, Response, NextFunction } from 'express';

export const authSuccess = (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  res.status(200).type('application/json').json({
    message: 'Login successful',
    user: req.user,
  });
};

export const authFailure = (req: Request, res: Response): void => {
  res.status(401).json({ message: 'Login failed' });
};

export const logout = (req: Request, res: Response, next: NextFunction): void => {
  req.logout((err: any) => {

    if (err) return next(err);

		req.session.destroy(err=> { 
			if (err){ 
				console.error('Error destroying session:', err);
				return res.status(500).json({ message: 'Internal server error' });
			}
			res.clearCookie('connect.sid', {
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				path: '/',
			})
			return res.sendStatus(204);
		  })
  });
};