import { Router, RequestHandler } from 'express';
import userController from '../../../controllers/userController';

const {
    getMe,
    getMailContacts,
} = userController;

const router = Router();

router.get('/', getMe as RequestHandler);
router.get('/gmail-contacts', getMailContacts as RequestHandler)

export default router;