import express from 'express';
import userController from '../controllers/user-controller';
import { isAuth } from '../middlewares/isAuth';

let router = express.Router();

router.get('/me', isAuth, userController.getMe);

export default router;