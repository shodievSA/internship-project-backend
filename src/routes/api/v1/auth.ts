import { Router } from 'express';
import { 
	passportAuthenticate,
	passportAuthenticateRedirect,
	logout,
} from '../../../controllers/authControllers';

const router = Router();

router.get('/google', passportAuthenticate);
router.get('/google/callback', passportAuthenticateRedirect);
router.delete('/logout', logout);

export default router;