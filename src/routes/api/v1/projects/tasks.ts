import projectController from "../../../../controllers/projectController";
import { getMemberPermissions } from "../../../../middlewares/getMemberPermissions";
import { RequestHandler, Router } from "express";

const router = Router({ mergeParams: true });

router.post('/', projectController.createTask as RequestHandler);
router.patch('/:taskId', getMemberPermissions, projectController.changeTaskStatus as RequestHandler);

export default router;
