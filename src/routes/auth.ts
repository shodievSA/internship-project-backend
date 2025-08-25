import { Router } from 'express';
import authController from '../controllers/authControllers';

const {
	passportAuth,
	passportRedirect,
	logout
} = authController;

const router = Router();

router.get('/google', passportAuth);
router.get('/google/callback', passportRedirect);
router.delete('/logout', logout);

export default router;