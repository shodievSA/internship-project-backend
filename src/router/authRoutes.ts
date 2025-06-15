import passport from 'passport';
import { Router } from 'express';

import { isAuth } from '../middlewares/isAuth';
import { logout } from '../controllers/authControllers';


const router = Router();

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar',
                                'https://www.googleapis.com/auth/gmail.readonly']
}));

router.get('/google/callback', passport.authenticate('google', {
  successRedirect: `${process.env.FRONTEND_URL}/projects`,
  failureRedirect: `${process.env.FRONTEND_URL}/sign-in`
}));

router.delete('/logout', isAuth, logout);

export default router;