import express from 'express';
import userController from '../controllers/userController';
import { isAuth } from '../middlewares/isAuth';
import aiController from '../controllers/aiController';
import { getMemberPermissions } from '../middlewares/getMemberPermissions';

let router = express.Router();

router.get('/me', isAuth, userController.getMe);
router.delete('/projects/:projectId/members/me', isAuth, getMemberPermissions, userController.leaveProject);
router.post('/projects', isAuth, userController.createNewProject);
router.get('/projects', isAuth, userController.getProjects);
router.get('/projects/:projectId', isAuth, userController.ProjectDetails);
router.delete('/projects/:projectId', isAuth, getMemberPermissions, userController.deleteProject);
router.patch('/projects/:projectId', isAuth, userController.updateProject);
router.patch('/projects/:projectId/members/:memberId', isAuth, userController.changeTeamMemberRole);
router.delete('/projects/:projectId/members/:memberId', isAuth, getMemberPermissions, userController.removeTeamMember);
router.post('/enhance', isAuth, aiController.EnhanceText);

export default router;