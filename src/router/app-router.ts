import express from 'express';
import userController from '../controllers/userController';
import { isAuth } from '../middlewares/isAuth';
import aiController from '../controllers/aiController';

let router = express.Router();

router.get('/me', isAuth, userController.getMe);
router.post('/new-project', isAuth, userController.createNewProject);
router.get('/projects', isAuth, userController.getProjects);
router.post(
  '/project-details/:projectId',
  isAuth,
  userController.projectDetails
);
router.delete(
  '/delete-project/:projectId',
  isAuth,
  userController.deleteProject
);
router.put('/update-project/:projectId', isAuth, userController.updateProject);
router.post('/enhance', isAuth, aiController.enhanceText);
router.post('/projects/:projectId/tasks', isAuth, userController.createTask);

export default router;
