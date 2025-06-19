import { Router } from 'express';
import projectController from '../../../../controllers/projectController';
import { getMemberPermissions } from "../../../../middlewares/getMemberPermissions";

const router = Router({ mergeParams: true });

router.delete('/', getMemberPermissions, projectController.leaveProject);

export default router;