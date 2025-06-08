import express from 'express';
import userController from '../controllers/user-controller';

let router = express.Router();

router.get('/me', userController.getMe);

export default router;