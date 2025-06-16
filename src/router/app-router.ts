import express from 'express';
import userController from '../controllers/userController';
import { isAuth } from '../middlewares/isAuth';
import aiController from '../controllers/aiController';
import { getMemberPermissions } from '../middlewares/getMemberPermissions';


let router = express.Router();

router.get('/me', isAuth, userController.getMe);
router.post('/new-project', isAuth, userController.createNewProject);
router.get('/projects', isAuth, userController.getProjects);
router.post('/project-details', isAuth, userController.ProjectDetails);
router.delete('/delete-project/:projectId', isAuth, getMemberPermissions, userController.deleteProject);
router.put('/update-project/:projectId', isAuth, userController.updateProject);
router.patch('/projects/:projectId/members/:memberId', isAuth, userController.changeTeamMemberRole);
router.delete('/projects/:projectId/members/:memberId', isAuth, getMemberPermissions, userController.removeTeamMember);
router.post('/enhance', isAuth, aiController.EnhanceText);

export default router;