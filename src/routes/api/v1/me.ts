import { Router, RequestHandler } from 'express';
import userController from '../../../controllers/userController';

const {
    getMe,
    getMailContacts,
    getInvitations
} = userController;

const router = Router();

router.get('/', getMe as RequestHandler);
router.get('/gmail-contacts', getMailContacts as RequestHandler)
router.get('/invites', getInvitations as RequestHandler)

export default router;