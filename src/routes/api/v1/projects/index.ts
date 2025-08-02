import { Router, RequestHandler } from 'express';
import { isProjectUpdateValid } from '@/middlewares/areUpdatedPropsValid';
import memberRouter from './members';
import projectController from '../../../../controllers/projectController';
import memberProductivityController from '../../../../controllers/memberProductivityController';
import { getMemberPermissions } from "../../../../middlewares/getMemberPermissions";
import taskRouter from './tasks'
import inviteRouter from './invites';
import sprintRouter from './sprints'
import timerRouter from './timer';
import summaryRouter from './summary';

const {
	createProject,
	getProjects,
	getProjectDetails,
	updateProject,
	deleteProject
} = projectController;

const {
	getMyProductivityData,
} = memberProductivityController;

const router = Router();

router.post('/', createProject as RequestHandler);
router.get('/', getProjects as RequestHandler);

router.use('/:projectId/invites', inviteRouter);
router.use('/:projectId/members', getMemberPermissions, memberRouter);
router.use('/:projectId/tasks', getMemberPermissions, taskRouter);
router.use('/:projectId/sprints', getMemberPermissions, sprintRouter);
router.use('/:projectId/timer', timerRouter);
router.use('/:projectId/summary', getMemberPermissions, summaryRouter);

// Member productivity routes
router.get('/:projectId/my-productivity', getMemberPermissions, getMyProductivityData as RequestHandler);



router.get('/:projectId', getProjectDetails as RequestHandler);
router.patch('/:projectId', getMemberPermissions, isProjectUpdateValid, updateProject as RequestHandler);
router.delete('/:projectId', getMemberPermissions, deleteProject as RequestHandler);


export default router;