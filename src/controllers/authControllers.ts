import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

const passportAuth = passport.authenticate('google', {

	scope: [
		'profile', 
		'email', 
		'https://www.googleapis.com/auth/calendar',
		'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/contacts.readonly'
	]

});

const passportRedirect = passport.authenticate('google', {

	successRedirect: `${process.env.FRONTEND_URL}/projects`,
	failureRedirect: `${process.env.FRONTEND_URL}/sign-in`

});

function logout(
	req: Request, 
	res: Response, 
	next: NextFunction
): void {

	req.logout((err: any) => {

		if (err) return next(err);

		req.session.destroy(err => { 

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

const authController = {
	passportAuth,
	passportRedirect,
	logout
};

export default authController;