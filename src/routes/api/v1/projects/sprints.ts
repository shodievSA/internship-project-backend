import { RequestHandler, Router } from "express";
import projectController from "@/controllers/projectController";
import { upload } from "@/middlewares/fileUploads";

const {
    createSprint,
    getSprintsTasks,
    updateSprint,
    deleteSprint,
	createTask
} = projectController;

const router = Router({ mergeParams: true });

router.post('/:sprintId/tasks', upload.array('fileAttachments'), createTask as RequestHandler);
router.get('/:sprintId', getSprintsTasks as RequestHandler)
router.post('/', createSprint as RequestHandler);
router.patch('/:sprintId', updateSprint as RequestHandler);
router.delete('/:sprintId', deleteSprint as RequestHandler);

export default router;
