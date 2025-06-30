import { Router, RequestHandler } from 'express';
import { projectUpdateValid } from '@/middlewares/projectUpdateValid';
import memberRouter from './members';
import projectController from '../../../../controllers/projectController';
import { getMemberPermissions } from "../../../../middlewares/getMemberPermissions";
import taskRouter from './tasks'
import inviteRouter from './invites';
const {
	createProject,
	inviteToProject,
	getProjects,
	getProjectDetails,
	updateProject,
	deleteProject
} = projectController;

const router = Router();

router.post('/', createProject as RequestHandler);
router.post('/:projectId/invites', getMemberPermissions, inviteToProject as RequestHandler);
router.get('/', getProjects as RequestHandler);
router.get('/:projectId', getProjectDetails as RequestHandler);
router.patch('/:projectId', getMemberPermissions, projectUpdateValid, updateProject as RequestHandler);
router.delete('/:projectId', getMemberPermissions, deleteProject as RequestHandler);
router.use ('/invites' ,inviteRouter)
router.use('/:projectId/members', memberRouter);
router.use('/:projectId/tasks', getMemberPermissions, taskRouter)


export default router;