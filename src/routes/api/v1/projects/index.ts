import { Router, RequestHandler } from 'express';
import { projectUpdateValid } from '@/middlewares/projectUpdateValid';
import memberRouter from './members';
import projectController from '../../../../controllers/projectController';
import { getMemberPermissions } from "../../../../middlewares/getMemberPermissions";

const {
	createProject,
	getProjects,
	getProjectDetails,
	updateProject,
	deleteProject
} = projectController;

const router = Router();

router.post('/', createProject as RequestHandler);
router.get('/', getProjects as RequestHandler);
router.get('/:projectId', getProjectDetails as RequestHandler);
router.patch('/:projectId', projectUpdateValid, updateProject as RequestHandler);
router.delete('/:projectId', getMemberPermissions, deleteProject as RequestHandler);
router.use('/:projectId/members', memberRouter);

export default router;