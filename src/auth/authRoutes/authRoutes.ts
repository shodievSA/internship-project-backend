import passport from 'passport';
import { Router } from 'express';

import {
  authSuccess,
  authFailure,
  logout,
} from '../authControllers/authControllers';


const router = Router();

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar',
                                'https://www.googleapis.com/auth/gmail.readonly',
                                'https://www.googleapis.com/auth/gmail.send',]
}));

router.get('/google/callback', passport.authenticate('google', {
  successRedirect: '/auth/success',
  failureRedirect: '/auth/failure'
}));

router.get('/success', authSuccess);
router.get('/failure', authFailure);
router.get('/logout', logout);

export default router;