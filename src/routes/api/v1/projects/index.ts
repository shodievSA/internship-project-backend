import { Router } from 'express';
import memberRouter from './members';
import userProjectRouter from './me'
import projectController from '../../../../controllers/projectController';
import { getMemberPermissions } from "../../../../middlewares/getMemberPermissions";

const router = Router();

router.post('/', projectController.createNewProject);
router.get('/', projectController.getProjects);
router.get('/:projectId', projectController.ProjectDetails);
router.put('/:projectId', projectController.updateProject);
router.delete('/:projectId', getMemberPermissions, projectController.deleteProject);
router.use('/:projectId/me', userProjectRouter);
router.use('/:projectId/members', memberRouter);

export default router;