import { Router } from 'express';
import memberRouter from './members';
import projectController from '../../../../controllers/projectController';
import { getMemberPermissions } from "../../../../middlewares/getMemberPermissions";

const router = Router();

router.post('/', projectController.createNewProject);
router.get('/', projectController.getProjects);
router.get('/:projectId', projectController.ProjectDetails);
router.patch('/:projectId', projectController.updateProject);
router.delete('/:projectId', getMemberPermissions, projectController.deleteProject);
router.use('/:projectId/members', memberRouter);

export default router;