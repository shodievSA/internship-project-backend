import express from 'express';
import userController from '../controllers/userController';
import projectController from '../controllers/projectController';
import aiController from '../controllers/aiController';
import { getMemberPermissions } from '../middlewares/getMemberPermissions';

let router = express.Router();

router.get('/me', userController.getMe);
router.delete('/projects/:projectId/members/me', getMemberPermissions, projectController.leaveProject);
router.post('/projects', projectController.createNewProject);
router.get('/projects', projectController.getProjects);
router.get('/projects/:projectId', projectController.ProjectDetails);
router.delete('/projects/:projectId', getMemberPermissions, projectController.deleteProject);
router.patch('/projects/:projectId', projectController.updateProject);
router.patch('/projects/:projectId/members/:memberId', projectController.changeTeamMemberRole);
router.delete('/projects/:projectId/members/:memberId', getMemberPermissions, projectController.removeTeamMember);
router.post('/enhance', aiController.EnhanceText);

export default router;