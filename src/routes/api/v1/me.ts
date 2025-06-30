import { Router, RequestHandler } from 'express';
import userController from '../../../controllers/userController';

const {
    getMe,
    getMailContacts,
    fetchUserNotifications,
} = userController;

const router = Router();

router.get('/', getMe as RequestHandler);
router.get('/gmail-contacts', getMailContacts as RequestHandler);
router.get('/notifications', fetchUserNotifications as RequestHandler);

export default router;