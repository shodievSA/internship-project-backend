import passport from 'passport';
import { Router } from 'express';

import { isAuth } from '../../middlewares/isAuth';
import {
  authSuccess,
  authFailure,
  logout,
} from '../authControllers/authControllers';


const frontend_url = process.env.FRONTEND_URL;

const router = Router();

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar',
                                'https://www.googleapis.com/auth/gmail.readonly',]
}));

router.get('/google/callback', passport.authenticate('google', {
  successRedirect: `${frontend_url}/projects`,
  failureRedirect: `${frontend_url}/sign-in`,
}));

router.get('/success', isAuth, authSuccess);
router.get('/logout', isAuth, logout);
router.get('/failure', authFailure);

export default router;