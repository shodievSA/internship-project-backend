import projectController from "../../../../controllers/projectController";
import { getMemberPermissions } from "../../../../middlewares/getMemberPermissions";
import { RequestHandler, Router } from "express";

const router = Router({ mergeParams: true });

router.post('/', projectController.createTask as RequestHandler);
router.patch('/:taskId/status', projectController.changeTaskStatus as RequestHandler);
router.patch('/:taskId', projectController.updateTask as RequestHandler )
router.delete('/:taskId', projectController.deleteTask as RequestHandler);

export default router;
