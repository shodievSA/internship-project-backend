import { Router, RequestHandler } from 'express';
import { isProjectUpdateValid } from '@/middlewares/areUpdatedPropsValid';
import memberRouter from './members';
import projectController from '../../../../controllers/projectController';
import { getMemberPermissions } from "../../../../middlewares/getMemberPermissions";
import taskRouter from './tasks'
import inviteRouter from './invites';
import sprintRouter from './sprints'
import timerRouter from './timer';

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

router.use('/:projectId/invites', inviteRouter);
router.use('/:projectId/members', getMemberPermissions, memberRouter);
router.use('/:projectId/tasks', getMemberPermissions, taskRouter);
router.use('/:projectId/sprints', getMemberPermissions, sprintRouter);
router.use('/:projectId/timer', timerRouter);


router.get('/:projectId', getProjectDetails as RequestHandler);
router.patch('/:projectId', getMemberPermissions, isProjectUpdateValid, updateProject as RequestHandler);
router.delete('/:projectId', getMemberPermissions, deleteProject as RequestHandler);


export default router;