import { AppError } from '@/types';
import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

const passportAuth = passport.authenticate('google', {
	scope: [
		'profile', 
		'email',
		'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/contacts.readonly'
	]
});

const passportRedirect = passport.authenticate('google', {
	successRedirect: `${process.env.FRONTEND_URL}/projects`,
	failureRedirect: `${process.env.FRONTEND_URL}/sign-in`
});

function logout(req: Request, res: Response, next: NextFunction): void {

	try {

		req.logout((err: any) => {

			if (err) throw new AppError("Unexpected error occured while trying to log you out", 500, true);

			req.session.destroy((err) => { 

				if (err) throw new AppError("Unexpected error occured while trying to destroy your session", 500, true);

				res.clearCookie('connect.sid', {
					httpOnly: true,
					sameSite: 'strict',
					secure: process.env.NODE_ENV === 'production',
					path: '/',
				});

				return res.status(204).json({ message: "Successfully logged you out!" });

			});
		
		});

	} catch (err) {

		next(err);

	}

};

const authController = {
	passportAuth,
	passportRedirect,
	logout
};

export default authController;